const mongoose = require("mongoose")
const ObjectId = mongoose.Types.ObjectId

const analystChatSchema = new mongoose.Schema({
  userId: {
    type: ObjectId,
    ref: "accounts", // Reference to the user who initiated the chat
    required: true,
  },
  analystId: {
    type: ObjectId,
    ref: "accounts", // Reference to the analyst
    required: true,
  },
  messages: [
    {
      sender: {
        type: ObjectId,
        ref: "accounts", // Reference to the sender's account
        required: true,
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
      },
      attachment: {
        type: Array,
        default: [],
      },
      isRead: {
        type: Boolean,
        default: false,
      },
    },
  ],
  status: {
    type: String,
    enum: ["active", "closed", "pending"],
    default: "active",
  },
  createdAt: {
    type: Number,
    required: true,
  },
  updatedAt: {
    type: Number,
    required: true,
  },
})

const AnalystChat = mongoose.model("analystChats", analystChatSchema)

module.exports = AnalystChat
