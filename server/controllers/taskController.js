const Task = require('../models/Task');
const Project = require('../models/Project');
const User = require('../models/User');
const Client = require('../models/Client');
const { logActivity } = require('../services/activityService');
const { createNotification } = require('../services/notificationService');

// Helper to filter projects by role (similar to projectController)
const getAllowedProjectsQuery = async (user) => {
  let query = {};
  if (user.role === 'Team Member') {
    query.team = user._id;
  } else if (user.role === 'Client') {
    const clientRecord = await Client.findOne({ email: user.email });
    if (clientRecord) {
      query.client = clientRecord._id;
    } else {
      query._id = '000000000000000000000000';
    }
  }
  return query;
};

// @desc    Get all tasks
// @route   GET /api/tasks
// @access  Private
exports.getTasks = async (req, res) => {
  try {
    const { project, status, assignee, priority, search, tag } = req.query;

    // Security: Only get tasks for projects this user is allowed to access
    const allowedProjectsQuery = await getAllowedProjectsQuery(req.user);
    const allowedProjects = await Project.find(allowedProjectsQuery).select('_id');
    const allowedProjectIds = allowedProjects.map((p) => p._id);

    let query = { project: { $in: allowedProjectIds } };

    // Apply filters
    if (project) {
      // Ensure requested project is in allowed projects
      if (allowedProjectIds.some((id) => id.toString() === project)) {
        query.project = project;
      } else {
        return res.status(403).json({ success: false, message: 'Not authorized to view tasks for this project' });
      }
    }

    if (status) {
      query.status = status;
    }

    if (assignee) {
      query.assignee = assignee;
    }

    if (priority) {
      query.priority = priority;
    }

    if (tag) {
      query.tags = tag;
    }

    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    const tasks = await Task.find(query)
      .populate('project', 'name status')
      .populate('assignee', 'name email role avatar department')
      .populate('comments.user', 'name role avatar')
      .sort({ dueDate: 1 });

    res.status(200).json({ success: true, count: tasks.length, data: tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private
exports.getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('project', 'name status team client')
      .populate('assignee', 'name email role avatar department')
      .populate('comments.user', 'name role avatar')
      .populate('history.user', 'name role avatar');

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Security check: Is user allowed to view this task's project?
    const allowedProjectsQuery = await getAllowedProjectsQuery(req.user);
    const hasAccess = await Project.findOne({
      _id: task.project._id,
      ...allowedProjectsQuery,
    });

    if (!hasAccess) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this task' });
    }

    res.status(200).json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a task
// @route   POST /api/tasks
// @access  Private (Admin, Project Manager)
exports.createTask = async (req, res) => {
  try {
    const { title, description, project, assignee, priority, dueDate, status, tags } = req.body;

    // Check project authorization
    const projectRecord = await Project.findById(project);
    if (!projectRecord) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const task = await Task.create({
      title,
      description,
      project,
      assignee: assignee || null,
      priority: priority || 'Medium',
      dueDate,
      status: status || 'To Do',
      tags: tags || [],
      history: [
        {
          user: req.user._id,
          action: 'Task Created',
          details: `Task created by ${req.user.name}`,
        },
      ],
    });

    // Log Activity
    await logActivity({
      userId: req.user._id,
      userName: req.user.name,
      action: 'Task Created',
      details: `Created task "${title}" in project ${projectRecord.name}`,
      entityType: 'Task',
      entityId: task._id,
    });

    // Notify assignee
    if (assignee) {
      await createNotification({
        recipient: assignee,
        title: 'New Task Assigned',
        message: `You have been assigned the task: ${title}`,
        type: 'Task',
        link: `/tasks?project=${project}`,
      });
    }

    res.status(201).json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a task
// @route   PUT /api/tasks/:id
// @access  Private
exports.updateTask = async (req, res) => {
  try {
    let task = await Task.findById(req.params.id).populate('project');
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const isPMOrAdmin = req.user.role === 'Admin' || req.user.role === 'Project Manager';
    const isAssignee = task.assignee && task.assignee.toString() === req.user.id;

    // Enforce role-based restrictions
    if (!isPMOrAdmin && !isAssignee && req.user.role !== 'Client') {
      return res.status(403).json({ success: false, message: 'Not authorized to update this task' });
    }

    const originalStatus = task.status;
    const originalAssignee = task.assignee ? task.assignee.toString() : null;

    let updateData = {};

    if (isPMOrAdmin) {
      // Admins & PMs can update everything
      updateData = { ...req.body };
    } else {
      // Team Members/Assignees can only update status
      if (req.body.status) {
        updateData.status = req.body.status;
      }
      // Clients shouldn't be updating task fields directly (they use comments/feedback)
      if (req.user.role === 'Client') {
        return res.status(403).json({ success: false, message: 'Clients cannot update task fields directly' });
      }
    }

    // Prepare history logs
    const historyEntries = [];

    if (updateData.status && updateData.status !== originalStatus) {
      historyEntries.push({
        user: req.user._id,
        action: 'Status Changed',
        details: `Moved from "${originalStatus}" to "${updateData.status}"`,
      });
    }

    if (updateData.assignee && updateData.assignee !== originalAssignee) {
      const newAssigneeUser = await User.findById(updateData.assignee);
      historyEntries.push({
        user: req.user._id,
        action: 'Task Reassigned',
        details: `Reassigned to ${newAssigneeUser ? newAssigneeUser.name : 'Unassigned'}`,
      });
    }

    // Update history array
    if (historyEntries.length > 0) {
      updateData.$push = { history: { $each: historyEntries } };
    }

    task = await Task.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate('project', 'name')
      .populate('assignee', 'name email role avatar');

    // Trigger Notification for Status changes
    if (updateData.status && updateData.status !== originalStatus) {
      // Notify Assignee (if PM/Admin changed status)
      if (task.assignee && !isAssignee && isPMOrAdmin) {
        await createNotification({
          recipient: task.assignee._id,
          title: 'Task Status Updated',
          message: `Your task "${task.title}" status was changed to: ${task.status}`,
          type: 'Task',
          link: `/tasks?project=${task.project._id}`,
        });
      }

      // Notify Project Managers/Admins about changes
      // In a real application, we would lookup PMs assigned to the project.
      // For simplicity, we can log the activity
      await logActivity({
        userId: req.user._id,
        userName: req.user.name,
        action: 'Task Status Updated',
        details: `Updated task "${task.title}" status to "${task.status}"`,
        entityType: 'Task',
        entityId: task._id,
      });
    }

    // Trigger Notification for Assignee changes
    if (updateData.assignee && updateData.assignee !== originalAssignee) {
      await createNotification({
        recipient: updateData.assignee,
        title: 'Task Assigned',
        message: `You have been assigned the task: ${task.title}`,
        type: 'Task',
        link: `/tasks?project=${task.project._id}`,
      });
    }

    res.status(200).json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add comment to task
// @route   POST /api/tasks/:id/comments
// @access  Private
exports.addTaskComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ success: false, message: 'Please add comment text' });
    }

    const task = await Task.findById(req.params.id).populate('project');
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const comment = {
      user: req.user._id,
      text,
      createdAt: new Date(),
    };

    task.comments.push(comment);
    task.history.push({
      user: req.user._id,
      action: 'Comment Added',
      details: `${req.user.name} added a comment`,
    });

    await task.save();

    // Populate user details for comment response
    const updatedTask = await Task.findById(req.params.id)
      .populate('comments.user', 'name role avatar')
      .populate('assignee', 'name email role');

    // Notify assignee or other parties
    if (task.assignee && task.assignee.toString() !== req.user.id) {
      await createNotification({
        recipient: task.assignee,
        title: 'New Task Comment',
        message: `${req.user.name} commented on "${task.title}"`,
        type: 'Task',
        link: `/tasks?project=${task.project._id}`,
      });
    }

    res.status(200).json({ success: true, data: updatedTask.comments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Private (Admin, Project Manager)
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    await Task.findByIdAndDelete(req.params.id);

    // Log Activity
    await logActivity({
      userId: req.user._id,
      userName: req.user.name,
      action: 'Task Deleted',
      details: `Deleted task "${task.title}"`,
      entityType: 'Task',
      entityId: task._id,
    });

    res.status(200).json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
