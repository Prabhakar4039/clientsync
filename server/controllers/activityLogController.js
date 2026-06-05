const ActivityLog = require('../models/ActivityLog');
const Project = require('../models/Project');
const Client = require('../models/Client');

// Helper to filter allowed projects (similar to projectController)
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
  return projects.map((p) => p._id);
};

// @desc    Get activity logs
// @route   GET /api/activities
// @access  Private
exports.getActivityLogs = async (req, res) => {
  try {
    let query = {};

    // Standard users (Team Members, Clients) only see actions relating to their projects or actions they performed themselves
    if (req.user.role !== 'Admin' && req.user.role !== 'Project Manager') {
      const allowedProjectIds = await getAllowedProjects(req.user);

      query.$or = [
        { user: req.user.id }, // Logs triggered by user
        { entityType: 'Project', entityId: { $in: allowedProjectIds } }, // Projects they belong to
      ];
    }

    const logs = await ActivityLog.find(query)
      .populate('user', 'name role avatar')
      .sort({ createdAt: -1 })
      .limit(50); // Keep it performant by returning the latest 50 logs

    res.status(200).json({ success: true, count: logs.length, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
