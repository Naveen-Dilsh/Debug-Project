const ObjectId = require("mongoose").Types.ObjectId;
var speakeasy = require("speakeasy");
var QRCode = require("qrcode");
const ShortUniqueId = require("short-unique-id");

const {
  response,
  responser,
  crypto,
  jwtAuth,
  sendEmail,
  getUnixTime,
} = require("../helper");

const Accounts = require("../models/accounts.model");

const client_url = process.env.CLIENT_URL;

let message = responser();

const login = async function (req, res, next) {
  let { email, password } = req.body;

  try {
    const client = await Accounts.findOne({ email });

    if (!client) return response.error(res, 401, "Invalid user.");
    if (password) {
      const isValid = await crypto.compare(client.password, password);
      if (isValid) {
        await Accounts.updateOne({ _id: client._id }, { isOnline: true });
        io.emit("user-status", { userId: client._id, isOnline: true });
        if (client?.status == "A") {
          let token = await jwtAuth.generateToken(client);
          return response.success(res, 200, "Logged in Successfully.", {
            accessToken: token,
          });
        } else if (client?.status == "P") {
          return response.error(res, 401, "Account pending.");
        } else if (client?.status == "I") {
          return response.error(res, 401, "Account inactive.");
        }
      } else {
        return response.error(res, 401, "Invalid credentials.");
      }
    } else {
      return response.error(
        res,
        401,
        "This account no longer available, Contact admin."
      );
    }
  } catch (error) {
    return response.error(res, 400, "Unable to login, Please try again.");
  }
};

const logout = async function (req, res, next) {
  try {
    const userId = req.body.userId;
    await Accounts.updateOne({ _id: userId }, { isOnline: false });
    console.log("Logout successfully")
    io.emit("user-status", { userId, isOnline: false });

    return response.success(res, 200, "Logout successfully.");
  } catch (error) {
    console.log(error);
    return response.error(res, 500, "Internal server error.");
  }
};

const createUser = async function (req, res, next) {
  const payload = req.body;
  const generateUniqueId = () => {
    return new ObjectId().toString();
  };

  payload["id"] = generateUniqueId();
  console.log("payload : ", payload);

  try {
    const email_exists = await Accounts.findOne({ email: payload["email"] });

    if (email_exists) {
      return response.error(
        res,
        400,
        "Email already exists, Please try any other."
      );
    } else {
      const master = await Accounts.findOne({ _id: payload.id });
      if (master) {
        if (master["role"] == "client") {
          payload["role"] = "end-user";
        } else if (master["role"] == "admin") {
          payload["role"] = payload["role"];
        } else {
          payload["role"] = null;
        }
      }

      payload["parent"] = payload.id;

      payload["createdAt"] = getUnixTime();

      await Accounts.create(payload, function (err, data) {
        console.log(err);
        if (!err) {
          jwtAuth.generateToken(data).then((token) => {
            console.log(`Sign-up link: ${client_url}/signup/${token}`);
            sendEmail(
              payload.email, //payload["email"]
              "Welcome to NorthLark Wren",
              "onboarding-user.html",
              {
                link: `${client_url}/signup/${token}`,
              }
            )
              .then((success) => {
                console.log("Sign-up mail sent");
              })
              .catch((err) => {
                return response.error(
                  res,
                  400,
                  "Unable to send sign-up mail, Please try again."
                );
              });
          });
          return response.success(res, 201, "User created successfully.");
        } else {
          return response.error(
            res,
            message["server_error"]["status"],
            message["server_error"]["message"]
          );
        }
      });
    }
  } catch (error) {
    console.log(error);
    return response.error(
      res,
      message["server_error"]["status"],
      message["server_error"]["message"]
    );
  }
};

const checkUsername = async function (req, res, next) {
  let { username } = req.body;

  try {
    const username_exists = await Accounts.findOne({ username });

    if (username_exists) {
      return response.error(
        res,
        400,
        "Username already exists, Please try any other."
      );
    } else {
      return response.success(res, 200, "Username is available.");
    }
  } catch (error) {
    return response.error(
      res,
      message["server_error"]["status"],
      message["server_error"]["message"]
    );
  }
};

const register = async function (req, res, next) {
  let { id, username, password } = req.body;

  try {
    const user = await Accounts.findOne({ _id: id });

    if (!user?.password) {
      if (password) {
        let encrypted = await crypto.encrypt(password);
        await Accounts.updateOne(
          { _id: id },
          {
            username,
            password: encrypted,
            status: "A",
          },
          { new: true }
        );
        io.emit("users", { update: true });
        return response.success(res, 201, "Registered successfully.");
      }
    } else {
      return response.error(
        res,
        400,
        "Account setup already completed, Please login."
      );
    }
  } catch (error) {
    console.log(error);
    return response.error(
      res,
      message["server_error"]["status"],
      message["server_error"]["message"]
    );
  }
};

