var express = require("express");
var router = express.Router();

const { getDocuments } = require("../../controllers/document.controller");

const { jwtAuth } = require("../../helper");

router.get("/", jwtAuth.verifyToken, getDocuments);

module.exports = router;
