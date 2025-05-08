const mongoose = require('mongoose');

const timelineEventSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'File',
    required: true
  },
  eventDate: {
    type: Date,
    required: true
  },
  eventType: {
    type: String,
    required: true,
    enum: ['Diagnosis', 'Treatment', 'Medication', 'Test', 'Surgery', 'Follow-up']
  },
  description: {
    type: String,
    required: true
  },
  hospital: {
    type: String,
    required: true
  },
  severity: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    required: true
  },
  relatedConditions: [{
    type: String
  }],
  medications: [{
    name: String,
    dosage: String,
    frequency: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient querying
timelineEventSchema.index({ userId: 1, eventDate: -1 });

module.exports = mongoose.model('TimelineEvent', timelineEventSchema); 