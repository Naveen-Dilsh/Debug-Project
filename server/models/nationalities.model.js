const mongoose = require("mongoose");

const nationalitiesSchema = new mongoose.Schema({
  code: {
    type: String,
  },
  country: {
    type: String,
  },
  nationality: {
    type: String,
  },
});

const Nationalities = mongoose.model("nationalities", nationalitiesSchema);

module.exports = Nationalities;
