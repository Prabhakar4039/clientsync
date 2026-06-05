const Project = require('../models/Project');
const Client = require('../models/Client');
const User = require('../models/User');
const Milestone = require('../models/Milestone');
const Task = require('../models/Task');
const { logActivity } = require('../services/activityService');
const { createNotification } = require('../services/notificationService');

// Helper to filter projects by role
const getQueryForRole = async (user) => {
  let query = {};

  if (user.role === 'Team Member') {
    // Only see projects where they are in the team array
    query.team = user._id;
  } else if (user.role === 'Client') {
    // Find client with user's email
    const clientRecord = await Client.findOne({ email: user.email });
    if (clientRecord) {
      query.client = clientRecord._id;
    } else {
      // Return empty search if no client matches email
      query._id = '000000000000000000000000'; 
    }
  }
  // Admin and Project Manager can see all projects
  return query;
};

// @desc    Get all projects
// @route   GET /api/projects
// @access  Private
exports.getProjects = async (req, res) => {
  try {
    const roleQuery = await getQueryForRole(req.user);
    const { status, priority, search } = req.query;

    let query = { ...roleQuery };

    if (status) {
      query.status = status;
    }
    if (priority) {
      query.priority = priority;
    }
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const projects = await Project.find(query)
      .populate('client')
      .populate('team', 'name email role department avatar')
      .sort({ endDate: 1 });

    res.status(200).json({ success: true, count: projects.length, data: projects });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Private
exports.getProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('client')
      .populate('team', 'name email role department avatar');

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Role-based auth check
    if (req.user.role === 'Team Member' && !project.team.some(member => member._id.toString() === req.user.id)) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this project' });
    }

    if (req.user.role === 'Client') {
      const clientRecord = await Client.findOne({ email: req.user.email });
      if (!clientRecord || project.client._id.toString() !== clientRecord._id.toString()) {
        return res.status(403).json({ success: false, message: 'Not authorized to view this project' });
      }
    }

    // Get project milestones & tasks for summary
    const milestones = await Milestone.find({ project: project._id }).sort({ dueDate: 1 });
    const tasksCount = await Task.countDocuments({ project: project._id });
    const completedTasksCount = await Task.countDocuments({ project: project._id, status: 'Completed' });

    res.status(200).json({
      success: true,
      data: {
        ...project.toObject(),
        milestones,
        stats: {
          totalTasks: tasksCount,
          completedTasks: completedTasksCount,
          progress: tasksCount > 0 ? Math.round((completedTasksCount / tasksCount) * 100) : 0,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a project
// @route   POST /api/projects
// @access  Private (Admin)
exports.createProject = async (req, res) => {
  try {
    const { name, description, startDate, endDate, budget, priority, status, client, team } = req.body;

    const project = await Project.create({
      name,
      description,
      startDate,
      endDate,
      budget,
      priority: priority || 'Medium',
      status: status || 'Planning',
      client,
      team: team || [],
    });

    // Log Activity
    await logActivity({
      userId: req.user._id,
      userName: req.user.name,
      action: 'Project Created',
      details: `Created project ${name} with a budget of $${budget}`,
      entityType: 'Project',
      entityId: project._id,
    });

    // Notify assigned team members
    if (team && team.length > 0) {
      for (const memberId of team) {
        await createNotification({
          recipient: memberId,
          title: 'New Project Assignment',
          message: `You have been assigned to the project: ${name}`,
          type: 'Project',
          link: `/projects/${project._id}`,
        });
      }
    }

    res.status(201).json({ success: true, data: project });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a project
// @route   PUT /api/projects/:id
// @access  Private (Admin, Project Manager)
exports.updateProject = async (req, res) => {
  try {
    let project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const originalTeam = project.team.map(id => id.toString());
    const originalStatus = project.status;

    project = await Project.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('client');

    const updatedTeam = project.team.map(id => id.toString());

    // Check for newly added team members and notify them
    const newlyAdded = updatedTeam.filter(id => !originalTeam.includes(id));
    for (const memberId of newlyAdded) {
      await createNotification({
        recipient: memberId,
        title: 'Assigned to Project',
        message: `You have been added to the project: ${project.name}`,
        type: 'Project',
        link: `/projects/${project._id}`,
      });
    }

    // Check for status change
    if (originalStatus !== project.status) {
      // Notify team members
      for (const memberId of project.team) {
        await createNotification({
          recipient: memberId,
          title: 'Project Status Updated',
          message: `Project ${project.name} is now: ${project.status}`,
          type: 'Project',
          link: `/projects/${project._id}`,
        });
      }

      // Notify client if they have an account
      const clientUser = await User.findOne({ email: project.client.email });
      if (clientUser) {
        await createNotification({
          recipient: clientUser._id,
          title: 'Project Status Update',
          message: `Your project ${project.name} has been updated to: ${project.status}`,
          type: 'Project',
          link: `/projects/${project._id}`,
        });
      }
    }

    // Log Activity
    await logActivity({
      userId: req.user._id,
      userName: req.user.name,
      action: 'Project Updated',
      details: `Updated project ${project.name} (Status: ${project.status})`,
      entityType: 'Project',
      entityId: project._id,
    });

    res.status(200).json({ success: true, data: project });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a project
// @route   DELETE /api/projects/:id
// @access  Private (Admin)
exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Delete tasks, milestones, etc., associated with this project
    await Task.deleteMany({ project: req.params.id });
    await Milestone.deleteMany({ project: req.params.id });
    await Project.findByIdAndDelete(req.params.id);

    // Log Activity
    await logActivity({
      userId: req.user._id,
      userName: req.user.name,
      action: 'Project Deleted',
      details: `Deleted project ${project.name} and all associated tasks and milestones`,
      entityType: 'Project',
      entityId: project._id,
    });

    res.status(200).json({ success: true, message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
