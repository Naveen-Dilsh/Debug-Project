const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

const accountsSchema = new mongoose.Schema({
  profileImg: {
    type: String,
  },
  logo: {
    type: String,
  },
  favicon: {
    type: String,
  },
  companyName: {
    type: String,
  },
  slug: {
    type: String,
  },
  theme: {
    type: Number,
  },
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },
  password: {
    type: String,
    trim: true,
  },
  role: {
    type: String,
    required: true,
    enum: ["admin", "analyst", "client", "end-user"],
  },
  parent: {
    type: ObjectId,
  },
  status: {
    type: String,
    default: "P",
    enum: ["P", "A", "I", "D"],
  },
  twoFactor: {
    type: Boolean,
    default: false,
    required: true,
  },
  qrCode: {
    type: String,
    required: false,
  },
  secretKey: {
    type: String,
    required: false,
  },
  resetReq: {
    type: Boolean,
  },
  verifyId: {
    type: String,
  },
  createdAt: {
    type: Number,
  },
  updatedAt: {
    type: Number,
  },
    isOnline: {
      type: Boolean,
    },
});

const Accounts = mongoose.model("accounts", accountsSchema);

module.exports = Accounts;
