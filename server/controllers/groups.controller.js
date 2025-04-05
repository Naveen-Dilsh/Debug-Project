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

    // Create and save the group
    const newGroup = new Groups(payload)
    const savedGroup = await newGroup.save()

    // Prepare welcome message with all required fields
    const welcomeMessage = {
      groupId: savedGroup._id,
      senderId: payload.createdBy,
      messageText: `Welcome to the group!\nCreated by ${creator.firstName} ${creator.lastName}`,
      senderName: `${creator.firstName} ${creator.lastName}`,
      attachment: [],
    }

    try {
      // Save welcome message
      await GroupMessage.create({
        groupId: welcomeMessage.groupId,
        content: welcomeMessage.messageText,
        sender: welcomeMessage.senderId,
        timestamp: Date.now(),
        senderName: welcomeMessage.senderName,
        attachment: welcomeMessage.attachment || [],
        createdAt: new Date(),
        updatedAt: new Date(),
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
      console.error("Error creating welcome message:", messageError)

      // Even if welcome message fails, return success for group creation
      return response.success(res, 201, "Group created, but welcome message failed.", {
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

const uploadGroupIcon = async (req, res) => {
  try {
    const groupId = req.params.groupId;
    
    // Check if we have a file in the request (from FormData)
    let icon = null;
    
    if (req.file) {
      // If using multer middleware, the file will be in req.file
      // Convert file to base64 or save to storage and get URL
      const fileBuffer = req.file.buffer;
      icon = `data:${req.file.mimetype};base64,${fileBuffer.toString('base64')}`;
    } else if (req.body.icon) {
      // If sent as JSON
      icon = req.body.icon;
    }
    
    if (!groupId) {
      return response.error(res, 400, "Group ID is required.");
    }
    
    // Validate groupId is a valid ObjectId
    if (!ObjectId.isValid(groupId)) {
      return response.error(res, 400, "Invalid group ID format.");
    }
    
    // Find the group
    const group = await Groups.findById(groupId);
    if (!group) {
      return response.error(res, 404, "Group not found.");
    }
    
    // Update the group with the icon (if provided)
    if (icon) {
      group.icon = icon;
      group.updatedAt = getUnixTime();
      await group.save();
      
      console.log("Group icon updated successfully");
      return response.success(res, 200, "Group icon updated successfully.");
    } else {
      return response.error(res, 400, "No icon provided in the request.");
    }
  } catch (error) {
    console.error("Error uploading group icon:", error);
    return response.error(res, 500, `Server error: ${error.message || "Unknown error"}`);
  }
};

// Keep your other functions as they are...

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

    const obj = {
      groupId: payload.groupId,
      content: payload.messageText,
      sender: payload.senderId,
      timestamp: Date.now(),
      senderName: payload.senderName || "Unknown",
      attachment: payload.attachment || [],
      createdAt: new Date(),
      updatedAt: new Date(),
      status: "Y",
    }

    await GroupMessage.create(obj)

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

const getGroupMessages = async (req, res) => {
  try {
    const groupId = req.params.groupId

    if (!groupId) {
      return response.error(res, 400, "Group ID is required.")
    }

    if (!ObjectId.isValid(groupId)) {
      return response.error(res, 400, "Invalid group ID format.")
    }

    const messages = await GroupMessage.find({ groupId: groupId }).sort({ timestamp: 1 })
    return response.success(res, 200, "Messages fetched successfully.", messages)
  } catch (error) {
    console.error("Error fetching group messages:", error)
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
