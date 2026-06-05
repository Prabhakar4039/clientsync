const Client = require('../models/Client');
const Project = require('../models/Project');
const { logActivity } = require('../services/activityService');

// @desc    Get all clients
// @route   GET /api/clients
// @access  Private
exports.getClients = async (req, res) => {
  try {
    const { search, status, industry } = req.query;
    let query = {};

    // Filter by search term
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by industry
    if (industry) {
      query.industry = industry;
    }

    const clients = await Client.find(query).sort({ name: 1 });
    res.status(200).json({ success: true, count: clients.length, data: clients });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single client
// @route   GET /api/clients/:id
// @access  Private
exports.getClient = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }
    res.status(200).json({ success: true, data: client });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a client
// @route   POST /api/clients
// @access  Private (Admin, Project Manager)
exports.createClient = async (req, res) => {
  try {
    const { name, company, email, phone, industry, status } = req.body;

    const existingClient = await Client.findOne({ email });
    if (existingClient) {
      return res.status(400).json({ success: false, message: 'Client with this email already exists' });
    }

    const client = await Client.create({
      name,
      company,
      email,
      phone,
      industry,
      status: status || 'Active',
    });

    // Log Activity
    await logActivity({
      userId: req.user._id,
      userName: req.user.name,
      action: 'Client Created',
      details: `Created client account for ${name} (${company})`,
      entityType: 'Client',
      entityId: client._id,
    });

    res.status(201).json({ success: true, data: client });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a client
// @route   PUT /api/clients/:id
// @access  Private (Admin, Project Manager)
exports.updateClient = async (req, res) => {
  try {
    let client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    client = await Client.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    // Log Activity
    await logActivity({
      userId: req.user._id,
      userName: req.user.name,
      action: 'Client Updated',
      details: `Updated details for client ${client.name}`,
      entityType: 'Client',
      entityId: client._id,
    });

    res.status(200).json({ success: true, data: client });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a client
// @route   DELETE /api/clients/:id
// @access  Private (Admin)
exports.deleteClient = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    // Check if client is linked to projects
    const linkedProjects = await Project.countDocuments({ client: req.params.id });
    if (linkedProjects > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete client. It is currently associated with ${linkedProjects} project(s).`,
      });
    }

    await Client.findByIdAndDelete(req.params.id);

    // Log Activity
    await logActivity({
      userId: req.user._id,
      userName: req.user.name,
      action: 'Client Deleted',
      details: `Deleted client ${client.name} (${client.company})`,
      entityType: 'Client',
      entityId: client._id,
    });

    res.status(200).json({ success: true, message: 'Client deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
