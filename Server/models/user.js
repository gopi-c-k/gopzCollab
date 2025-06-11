const mongoose = require('mongoose');
// User Model
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    profilePic: {
        type: String
    },
    provider: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    sessions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CollabSession'
    }],
    uid: {
        type: String,
        required: true
    },
    documents: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Document'
    }]
})

module.exports = mongoose.model('User', userSchema);