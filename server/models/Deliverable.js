const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  text: {
    type: String,
    required: true,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const DeliverableSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a deliverable title'],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  fileName: {
    type: String,
    required: [true, 'Please provide the file name'],
  },
  fileUrl: {
    type: String,
    required: [true, 'Please provide the file URL or local path'],
  },
  fileType: {
    type: String,
    enum: ['Design', 'Report', 'PDF', 'Other'],
    default: 'Other',
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: [true, 'Please associate this deliverable with a project'],
  },
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Please specify who submitted this deliverable'],
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending',
  },
  feedback: [FeedbackSchema],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Deliverable', DeliverableSchema);
