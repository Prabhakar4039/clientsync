const Milestone = require('../models/Milestone');
const Project = require('../models/Project');
const { logActivity } = require('../services/activityService');
const { createNotification } = require('../services/notificationService');

// @desc    Get milestones for a project
// @route   GET /api/milestones
// @access  Private
exports.getMilestones = async (req, res) => {
  try {
    const { project } = req.query;
    if (!project) {
      return res.status(400).json({ success: false, message: 'Please specify a project ID' });
    }

    const milestones = await Milestone.find({ project }).sort({ dueDate: 1 });
    res.status(200).json({ success: true, count: milestones.length, data: milestones });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a milestone
// @route   POST /api/milestones
// @access  Private (Admin, Project Manager)
exports.createMilestone = async (req, res) => {
  try {
    const { name, dueDate, completionPercent, project } = req.body;

    const projectRecord = await Project.findById(project);
    if (!projectRecord) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const milestone = await Milestone.create({
      name,
      dueDate,
      completionPercent: completionPercent || 0,
      project,
    });

    // Log Activity
    await logActivity({
      userId: req.user._id,
      userName: req.user.name,
      action: 'Milestone Created',
      details: `Created milestone "${name}" for project "${projectRecord.name}"`,
      entityType: 'Project',
      entityId: projectRecord._id,
    });

    // Notify project team
    for (const memberId of projectRecord.team) {
      await createNotification({
        recipient: memberId,
        title: 'New Milestone Created',
        message: `Milestone "${name}" has been added to project "${projectRecord.name}".`,
        type: 'Milestone',
        link: `/projects/${projectRecord._id}`,
      });
    }

    res.status(201).json({ success: true, data: milestone });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a milestone
// @route   PUT /api/milestones/:id
// @access  Private (Admin, Project Manager)
exports.updateMilestone = async (req, res) => {
  try {
    let milestone = await Milestone.findById(req.params.id);
    if (!milestone) {
      return res.status(404).json({ success: false, message: 'Milestone not found' });
    }

    const originalCompletion = milestone.completionPercent;

    milestone = await Milestone.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    const projectRecord = await Project.findById(milestone.project);

    // Notify if completion reaches 100%
    if (milestone.completionPercent === 100 && originalCompletion !== 100) {
      for (const memberId of projectRecord.team) {
        await createNotification({
          recipient: memberId,
          title: 'Milestone Achieved!',
          message: `Milestone "${milestone.name}" in project "${projectRecord.name}" is completed.`,
          type: 'Milestone',
          link: `/projects/${projectRecord._id}`,
        });
      }
    }

    // Log Activity
    await logActivity({
      userId: req.user._id,
      userName: req.user.name,
      action: 'Milestone Updated',
      details: `Updated milestone "${milestone.name}" (Completion: ${milestone.completionPercent}%)`,
      entityType: 'Project',
      entityId: milestone.project,
    });

    res.status(200).json({ success: true, data: milestone });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a milestone
// @route   DELETE /api/milestones/:id
// @access  Private (Admin, Project Manager)
exports.deleteMilestone = async (req, res) => {
  try {
    const milestone = await Milestone.findById(req.params.id);
    if (!milestone) {
      return res.status(404).json({ success: false, message: 'Milestone not found' });
    }

    await Milestone.findByIdAndDelete(req.params.id);

    // Log Activity
    await logActivity({
      userId: req.user._id,
      userName: req.user.name,
      action: 'Milestone Deleted',
      details: `Deleted milestone "${milestone.name}"`,
      entityType: 'Project',
      entityId: milestone.project,
    });

    res.status(200).json({ success: true, message: 'Milestone deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
