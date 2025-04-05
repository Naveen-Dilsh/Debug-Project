// database schema

const mongoose = require('mongoose');
// const { toJSON, paginate } = require('./plugins');

const messageSchema = mongoose.Schema(
  {
    text: {
      type: String,
      trim: true,
    },
    attachment:{type:Array},
    senderChatID: {
      type: String,
      required: true,
      trim: true,
    },
    receiverChatID: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
// messageSchema.plugin(toJSON);
// messageSchema.plugin(paginate);

/**
 * @typedef Message
 */
const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
