const Joi = require("joi");
const sendResponse = require("./validation");

class AccountsValidation {
  login(req, res, next) {
    const schema = Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().required(),
    });
    sendResponse(req, res, next, schema);
  }
  createUser(req, res, next) {
    const schema = Joi.object({
      firstName: Joi.string().required(),
      lastName: Joi.string().required(),
      email: Joi.string().email().required(),
      role: Joi.string(),
    });
    sendResponse(req, res, next, schema);
  }
  updateUser(req, res, next) {
    const schema = Joi.object({
      id: Joi.string().required(),
      firstName: Joi.string(),
      lastName: Joi.string(),
      status: Joi.string(),
    });
    sendResponse(req, res, next, schema);
  }
  checkUsername(req, res, next) {
    const schema = Joi.object({
      username: Joi.string().required(),
    });
    sendResponse(req, res, next, schema);
  }
  register(req, res, next) {
    const schema = Joi.object({
      id: Joi.string().required(),
      username: Joi.string().required(),
      password: Joi.string().required(),
    });
    sendResponse(req, res, next, schema);
  }
  forgotPass(req, res, next) {
    const schema = Joi.object({
      email: Joi.string().email().required(),
    });
    sendResponse(req, res, next, schema);
  }
  resetPass(req, res, next) {
    const schema = Joi.object({
      id: Joi.string().required(),
      password: Joi.string().required(),
      verifyId: Joi.string().required(),
    });
    sendResponse(req, res, next, schema);
  }
  updateProfile(req, res, next) {
    const schema = Joi.object({
      logo: Joi.string().optional(),
      favicon: Joi.string().optional(),
      profileImg: Joi.string().optional(),
      firstName: Joi.string().optional(),
      lastName: Joi.string().optional(),
      companyName: Joi.string().optional(),
      username: Joi.string().optional(),
      slug: Joi.string().optional(),
      theme: Joi.number().optional(),
    });
    sendResponse(req, res, next, schema);
  }
  changePass(req, res, next) {
    const schema = Joi.object({
      oldPassword: Joi.string().required(),
      password: Joi.string().required(),
      confirmPassword: Joi.string().optional(),
    });
    sendResponse(req, res, next, schema);
  }
  updateTwoFactor(req, res, next) {
    const schema = Joi.object({
      status: Joi.boolean().required(),
    });
    sendResponse(req, res, next, schema);
  }
  verifyTwoFactor(req, res, next) {
    const schema = Joi.object({
      userId: Joi.string().required(),
      otp: Joi.string().required(),
    });
    sendResponse(req, res, next, schema);
  }
}

module.exports = new AccountsValidation();
