const mongoose = require("mongoose");

const regionBySchema = new mongoose.Schema({
  region_code: { type: String },
  region_name: { type: String },
});

const countriesSchema = new mongoose.Schema({
  code: {
    type: String,
  },
  name: {
    type: String,
  },
  region: {
    type: [regionBySchema],
  },
});

const Countries = mongoose.model("countries", countriesSchema);

module.exports = Countries;
