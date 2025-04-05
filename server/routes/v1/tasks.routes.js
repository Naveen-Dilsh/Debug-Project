var express = require("express");
var router = express.Router();

const {
  validPhoto,
  validDocument,
  submitDocuments,
  getTasks,
  updateTask,
  getCountries,
  getDocTypes,
  getNationalities,
} = require("../../controllers/tasks.controller");

const validator = require("../../validators/tasks.validator");

const { jwtAuth } = require("../../helper");

router.post("/validate-photo", validator.validPhoto, validPhoto);
router.post("/validate-document", validator.validDocument, validDocument);
router.post(
  "/submit-documents",
  jwtAuth.verifyToken,
  validator.submitDocuments,
  submitDocuments
);
router.get("/", jwtAuth.verifyToken, getTasks);
router.put("/:taskId", jwtAuth.verifyToken, validator.updateTask, updateTask);
router.get("/countries", jwtAuth.verifyToken, getCountries);
router.get("/doc-types/:code", jwtAuth.verifyToken, getDocTypes);
router.get("/nationalities", jwtAuth.verifyToken, getNationalities);

module.exports = router;
