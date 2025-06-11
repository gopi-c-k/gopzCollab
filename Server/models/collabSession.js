const mongoose = require('mongoose');

const CollabSessionSchema = new mongoose.Schema({
  docId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true,
  },

  participants: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  ],

  startedAt: {
    type: Date,
    default: Date.now,
  },

  isLive: {
    type: Boolean,
    default: true,
  },

  lastPing: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('CollabSession', CollabSessionSchema);
