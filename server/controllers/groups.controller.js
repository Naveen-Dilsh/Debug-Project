const ObjectId = require("mongoose").Types.ObjectId
const { response, responser, getUnixTime } = require("../helper")

const Groups = require("../models/groups.model")
const Accounts = require("../models/accounts.model")
const GroupMessage = require("../models/groupMessage.model")

const message = responser()

const createGroup = async (req, res) => {
  const payload = req.body

  // Improved validation
  if (!payload) {
    return response.error(res, 400, "Missing request body.")
  }

  if (!payload.name || !payload.createdBy) {
    return response.error(res, 400, "Group name and creator are required.")
  }

  try {
    // Validate creator exists
    const creator = await Accounts.findOne({ _id: payload.createdBy })
    if (!creator) {
      return response.error(res, 400, "Creator not found.")
    }

    // Add timestamps
    payload.createdAt = getUnixTime()
    payload.updatedAt = getUnixTime()

    // Prepare welcome message
    const welcomeMessageContent = `Welcome to the group!\nCreated by ${creator.firstName} ${creator.lastName}`
    const timestamp = Date.now()
    const senderName = `${creator.firstName} ${creator.lastName}`

    // Add welcome message to the group's messages array
    if (!payload.messages) {
      payload.messages = []
    }

    payload.messages.push({
      sender: payload.createdBy,
      content: welcomeMessageContent,
      timestamp: timestamp,
      senderName: senderName,
      attachment: [],
    })

    // Create and save the group
    const newGroup = new Groups(payload)
    const savedGroup = await newGroup.save()

    try {
      // Also save welcome message to the GroupMessage collection
      await GroupMessage.create({
        groupId: savedGroup._id,
        content: welcomeMessageContent,
        sender: payload.createdBy,
        timestamp: timestamp,
        senderName: senderName,
        attachment: [],
        createdAt: getUnixTime(),
        updatedAt: getUnixTime(),
        status: "Y",
      })

      // Respond with success
      return response.success(res, 201, "Group created successfully.", {
        groupId: savedGroup._id,
        name: savedGroup.name,
        createdBy: savedGroup.createdBy,
        members: savedGroup.members,
      })
    } catch (messageError) {
      console.error("Error creating welcome message in GroupMessage collection:", messageError)

      // Even if separate message collection fails, return success for group creation
      return response.success(res, 201, "Group created, but separate welcome message failed.", {
        groupId: savedGroup._id,
        name: savedGroup.name,
      })
    }
  } catch (error) {
    console.error("Error creating group:", error)

    // More detailed error response
    return response.error(res, 500, `Server error: ${error.message || "Unknown error"}`)
  }
}

// Update the getGroupMessages function to fetch from both places
const getGroupMessages = async (req, res) => {
  try {
    const groupId = req.query.groupId // Note: Changed from req.params to req.query to match your client code

    if (!groupId) {
      return response.error(res, 400, "Group ID is required.")
    }

    if (!ObjectId.isValid(groupId)) {
      return response.error(res, 400, "Invalid group ID format.")
    }

    // First, get the group with its embedded messages
    const group = await Groups.findById(groupId)
    if (!group) {
      return response.error(res, 404, "Group not found.")
    }

    // Then, get any additional messages from the GroupMessage collection
    const additionalMessages = await GroupMessage.find({ groupId: groupId }).sort({ timestamp: 1 })

    // Combine both sets of messages
    const allMessages = {
      ...group.toObject(),
      messages: group.messages || [], // Use embedded messages if they exist
    }

    return response.success(res, 200, "Messages fetched successfully.", allMessages)
  } catch (error) {
    console.error("Error fetching group messages:", error)
    return response.error(res, 500, `Server error: ${error.message || "Unknown error"}`)
  }
}

// Keep the rest of your functions the same...

