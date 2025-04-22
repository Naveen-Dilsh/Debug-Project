var express = require("express")
var router = express.Router()

const {
  initializeChat,
  getChats,
  getChatMessages,
  saveMessage,
  markMessagesAsRead,
  closeChat,
} = require("../../controllers/analystChat.controller")

// Initialize a new chat with an analyst
router.post("/initialize", initializeChat)

// Get all chats for a user or analyst
router.get("/chats", getChats)

// Get messages for a specific chat
router.get("/messages", getChatMessages)

// Save a new message
router.post("/message", saveMessage)

// Mark messages as read
router.post("/read", markMessagesAsRead)

// Close a chat
router.put("/close/:chatId", closeChat)

module.exports = router
