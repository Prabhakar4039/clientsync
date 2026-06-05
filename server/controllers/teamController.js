const User = require('../models/User');
const Task = require('../models/Task');
const { logActivity } = require('../services/activityService');

// @desc    Get all team members (excluding Clients)
// @route   GET /api/team
// @access  Private
exports.getTeamMembers = async (req, res) => {
  try {
    const team = await User.find({ role: { $ne: 'Client' } }).sort({ name: 1 });

    // Enforce high fidelity stats calculations for each team member
    const teamWithStats = await Promise.all(
      team.map(async (member) => {
        const totalTasks = await Task.countDocuments({ assignee: member._id });
        const completedTasks = await Task.countDocuments({ assignee: member._id, status: 'Completed' });
        const pendingTasks = totalTasks - completedTasks;

        return {
          _id: member._id,
          name: member.name,
          email: member.email,
          role: member.role,
          department: member.department,
          performance: member.performance || { completedTasks: 0, efficiency: 90 },
          avatar: member.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(member.name)}`,
          stats: {
            totalTasks,
            completedTasks,
            pendingTasks,
            productivityRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 100,
          },
        };
      })
    );

    res.status(200).json({ success: true, count: teamWithStats.length, data: teamWithStats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a team member
// @route   POST /api/team
// @access  Private (Admin)
exports.createTeamMember = async (req, res) => {
  try {
    const { name, email, password, role, department } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists with this email' });
    }

    if (role === 'Client') {
      return res.status(400).json({ success: false, message: 'Use client endpoints to create client accounts' });
    }

    const member = await User.create({
      name,
      email,
      password,
      role: role || 'Team Member',
      department: department || 'General',
    });

    // Log Activity
    await logActivity({
      userId: req.user._id,
      userName: req.user.name,
      action: 'Team Member Created',
      details: `Created team member account for ${name} (${role})`,
      entityType: 'User',
      entityId: member._id,
    });

    res.status(201).json({
      success: true,
      data: {
        _id: member._id,
        name: member.name,
        email: member.email,
        role: member.role,
        department: member.department,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update team member role or department
// @route   PUT /api/team/:id
// @access  Private (Admin)
exports.updateTeamMember = async (req, res) => {
  try {
    let member = await User.findById(req.params.id);
    if (!member) {
      return res.status(404).json({ success: false, message: 'Team member not found' });
    }

    if (member.role === 'Client') {
      return res.status(400).json({ success: false, message: 'Cannot modify client role here' });
    }

    member = await User.findByIdAndUpdate(
      req.params.id,
      {
        role: req.body.role,
        department: req.body.department,
        performance: req.body.performance,
      },
      { new: true, runValidators: true }
    );

    // Log Activity
    await logActivity({
      userId: req.user._id,
      userName: req.user.name,
      action: 'Team Member Updated',
      details: `Updated role/department of team member ${member.name}`,
      entityType: 'User',
      entityId: member._id,
    });

    res.status(200).json({ success: true, data: member });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete team member
// @route   DELETE /api/team/:id
// @access  Private (Admin)
exports.deleteTeamMember = async (req, res) => {
  try {
    const member = await User.findById(req.params.id);
    if (!member) {
      return res.status(404).json({ success: false, message: 'Team member not found' });
    }

    // Unassign tasks from this user
    await Task.updateMany({ assignee: req.params.id }, { assignee: null });

    await User.findByIdAndDelete(req.params.id);

    // Log Activity
    await logActivity({
      userId: req.user._id,
      userName: req.user.name,
      action: 'Team Member Deleted',
      details: `Deleted team member account for ${member.name}`,
      entityType: 'User',
      entityId: member._id,
    });

    res.status(200).json({ success: true, message: 'Team member deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
