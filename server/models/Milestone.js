const mongoose = require('mongoose');

const MilestoneSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a milestone name'],
    trim: true,
  },
  dueDate: {
    type: Date,
    required: [true, 'Please add a milestone due date'],
  },
  completionPercent: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: [true, 'Please link this milestone to a project'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Milestone', MilestoneSchema);
