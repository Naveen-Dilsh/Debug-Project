const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

const notificationSchema = new mongoose.Schema({
  to: {
    type: String,
  },
  subject: {
    type: String,
  },
  link: {
    type: String,
  },
  status: {
    type: String,
    default: "U",
    enum: ["U", "I", "R", "D"],
  },
  important: {
    type: Boolean,
  },
  createdBy: {
    type: ObjectId,
    ref: "accounts",
  },
  createdAt: {
    type: Number,
  },
  updatedAt: {
    type: Number,
  },
});

const Notification = mongoose.model("notification", notificationSchema);

module.exports = Notification;
