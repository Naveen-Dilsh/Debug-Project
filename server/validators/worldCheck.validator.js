const Joi = require("joi");
const sendResponse = require("./validation");

class TaskValidation {
  updateWcReport(req, res, next) {
    const schema = Joi.object({
      remarks: Joi.string().optional(),
      status: Joi.string().optional(),
      results: Joi.object().optional(),
    });
    sendResponse(req, res, next, schema);
  }
}

module.exports = new TaskValidation();
