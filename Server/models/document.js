const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },

  type: {
    type: String,
    enum: ['text', 'code', 'canvas'],
    required: true,
  },

  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  activeSession: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CollabSession',
  },
  lastSession: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CollabSession',
  },
  collaborators: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  ],
  code: {
    type: String,
    unique: true,
    match: /^\d{6}$/, 
  },
  content: {
    type: String,
    default: '',
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },

  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

documentSchema.pre('save', async function (next) {
  if (this.isNew) {
    let codeExists = true;
    while (codeExists) {
      const randomCode = String(Math.floor(100000 + Math.random() * 900000));
      const existingDoc = await mongoose.models.Document.findOne({ code: randomCode });
      if (!existingDoc) {
        this.code = randomCode;
        codeExists = false;
      }
    }
  }
  next();
});

module.exports = mongoose.model('Document', documentSchema);
