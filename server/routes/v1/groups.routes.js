var express = require("express");
var router = express.Router();

const {
  createGroup,
  getAllGroups,
  saveMessage,
  getGroupMessages,
  deleteGroup,
  uploadGroupIcon,
} = require("../../controllers/groups.controller");

router.post("/initgroup", createGroup);
router.get("/groups", getAllGroups);
router.post("/savemessage", saveMessage);
router.get("/groups/:groupId/messages", getGroupMessages);
router.delete('/groups/:groupId', deleteGroup);
router.post('/uploadGroupIcon/:groupId', uploadGroupIcon);
module.exports = router;