const forgotPass = async function (req, res, next) {
  let { email } = req.body;

  try {
    const user = await Accounts.findOne({ email });
    if (user) {
      if (!user?.resetReq) {
        const client = await Accounts.findOne(
          user?.role == "end-user" ? { _id: id } : { role: "super-admin" }
        );

        const { randomUUID } = new ShortUniqueId({ length: 10 });
        let verifyId = randomUUID();

        await Accounts.updateOne(
          { _id: user.id },
          {
            resetReq: true,
            verifyId,
          }
        );
        sendEmail(
          "vaheeshan@northlark.com", // client.email,
          "Reset password",
          "user-request-password-reset.html",
          {
            client: client.username,
            user: `${user.firstName} ${user.lastName}`,
            link: `${client_url}/app/edit-user/${user.id}`,
          }
        )
          .then((success) => {
            console.log("Reset request email sent.");
          })
          .catch((err) => {
            return response.error(
              res,
              400,
              "Unable to reset password now, Please try again."
            );
          });
        return response.success(
          res,
          200,
          "Your reset password request has been sent."
        );
      } else {
        return response.error(
          res,
          401,
          "Your reset password request has been sent already."
        );
      }
    } else {
      return response.error(res, 401, "Invalid user.");
    }
  } catch (error) {
    console.log(error);
    return response.error(
      res,
      message["server_error"]["status"],
      message["server_error"]["message"]
    );
  }
};

const resetPass = async function (req, res, next) {
  let { id, password, verifyId } = req.body;

  try {
    let user = await Accounts.findById(ObjectId(id));

    if (user["verifyId"] == verifyId) {
      if (password) {
        let encrypted = await crypto.encrypt(password);
        await Accounts.updateOne(
          { _id: id },
          {
            password: encrypted,
            verifyId: null,
          }
        );
        return response.success(res, 200, "Password reset successfully.");
      }
    } else {
      return response.error(
        res,
        message["unauthorized"]["status"],
        "Reset password link was expired."
      );
    }
  } catch (error) {
    console.log(error);
    return response.error(
      res,
      message["server_error"]["status"],
      message["server_error"]["message"]
    );
  }
};

const getProfile = async function (req, res, next) {
  let user = req.user;

  try {
    if (user?.role == "end-user") {
      let endUser = await Accounts.findById(ObjectId(user?.id));
      user["id"] = endUser.parent;
    }

    let data = await Accounts.aggregate([
      {
        $match: { _id: ObjectId(user?.id) },
      },
      {
        $project: {
          profileImg: 1,
          logo: 1,
          favicon: 1,
          companyName: 1,
          slug: 1,
          theme: 1,
          firstName: 1,
          lastName: 1,
          username: 1,
          email: 1,
          twoFactor: 1,
        },
      },
    ]);
    return response.success(
      res,
      200,
      "Profile details get successfully.",
      data[0]
    );
  } catch (error) {
    console.log(error);
    return response.error(
      res,
      message["server_error"]["status"],
      message["server_error"]["message"]
    );
  }
};

const checkProfileUsername = async function (req, res, next) {
  let { username } = req.body;
  let user = req.user;

  try {
    const username_exists = await Accounts.findOne({ username });

    if (username_exists) {
      if (username_exists["username"] == user["username"]) {
        return response.success(res, 200, "Username is available.");
      } else {
        return response.error(
          res,
          409,
          "Username already exists, Please try any other."
        );
      }
    } else {
      return response.success(res, 200, "Username is available.");
    }
  } catch (error) {
    console.log(error);

    return response.error(
      res,
      message["server_error"]["status"],
      message["server_error"]["message"]
    );
  }
};

const updateProfile = async function (req, res, next) {
  let { id } = req.user;
  let payload = req.body;

  try {
    if (id) {
      await Accounts.updateOne(
        { _id: id },
        {
          ...payload,
        }
      );
      return response.success(res, 200, "Profile updated successfully.");
    } else {
      return response.error(
        res,
        message["unauthorized"]["status"],
        message["unauthorized"]["message"]
      );
    }
  } catch (error) {
    console.log(error);
    return response.error(
      res,
      message["server_error"]["status"],
      message["server_error"]["message"]
    );
  }
};

