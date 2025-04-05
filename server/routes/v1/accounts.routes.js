var express = require("express");
var router = express.Router();

const {
  login,
  logout,
  checkUsername,
  register,
  forgotPass,
  resetPass,
  getProfile,
  updateProfile,
  checkProfileUsername,
  changePass,
  updateTwoFactor,
  verifyTwoFactor,
  getUsers,
  createUser,
  updateUser,
  approveReset,
  reqActivation,
} = require("../../controllers/accounts.controller");

const { jwtAuth } = require("../../helper");

const validator = require("../../validators/accounts.validator");

router.post("/login", validator.login, login);
router.post("/logout", logout);
router.post("/check-username", validator.checkUsername, checkUsername);
router.post(
  "/check-profile-username",
  validator.checkUsername,
  jwtAuth.verifyToken,
  checkProfileUsername
);
router.post("/register", validator.register, register);
router.post("/forgot-password", validator.forgotPass, forgotPass);
router.post("/reset-password", validator.resetPass, resetPass);
router.get("/profile", jwtAuth.verifyToken, getProfile);
router.put(
  "/profile",
  jwtAuth.verifyToken,
  validator.updateProfile,
  updateProfile
);
router.put(
  "/change-password",
  jwtAuth.verifyToken,
  validator.changePass,
  changePass
);
router.put(
  "/update-two-factor",
  jwtAuth.verifyToken,
  validator.updateTwoFactor,
  updateTwoFactor
);
router.post("/verify-two-factor", validator.verifyTwoFactor, verifyTwoFactor);
router.get("/user",  getUsers);
router.post("/user", validator.createUser,  createUser);
router.put("/user", validator.updateUser, jwtAuth.verifyToken, updateUser);
router.get("/user/approve-reset/:id", jwtAuth.verifyToken, approveReset);
router.post("/request-activation", reqActivation);

module.exports = router;
