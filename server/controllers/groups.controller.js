const ObjectId = require("mongoose").Types.ObjectId;
var speakeasy = require("speakeasy");
var QRCode = require("qrcode");
let moment =require("moment")
const ShortUniqueId = require("short-unique-id");

const {
  response,
  responser,
  crypto,
  jwtAuth,
  sendEmail,
  getUnixTime,
} = require("../helper");

const Groups = require("../models/groups.model");
const Accounts = require("../models/accounts.model");
const Message = require("../models/message.model");
const groupMessage = require("../models/groupMessage.model")
const client_url = process.env.CLIENT_URL;

let message = responser();

const createGroup = async function (req, res) {
  const payload = req.body;
  if (!payload) {
    return response.error(
      res,
      400,
      "Missing required fields."
    );
  }
  if (!payload.name || !payload.createdBy) {
    return response.error(res, 400, "Group name and creator are required.");
  }

  try {
    const creator = await Accounts.findOne({ _id: payload.createdBy });
    if (!creator) {
      return response.error(res, 400, "Creator not found.");
    }
    payload.createdAt = getUnixTime();
    payload.updatedAt = getUnixTime();

    const newGroup = new Groups(payload);
    await newGroup.save();

    // Insert the first welcome message or any initial message
    const requestBody = {
      groupId: newGroup._id, // Explicitly name the key
      senderId: payload.createdBy, // Explicitly name the key
      messageText: "Welcome to the group!\ncreated by " +
               creator.firstName +
               " " +
               creator.lastName
    };
    
    const messageResponse = await saveMessage({body:requestBody}, res);

    if (!messageResponse.success) {
      return response.error(res, 500, messageResponse.message);
    }

    // Respond with success
    return response.success(res, 201, "Group created successfully.", { groupId: newGroup._id });
  } catch (error) {
    console.log(error);
    return response.error(res, 500, "Server error, please try again.");
  }
};

const getAllGroups = async function (req, res) {
  try {
    // Query the Groups collection to get all groups
    let groups = await Groups.aggregate([
     
      {
         $lookup: {
            from: 'groupmessages',
            localField: '_id', 
            foreignField: 'groupId',
            pipeline: [
               { $match: { status: {$ne:'D'} } },
               { $sort: { createdAt: -1 } }, // Sort messages by newest first
               { $limit: 1 }
            ],
            as: 'messages'
         }
      },
      {
         $addFields: { totalMessages: { $size: "$messages" } }
      },
      {
         $sort: { createdAt: -1 } 
      },
   ]);   
    if (groups.length === 0) {
      return response.error(res, 404, "No groups found.");
    }
    // Respond with the list of groups
    return response.success(res, 200, "Groups fetched successfully.", groups);
  } catch (error) {
    console.log(error);
    return response.error(res, 500, "Server error, please try again.");
  }
};

const saveMessage = async function (req, res) {
  try {
    const payload = req.body;
    console.log(JSON.stringify(payload));
    if (!payload) {
      return { success: false, message: "Request body must contain a 'data' property." };
    }
   
    const group = await Groups.findById(payload.groupId);

    if (!group) {
      return { success: false, message: "Group not found." };
    }
   
    let obj={
      groupId: payload.groupId,
      content: payload.messageText,
      sender: payload.senderId,
      timestamp: Date.now(),
      senderName: payload.senderName,
      attachment:payload.attachment,
      createdAt: new Date(),
      updatedAt: new Date(),
      status:"Y"
    }
    console.log(obj,"resydtfygui")
  await  GroupMessage.create(obj)
    
    console.log("Message added successfully.");
    return { success: true, message: "Message added successfully." };
  } catch (error) {
    console.log("Error while inserting message:", error);
    return { success: false, message: "Error inserting message." };
  }
};

const getGroupMessages = async function (req, res) {
  try {
    const groupId = req.query.groupId;
    let group = await Groups.aggregate([
      {
         $match: {
            _id: new ObjectId(groupId) 
         }
      },
      {
         $lookup: {
            from: 'groupmessages',
            localField: '_id', 
            foreignField: 'groupId',
            pipeline: [
               { $match: { status: {$ne:'D'} } },
            ],
            as: 'messages'
         }
      },
      {
         $addFields: { totalMessages: { $size: "$messages" } }
      },
      {
         $sort: { createdAt: -1 } 
      },
   ]);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }
    
    return res.status(200).json({
      success: true,
      messages: group[0],
    });
  } catch (error) {
    console.log(error.message,"waerstydjyuku");
    return response.error(res, 500, "Server error, please try again.");
  }
}


const deleteGroup = async (req, res) => {
  try {
    // Correctly extract the groupId from params
    const { groupId } = req.params;

    console.log(`ID id : ${groupId}`)

    // Validate if the groupId is a valid MongoDB ObjectId
    if (!ObjectId.isValid(groupId)) {
      return res.status(400).json({ message: "Invalid group ID format." });
    }

    console.log(`Deleting Group with ID: ${groupId}`);

    // Check if the group exists before deleting
    const group = await Groups.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found." });
    }

    // Delete all associated messages (fix: ensure correct ObjectId usage)
    await groupMessage.deleteMany({ groupId: new ObjectId(groupId) });

    // Delete the group itself
    await Groups.findByIdAndDelete(groupId);

    return res.status(200).json({ message: "Group deleted successfully." });
  } catch (error) {
    console.error("Error deleting group:", error);
    return res.status(500).json({ message: "Failed to delete group." });
  }
};




module.exports = {
  createGroup,
  getAllGroups,
  saveMessage,
  getGroupMessages,
  deleteGroup,
};