const changePass = async function (req, res, next) {
  let { id } = req.user;
  let { oldPassword, password } = req.body;

  try {
    if (id) {
      let client = await Accounts.findById(ObjectId(id));

      const isValid = await crypto.compare(client.password, oldPassword);
      if (isValid) {
        let encrypted = await crypto.encrypt(password);
        await Accounts.updateOne(
          { _id: id },
          {
            password: encrypted,
          }
        );
        return response.success(res, 200, "Profile updated successfully.");
      } else {
        return response.success(res, 401, "Old password is incorrect.");
      }
    } else {
      return response.error(
        res,
        message["unauthorized"]["status"],
        message["unauthorized"]["message"]
      );
    }
  } catch (error) {
    console.log(error);
    return response.error(
      res,
      message["server_error"]["status"],
      message["server_error"]["message"]
    );
  }
};

const updateTwoFactor = async function (req, res, next) {
  let { id, email } = req.user;
  let { status } = req.body;

  try {
    if (id) {
      let options = {
        name: `Wren <${email}>`,
        issuer: "NorthLark",
      };

      if (status) {
        var secret = speakeasy.generateSecret(options);

        QRCode.toDataURL(secret.otpauth_url, async function (err, data_url) {
          if (err) {
            return response.error(
              res,
              message["server_error"]["status"],
              message["server_error"]["message"]
            );
          } else {
            let data = {
              twoFactor: false,
              qrCode: data_url,
              secretKey: secret?.base32,
            };
            await Accounts.updateOne({ _id: id }, { ...data });
            return response.success(
              res,
              200,
              "2-Factor authentication enabled.",
              data
            );
          }
        });
      } else {
        let data = {
          twoFactor: false,
          qrCode: "",
          secretKey: "",
        };
        await Accounts.updateOne({ _id: id }, { ...data });
        return response.success(
          res,
          200,
          "2-Factor authentication disabled.",
          data
        );
      }
    } else {
      return response.error(
        res,
        message["unauthorized"]["status"],
        message["unauthorized"]["message"]
      );
    }
  } catch (error) {
    console.log(error);
    return response.error(
      res,
      message["server_error"]["status"],
      message["server_error"]["message"]
    );
  }
};

const verifyTwoFactor = async function (req, res, next) {
  let { userId, otp } = req.body;
  let { first } = req.query;

  try {
    if (userId) {
      const user = await Accounts.findOne({ _id: userId });

      var verified = speakeasy.totp.verify({
        secret: user?.secretKey,
        encoding: "base32",
        token: otp,
      });
      if (verified) {
        if (first) {
          await Accounts.updateOne({ _id: userId }, { twoFactor: true });
        }
        return response.success(res, 200, "Verified successfully.");
      } else {
        return response.error(res, 422, "Invalid OTP, Please try again.");
      }
    } else {
      return response.error(
        res,
        message["unauthorized"]["status"],
        message["unauthorized"]["message"]
      );
    }
  } catch (error) {
    console.log(error);
    return response.error(
      res,
      message["server_error"]["status"],
      message["server_error"]["message"]
    );
  }
};

const getUsers = async function name(req, res, next) {
  console.log("req.query: ", req.query);
  let { limit, skip, id } = req.query;
  console.log("req.query: ", req.query);

  let query = {};

  let message = responser();
  let user = req.user;

  try {
    let project = {
      profileImg: 1,
      firstName: 1,
      lastName: 1,
      username: 1,
      email: 1,
      role: 1,
      status: 1,
      resetReq: 1,
      companyName: 1,
      isOnline: 1,
    };
    if (id) {
      let account = await Accounts.findById(id);
      if (["admin", "analyst", "client"].includes(account.role)) {
        if (account.role == "client") {
          query["parent"] = { $eq: ObjectId(user?.id) };
        }
        if (account.role == "analyst") {
          query["role"] = { $eq: "client" };
        }
        if (account.role == "admin") {
          query["$and"] = [
            { role: { $ne: "end-user" } },
            { role: { $ne: "super-admin" } },
          ];
        }
        if (id) {
          query["_id"] = { $eq: ObjectId(id) };

          let user = await Accounts.aggregate([
            {
              $match: { ...query },
            },
            {
              $project: { ...project },
            },
          ]);

          return response.success(res, 200, "Get user successfully.", user[0]);
        } 
   
      } else {
        return response.error(
          res,
          message["unauthorized"]["status"],
          message["unauthorized"]["message"]
        );
      }
    } else {
      let users = await Accounts.aggregate([
        {
          $match: { status: { $ne: "D" } },
        },
        {
          $match: { ...query },
        },
        {
          $skip: skip ? Number(skip) : 0,
        },
        {
          $limit: limit ? Number(limit) : 50,
        },
        {
          $sort: { createdAt: 1 },
        },
        {
          $project: { ...project },
        },
      ]);

      delete query["status"];

      let counts = await Accounts.aggregate([
        {
          $match: query,
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: {
                $cond: [{ $ne: ["$status", "D"] }, 1, 0],
              },
            },
          },
        },
      ]);

      let data = {
        list: users,
        count: counts[0] || { total: 0 },
      };

      return response.success(res, 200, "Get all users successfully.", data);
    }

    console.log("account : ", account);
  } catch (error) {
    console.log("error :" + error);
    return response.error(
      res,
      message["server_error"]["status"],
      message["server_error"]["message"]
    );
  }
};

