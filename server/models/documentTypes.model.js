const mongoose = require("mongoose");

const docTypesSchema = new mongoose.Schema({
  country_code: {
    type: String,
  },
  documents: {
    type: Array,
  },
  createdAt: {
    type: Date,
  },
  updatedAt: {
    type: Date,
  },
});

const DocTypes = mongoose.model("document_types", docTypesSchema);

module.exports = DocTypes;
