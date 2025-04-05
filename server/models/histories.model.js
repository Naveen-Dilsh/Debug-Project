const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

const historySchema = new mongoose.Schema({
  taskId: {
    type: String,
  },
  content: {
    type: String,
  },
  description: {
    type: Array,
  },
  comment: {
    type: String,
  },
  attachment: {
    type: Array,
  },
  updatedBy: {
    type: ObjectId,
    ref: "accounts",
  },
  createdAt: {
    type: Number,
  },
});

const History = mongoose.model("histories", historySchema);

module.exports = History;
