const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  icon: {
    type: String,
  },
  createdBy: {
    type: ObjectId,
    ref: "accounts", // Assuming the creator is from the "accounts" model
    required: true,
  },
  members: [
    {
      type: ObjectId,
      ref: "accounts", // Reference to "accounts" model for the members
    },
  ],
  messages: [
    {
      sender: {
        type: ObjectId,
        ref: "accounts", // Reference to the sender's account
      },
      content: {
        type: String,
      },
      timestamp: {
        type: Number,
        required: true,
      },
      senderName: {
        type: String,
        required: false,
      },
      attachment:{
        type:Array
      }
    },
  ],
  createdAt: {
    type: Number,
    required: true,
  },
  updatedAt: {
    type: Number,
  },
});

const Groups = mongoose.model("groups", groupSchema);

module.exports = Groups;
