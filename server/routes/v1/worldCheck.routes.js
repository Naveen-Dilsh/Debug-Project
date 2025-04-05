var express = require("express");
var router = express.Router();

const {
  getWcReport,
  updateWcReport,
} = require("../../controllers/worldCheck.controller");

const { jwtAuth } = require("../../helper");

const validator = require("../../validators/worldCheck.validator");

router.get("/:id", jwtAuth.verifyToken, getWcReport);
router.put(
  "/:searchId",
  jwtAuth.verifyToken,
  validator.updateWcReport,
  updateWcReport
);

module.exports = router;
