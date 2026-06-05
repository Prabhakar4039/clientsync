const mongoose = require('mongoose');

const ActivityLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  userName: {
    type: String,
    required: true,
  },
  action: {
    type: String,
    required: true, // e.g., 'Task Created', 'Deliverable Approved'
  },
  details: {
    type: String,
  },
  entityType: {
    type: String,
    enum: ['Task', 'Project', 'Deliverable', 'Client', 'User', 'System'],
    required: true,
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('ActivityLog', ActivityLogSchema);