const uploadGroupIcon = async (req, res) => {
  try {
    const groupId = req.params.groupId

    // Check if we have a file in the request (from FormData)
    let icon = null

    if (req.file) {
      // If using multer middleware, the file will be in req.file
      // Convert file to base64 or save to storage and get URL
      const fileBuffer = req.file.buffer
      icon = `data:${req.file.mimetype};base64,${fileBuffer.toString("base64")}`
    } else if (req.body.icon) {
      // If sent as JSON
      icon = req.body.icon
    }

    if (!groupId) {
      return response.error(res, 400, "Group ID is required.")
    }

    // Validate groupId is a valid ObjectId
    if (!ObjectId.isValid(groupId)) {
      return response.error(res, 400, "Invalid group ID format.")
    }

    // Find the group
    const group = await Groups.findById(groupId)
    if (!group) {
      return response.error(res, 404, "Group not found.")
    }

    // Update the group with the icon (if provided)
    if (icon) {
      group.icon = icon
      group.updatedAt = getUnixTime()
      await group.save()

      console.log("Group icon updated successfully")
      return response.success(res, 200, "Group icon updated successfully.")
    } else {
      return response.error(res, 400, "No icon provided in the request.")
    }
  } catch (error) {
    console.error("Error uploading group icon:", error)
    return response.error(res, 500, `Server error: ${error.message || "Unknown error"}`)
  }
}

const saveMessage = async (req, res) => {
  try {
    const payload = req.body

    if (!payload) {
      return { success: false, message: "Request body is empty." }
    }

    if (!payload.groupId || !payload.senderId || !payload.messageText) {
      return { success: false, message: "Missing required message fields." }
    }

    const group = await Groups.findById(payload.groupId)
    if (!group) {
      return { success: false, message: "Group not found." }
    }

    const timestamp = Date.now()
    const messageObj = {
      sender: payload.senderId,
      content: payload.messageText,
      timestamp: timestamp,
      senderName: payload.senderName || "Unknown",
      attachment: payload.attachment || [],
    }

    // Add message to the group's messages array
    if (!group.messages) {
      group.messages = []
    }
    group.messages.push(messageObj)
    group.updatedAt = getUnixTime()
    await group.save()

    // Also save to the separate GroupMessage collection
    const groupMessageObj = {
      groupId: payload.groupId,
      content: payload.messageText,
      sender: payload.senderId,
      timestamp: timestamp,
      senderName: payload.senderName || "Unknown",
      attachment: payload.attachment || [],
      createdAt: getUnixTime(),
      updatedAt: getUnixTime(),
      status: "Y",
    }

    await GroupMessage.create(groupMessageObj)

    console.log("Message added successfully.")
    return { success: true, message: "Message added successfully." }
  } catch (error) {
    console.error("Error while inserting message:", error)
    return { success: false, message: `Error inserting message: ${error.message}` }
  }
}

const getAllGroups = async (req, res) => {
  try {
    const groups = await Groups.find()
    return response.success(res, 200, "Groups fetched successfully.", groups)
  } catch (error) {
    console.error("Error fetching groups:", error)
    return response.error(res, 500, `Server error: ${error.message || "Unknown error"}`)
  }
}

const deleteGroup = async (req, res) => {
  try {
    const groupId = req.params.groupId

    if (!groupId) {
      return response.error(res, 400, "Group ID is required.")
    }

    if (!ObjectId.isValid(groupId)) {
      return response.error(res, 400, "Invalid group ID format.")
    }

    // Delete all messages from the GroupMessage collection
    await GroupMessage.deleteMany({ groupId: groupId })

    // Delete the group
    const deletedGroup = await Groups.findByIdAndDelete(groupId)

    if (!deletedGroup) {
      return response.error(res, 404, "Group not found.")
    }

    return response.success(res, 200, "Group deleted successfully.")
  } catch (error) {
    console.error("Error deleting group:", error)
    return response.error(res, 500, `Server error: ${error.message || "Unknown error"}`)
  }
}

// Export all your functions
module.exports = {
  uploadGroupIcon,
  createGroup,
  getAllGroups,
  saveMessage,
  getGroupMessages,
  deleteGroup,
}

