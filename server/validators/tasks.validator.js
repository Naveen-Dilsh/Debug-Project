const Joi = require("joi");
const sendResponse = require("./validation");

class TaskValidation {
  validPhoto(req, res, next) {
    const schema = Joi.object({
      photo: Joi.string().required(),
    });
    sendResponse(req, res, next, schema);
  }
  validDocument(req, res, next) {
    const schema = Joi.object({
      document: Joi.string().required(),
    });
    sendResponse(req, res, next, schema);
  }
  submitDocuments(req, res, next) {
    const schema = Joi.object({
      photo: Joi.string().optional(),
      docFront: Joi.string().required(),
      docBack: Joi.string().required(),
    });
    sendResponse(req, res, next, schema);
  }
  updateTask(req, res, next) {
    const schema = Joi.object({
      sendToAnalyst: Joi.boolean().optional(),
      sendToClient: Joi.boolean().optional(),
      sendToAdmin: Joi.boolean().optional(),
      timeSpent: Joi.object().optional(),
      changes: Joi.boolean().optional(),
      flags: Joi.array().optional(),
      faceMatch: Joi.boolean().optional(),
      issuingCountry: Joi.string().optional(),
      nationality: Joi.string().optional(),
      region: Joi.string().optional(),
      firstName: Joi.string().optional(),
      lastName: Joi.string().optional(),
      documentType: Joi.string().optional(),
      documentNo: Joi.string().optional(),
      personalNo: Joi.string().optional(),
      gender: Joi.string().optional(),
      dateOfBirth: Joi.string().optional(),
      placeOfBirth: Joi.string().optional(),
      dateOfIssue: Joi.string().optional(),
      dateOfExpiry: Joi.string().optional(),
      comment: Joi.string().optional(),
      attachment: Joi.array().optional(),
      iqFail: Joi.string().optional(),
      fraudAssessment: Joi.object().optional(),
      analyst: Joi.string().optional(),
      admin: Joi.string().optional(),
      unassign: Joi.boolean().optional(),
      wcReportStatus: Joi.string().optional(),
      customFields: Joi.object().optional(),
    });
    sendResponse(req, res, next, schema);
  }
}

module.exports = new TaskValidation();
