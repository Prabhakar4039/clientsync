const Deliverable = require('../models/Deliverable');
const Project = require('../models/Project');
const User = require('../models/User');
const Client = require('../models/Client');
const { logActivity } = require('../services/activityService');
const { createNotification } = require('../services/notificationService');

// Helper to filter allowed project IDs (similar to projectController)
const getAllowedProjects = async (user) => {
  let query = {};
  if (user.role === 'Team Member') {
    query.team = user._id;
  } else if (user.role === 'Client') {
    const clientRecord = await Client.findOne({ email: user.email });
    if (clientRecord) {
      query.client = clientRecord._id;
    } else {
      return [];
    }
  }
  const projects = await Project.find(query).select('_id');
  return projects.map(p => p._id.toString());
};

// @desc    Get all deliverables
// @route   GET /api/deliverables
// @access  Private
exports.getDeliverables = async (req, res) => {
  try {
    const { project, status } = req.query;

    const allowedProjectIds = await getAllowedProjects(req.user);
    let query = { project: { $in: allowedProjectIds } };

    if (project) {
      if (allowedProjectIds.includes(project)) {
        query.project = project;
      } else {
        return res.status(403).json({ success: false, message: 'Not authorized to access deliverables for this project' });
      }
    }

    if (status) {
      query.status = status;
    }

    const deliverables = await Deliverable.find(query)
      .populate('project', 'name')
      .populate('submittedBy', 'name role avatar')
      .populate('feedback.user', 'name role avatar')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: deliverables.length, data: deliverables });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a deliverable
// @route   POST /api/deliverables
// @access  Private (Admin, Project Manager, Team Member)
exports.createDeliverable = async (req, res) => {
  try {
    const { title, description, project, fileType, externalUrl } = req.body;

    const allowedProjectIds = await getAllowedProjects(req.user);
    if (!allowedProjectIds.includes(project)) {
      return res.status(403).json({ success: false, message: 'Not authorized to submit deliverables for this project' });
    }

    let fileName = '';
    let fileUrl = '';

    if (req.file) {
      fileName = req.file.originalname;
      fileUrl = `/uploads/${req.file.filename}`;
    } else if (externalUrl) {
      fileName = 'External Link / Design Share';
      fileUrl = externalUrl;
    } else {
      return res.status(400).json({ success: false, message: 'Please upload a file or provide an external link' });
    }

    const projectRecord = await Project.findById(project).populate('client');

    const deliverable = await Deliverable.create({
      title,
      description,
      fileName,
      fileUrl,
      fileType: fileType || 'Other',
      project,
      submittedBy: req.user._id,
      status: 'Pending',
    });

    // Log Activity
    await logActivity({
      userId: req.user._id,
      userName: req.user.name,
      action: 'Deliverable Uploaded',
      details: `Submitted deliverable "${title}" for project "${projectRecord.name}"`,
      entityType: 'Deliverable',
      entityId: deliverable._id,
    });

    // Notify Client users associated with this project client
    if (projectRecord.client) {
      const clientUsers = await User.find({ email: projectRecord.client.email });
      for (const clientUser of clientUsers) {
        await createNotification({
          recipient: clientUser._id,
          title: 'Deliverable Ready for Review',
          message: `A new deliverable "${title}" has been uploaded for your project "${projectRecord.name}".`,
          type: 'Deliverable',
          link: `/deliverables`,
        });
      }
    }

    res.status(201).json({ success: true, data: deliverable });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Review & Update deliverable status (Approve/Reject)
// @route   PUT /api/deliverables/:id/status
// @access  Private (Client, Admin, Project Manager)
exports.reviewDeliverable = async (req, res) => {
  try {
    const { status, feedbackText } = req.body;

    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status. Must be "Approved" or "Rejected"' });
    }

    let deliverable = await Deliverable.findById(req.params.id)
      .populate('project')
      .populate('submittedBy');

    if (!deliverable) {
      return res.status(404).json({ success: false, message: 'Deliverable not found' });
    }

    // Role safety checks: Only Client matching project's client, or Admin/PM can review
    if (req.user.role === 'Client') {
      const clientRecord = await Client.findOne({ email: req.user.email });
      if (!clientRecord || deliverable.project.client.toString() !== clientRecord._id.toString()) {
        return res.status(403).json({ success: false, message: 'Not authorized to review this deliverable' });
      }
    }

    deliverable.status = status;

    if (feedbackText) {
      deliverable.feedback.push({
        user: req.user._id,
        text: feedbackText,
        createdAt: new Date(),
      });
    }

    await deliverable.save();

    // Log Activity
    await logActivity({
      userId: req.user._id,
      userName: req.user.name,
      action: `Deliverable ${status}`,
      details: `Deliverable "${deliverable.title}" was ${status.toLowerCase()} by ${req.user.name}`,
      entityType: 'Deliverable',
      entityId: deliverable._id,
    });

    // Notify submitting user
    await createNotification({
      recipient: deliverable.submittedBy._id,
      title: `Deliverable ${status}`,
      message: `Your deliverable "${deliverable.title}" was ${status.toLowerCase()} by ${req.user.name}.`,
      type: 'Deliverable',
      link: `/deliverables`,
    });

    res.status(200).json({ success: true, data: deliverable });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add feedback to deliverable
// @route   POST /api/deliverables/:id/feedback
// @access  Private
exports.addFeedback = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ success: false, message: 'Feedback text is required' });
    }

    let deliverable = await Deliverable.findById(req.params.id)
      .populate('project')
      .populate('submittedBy');

    if (!deliverable) {
      return res.status(404).json({ success: false, message: 'Deliverable not found' });
    }

    deliverable.feedback.push({
      user: req.user._id,
      text,
      createdAt: new Date(),
    });

    await deliverable.save();

    const updatedDeliverable = await Deliverable.findById(req.params.id)
      .populate('feedback.user', 'name role avatar')
      .populate('submittedBy', 'name email');

    // Notify submitting user if someone else commented
    if (deliverable.submittedBy._id.toString() !== req.user.id) {
      await createNotification({
        recipient: deliverable.submittedBy._id,
        title: 'New Feedback on Deliverable',
        message: `${req.user.name} added feedback on "${deliverable.title}"`,
        type: 'Deliverable',
        link: `/deliverables`,
      });
    }

    res.status(200).json({ success: true, data: updatedDeliverable.feedback });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
