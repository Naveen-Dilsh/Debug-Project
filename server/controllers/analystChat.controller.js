const ObjectId = require("mongoose").Types.ObjectId
const { response, responser, getUnixTime } = require("../helper")

const AnalystChat = require("../models/analystChat.model")
const Accounts = require("../models/accounts.model")

const message = responser()

// Initialize a chat with an analyst
const initializeChat = async (req, res) => {
  const payload = req.body

  // Validation
  if (!payload) {
    return response.error(res, 400, "Missing request body.")
  }

  if (!payload.userId || !payload.analystId) {
    return response.error(res, 400, "User ID and Analyst ID are required.")
  }

  try {
    // Validate user exists
    const user = await Accounts.findOne({ _id: payload.userId })
    if (!user) {
      return response.error(res, 400, "User not found.")
    }

    // Validate analyst exists
    const analyst = await Accounts.findOne({
      _id: payload.analystId,
      role: "analyst", // Ensure the account is actually an analyst
    })

    if (!analyst) {
      return response.error(res, 400, "Analyst not found.")
    }

    // Check if a chat already exists between these users
    const existingChat = await AnalystChat.findOne({
      userId: payload.userId,
      analystId: payload.analystId,
      status: "active",
    })

    if (existingChat) {
      return response.success(res, 200, "Chat already exists.", {
        chatId: existingChat._id,
      })
    }

    // Add timestamps
    const timestamp = Date.now()
    payload.createdAt = getUnixTime()
    payload.updatedAt = getUnixTime()

    // Prepare welcome message
    const welcomeMessageContent = `Welcome to your analyst chat with ${analyst.firstName} ${analyst.lastName}`
    const senderName = `${analyst.firstName} ${analyst.lastName}`

    // Add welcome message to the chat's messages array
    if (!payload.messages) {
      payload.messages = []
    }

    payload.messages.push({
      sender: payload.analystId,
      content: welcomeMessageContent,
      timestamp: timestamp,
      senderName: senderName,
      attachment: [],
      isRead: false,
    })

    // Create and save the chat
    const newChat = new AnalystChat(payload)
    const savedChat = await newChat.save()

    // Respond with success
    return response.success(res, 201, "Analyst chat initialized successfully.", {
      chatId: savedChat._id,
      userId: savedChat.userId,
      analystId: savedChat.analystId,
      messages: savedChat.messages,
    })
  } catch (error) {
    console.error("Error initializing analyst chat:", error)
    return response.error(res, 500, `Server error: ${error.message || "Unknown error"}`)
  }
}

// Get all chats for a user or analyst
const getChats = async (req, res) => {
  try {
    const userId = req.query.userId
    const analystId = req.query.analystId
    const role = req.query.role

    if (!userId && !analystId) {
      return response.error(res, 400, "Either User ID or Analyst ID is required.")
    }

    let query = { status: "active" }

    if (role === "user" && userId) {
      query.userId = userId
    } else if (role === "analyst" && analystId) {
      query.analystId = analystId
    } else {
      // If both IDs are provided, find chats where either matches
      if (userId && analystId) {
        query = {
          $or: [{ userId: userId }, { analystId: analystId }],
          status: "active",
        }
      } else if (userId) {
        query.userId = userId
      } else if (analystId) {
        query.analystId = analystId
      }
    }

    // Find chats and populate user and analyst details
    const chats = await AnalystChat.find(query)
      .populate("userId", "firstName lastName profileImg")
      .populate("analystId", "firstName lastName profileImg")
      .sort({ updatedAt: -1 })

    return response.success(res, 200, "Chats fetched successfully.", chats)
  } catch (error) {
    console.error("Error fetching analyst chats:", error)
    return response.error(res, 500, `Server error: ${error.message || "Unknown error"}`)
  }
}

// Get messages for a specific chat
const getChatMessages = async (req, res) => {
  try {
    const chatId = req.query.chatId

    if (!chatId) {
      return response.error(res, 400, "Chat ID is required.")
    }

    if (!ObjectId.isValid(chatId)) {
      return response.error(res, 400, "Invalid chat ID format.")
    }

    // Get the chat with its embedded messages
    const chat = await AnalystChat.findById(chatId)
      .populate("userId", "firstName lastName profileImg")
      .populate("analystId", "firstName lastName profileImg")

    if (!chat) {
      return response.error(res, 404, "Chat not found.")
    }

    return response.success(res, 200, "Messages fetched successfully.", chat)
  } catch (error) {
    console.error("Error fetching chat messages:", error)
    return response.error(res, 500, `Server error: ${error.message || "Unknown error"}`)
  }
}

// Save a new message
const saveMessage = async (req, res) => {
  try {
    const payload = req.body
    console.log("Payloadddddddddd:", payload)

    if (!payload) {
      return response.error(res, 400, "Request body is empty.")
    }

    if (!payload.chatId || !payload.senderId || !payload.messageText) {
      return response.error(res, 400, "Missing required message fields.")
    }

    const chat = await AnalystChat.findById(payload.chatId)
    console.log("Chat found:", chat)
    if (!chat) {
      return response.error(res, 404, "Chat not found.")
    }

    const timestamp = Date.now()
    const messageObj = {
      sender: payload.senderId,
      content: payload.messageText,
      timestamp: timestamp,
      senderName: payload.senderName || "Unknown",
      attachment: payload.attachment || [],
      isRead: false,
    }

    // Add message to the chat's messages array
    if (!chat.messages) {
      chat.messages = []
    }
    chat.messages.push(messageObj)
    chat.updatedAt = getUnixTime()
    await chat.save()

    return response.success(res, 201, "Message added successfully.", messageObj)
  } catch (error) {
    console.error("Error while inserting message:", error)
    return response.error(res, 500, `Server error: ${error.message || "Unknown error"}`)
  }
}

// Mark messages as read
const markMessagesAsRead = async (req, res) => {
  try {
    const { chatId, userId } = req.body

    if (!chatId || !userId) {
      return response.error(res, 400, "Chat ID and User ID are required.")
    }

    // Update messages in the chat
    const chat = await AnalystChat.findById(chatId)
    if (!chat) {
      return response.error(res, 404, "Chat not found.")
    }

    // Mark messages as read where the sender is not the current user
    if (chat.messages && chat.messages.length > 0) {
      chat.messages = chat.messages.map((msg) => {
        if (msg.sender.toString() !== userId) {
          return { ...msg, isRead: true }
        }
        return msg
      })

      chat.updatedAt = getUnixTime()
      await chat.save()
    }

    return response.success(res, 200, "Messages marked as read.")
  } catch (error) {
    console.error("Error marking messages as read:", error)
    return response.error(res, 500, `Server error: ${error.message || "Unknown error"}`)
  }
}

// Close a chat
const closeChat = async (req, res) => {
  try {
    const chatId = req.params.chatId

    if (!chatId) {
      return response.error(res, 400, "Chat ID is required.")
    }

    if (!ObjectId.isValid(chatId)) {
      return response.error(res, 400, "Invalid chat ID format.")
    }

    const chat = await AnalystChat.findById(chatId)
    if (!chat) {
      return response.error(res, 404, "Chat not found.")
    }

    chat.status = "closed"
    chat.updatedAt = getUnixTime()
    await chat.save()

    return response.success(res, 200, "Chat closed successfully.")
  } catch (error) {
    console.error("Error closing chat:", error)
    return response.error(res, 500, `Server error: ${error.message || "Unknown error"}`)
  }
}

module.exports = {
  initializeChat,
  getChats,
  getChatMessages,
  saveMessage,
  markMessagesAsRead,
  closeChat,
}