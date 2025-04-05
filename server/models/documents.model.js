const mongoose = require("mongoose");

const documentsSchema = new mongoose.Schema({
  image_back: {
    type: String,
  },
  image_front: {
    type: String,
  },
  createdAt: {
    type: Date,
  },
  updatedAt: {
    type: Date,
  },
  version: {
    type: String,
  },
  country: {
    type: String,
  },
  document_type: {
    type: String,
  },
});

const Documents = mongoose.model("documents", documentsSchema);

module.exports = Documents;
