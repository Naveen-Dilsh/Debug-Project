const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

const groupMessageSchema = new mongoose.Schema({
    groupId: {
        type: ObjectId,
        ref: "groups", 
      },
          sender: {
            type: ObjectId,
            ref: "accounts", 
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
          
        },
        status:{type:String},
      createdAt: {
        type: Number,
        required: true,
      },
      updatedAt: {
        type: Number,
      },
});

const groupMessage = mongoose.model("groupMessage",groupMessageSchema);

module.exports = groupMessage;