const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

const taskSchema = new mongoose.Schema({
  trackId: {
    type: String,
    required: false,
  },
  photo: {
    type: String,
  },
  docFront: {
    type: String,
  },
  docBack: {
    type: String,
  },
  documentNo: {
    type: String,
  },
  personalNo: {
    type: String,
  },
  dateOfBirth: {
    type: Date,
  },
  placeOfBirth: {
    type: String,
  },
  firstName: {
    type: String,
  },
  lastName: {
    type: String,
  },
  status: {
    type: String,
    enum: ["I", "C"],
  },
  type: {
    type: String,
    enum: ["AI", "AN", "AD"],
  },
  position: {
    type: String,
    enum: ["A", "R"],
  },
  gender: {
    type: String,
  },
  country: {
    type: String,
  },
  documentType: {
    type: String,
  },
  dateOfIssue: {
    type: Date,
  },
  dateOfExpiry: {
    type: Date,
  },
  faceMatch: {
    type: Boolean,
  },
  issuingCountry: {
    type: String,
  },
  nationality: {
    type: String,
  },
  region: {
    type: String,
  },
  faceMatchTime: {
    type: Number,
  },
  extractionTime: {
    type: Number,
  },
  client: {
    type: ObjectId,
    ref: "accounts",
  },
  createdAt: {
    type: Number,
  },
  updatedAt: {
    type: Number,
  },
  completedAt: {
    type: Number,
  },
  analyst: {
    type: ObjectId,
    ref: "accounts",
  },
  admin: {
    type: ObjectId,
    ref: "accounts",
  },
  flags: {
    type: Array,
  },
  analystTimeSpent: {
    type: Object,
  },
  adminTimeSpent: {
    type: Object,
  },
  iqFail: {
    type: String,
  },
  fraudAssessment: {
    type: Object,
  },
  subResult: {
    type: String,
  },
  wcReport: {
    type: String,
  },
  wcReportStatus: {
    type: String,
  },
  customFields: {
    type: Object,
  },
});

const Tasks = mongoose.model("tasks", taskSchema);

module.exports = Tasks;
