const mongoose = require("mongoose");
const { Schema } = mongoose;

// This schema stores the relationship between two users
const connectionSchema = new Schema({
  user1: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  user2: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
});

// Ensuring that we don't create duplicate connections in both directions
connectionSchema.index({ user1: 1, user2: 1 }, { unique: true });

module.exports = mongoose.model('Connection', connectionSchema);
