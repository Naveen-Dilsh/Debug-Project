// .post(auth('sendMessages'), validate(messageValidation.createMessage), messageController.createMessage)
const express = require('express');

const { createMessage, getMessages } = require('../../controllers/messages.controller');
const router = express.Router();

router.post('/', createMessage); // To send a message
router.post('/chats', getMessages); // To fetch messages for a chat by receiverChatID and senderChatID

module.exports = router;