const updateUser = async function (req, res, next) {
  let user = req.user;
  let payload = req.body;

  try {
    let account = await Accounts.findOne({ _id: payload?.id });

    if (account?.parent == user?.id || user?.role == "admin") {
      await Accounts.updateOne(
        { _id: payload?.id },
        {
          ...payload,
        }
      );
      if (payload?.status && payload.status === "A") {
        sendEmail(
          "vaheeshan@northlark.com", // account.email,
          "Account activated",
          "admin-activate-account.html",
          {
            username: `${account.firstName} ${account.lastName}`,
            link: `${client_url}/login`,
          }
        )
          .then((success) => {
            console.log("Mail sended.");
          })
          .catch((err) => {
            return response.error(res, 400, "Unable to send email.");
          });
      }
      return response.success(res, 200, "User details updated successfully.");
    } else {
      return response.error(
        res,
        message["unauthorized"]["status"],
        message["unauthorized"]["message"]
      );
    }
  } catch (error) {
    console.log(error);
    return response.error(
      res,
      message["server_error"]["status"],
      message["server_error"]["message"]
    );
  }
};

const approveReset = async function (req, res, next) {
  let { id } = req.params;
  let client = req.user;

  try {
    const user = await Accounts.findById(ObjectId(id));
    if (user) {
      if (user.role == "end-user") {
        if (client?.id != user["parent"]) {
          return response.error(
            res,
            message["unauthorized"]["status"],
            message["unauthorized"]["message"]
          );
        }
      }

      await Accounts.updateOne(
        { _id: user.id },
        {
          resetReq: false,
        }
      );
      await jwtAuth.generateToken(user).then((token) => {
        sendEmail(
          "vaheeshan@northlark.com", // client.email,
          "Reset password",
          "admin-resets-password.html",
          {
            user: `${user.firstName} ${user.lastName}`,
            link: `${client_url}/reset-password/${token}`,
          }
        )
          .then((success) => {
            console.log(success);
          })
          .catch((err) => {
            return response.error(
              res,
              400,
              "Unable to reset password now, Please try again."
            );
          });
      });
      return response.success(res, 200, "Reset password mail sended.");
    } else {
      return response.error(res, 401, "Invalid user.");
    }
  } catch (error) {
    console.log(error);
    return response.error(
      res,
      message["server_error"]["status"],
      message["server_error"]["message"]
    );
  }
};

const reqActivation = async function (req, res, next) {
  let { email, password } = req.body;

  try {
    const client = await Accounts.findOne({ email });

    if (!client) return response.error(res, 401, "Invalid user.");
    if (password) {
      const isValid = await crypto.compare(client.password, password);
      if (isValid) {
        if (client?.status == "I") {
          sendEmail(
            "vaheeshan@northlark.com", // super-admin.email,
            "Request for activate account",
            "user-request-activate-account.html",
            {
              email: client.email,
              link: `${client_url}/app/edit-user/${client?.id}`,
            }
          )
            .then((success) => {
              console.log("Mail sended.");
            })
            .catch((err) => {
              return response.error(res, 400, "Unable to send email.");
            });
          return response.success(res, 200, "Request mail sended.");
        } else {
          return response.error(res, 403, "Account already activated.");
        }
      } else {
        return response.error(res, 401, "Invalid credentials.");
      }
    }
  } catch (error) {
    return response.error(res, 400, "Unable to login, Please try again.");
  }
};

module.exports = {
  login,
  logout,
  checkUsername,
  register,
  forgotPass,
  resetPass,
  getProfile,
  checkProfileUsername,
  updateProfile,
  changePass,
  updateTwoFactor,
  verifyTwoFactor,
  getUsers,
  createUser,
  updateUser,
  approveReset,
  reqActivation,
};
