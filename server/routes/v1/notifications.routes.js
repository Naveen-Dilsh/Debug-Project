var express = require("express");
var router = express.Router();

const {
  getNotifications,
  updateNotification,
  updateNotifyMany,
} = require("../../controllers/notification.controller");

const { jwtAuth } = require("../../helper");

router.get("/", jwtAuth.verifyToken, getNotifications);
router.put("/:id", jwtAuth.verifyToken, updateNotification);
router.post("/", jwtAuth.verifyToken, updateNotifyMany);

module.exports = router;
