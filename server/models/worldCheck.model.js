const mongoose = require("mongoose");

const worldCheckSchema = new mongoose.Schema({
  Match: {
    type: String,
  },
  Applicant_Name: {
    type: String,
  },
  Status: {
    type: String,
  },
  URL: {
    type: String,
  },
  Search_ID: {
    type: String,
    required: true,
  },
  Search_Type: {
    type: String,
  },
  Analyst_Assigned_To: {
    type: String,
  },
  Analyst_Target_Date: {
    type: String,
  },
  Analyst_Assigned_Date: {
    type: String,
  },
  Applicant_ID: {
    type: String,
  },
  Application_ID: {
    type: String,
  },
  Branch_Name: {
    type: String,
  },
  Product_Line: {
    type: String,
  },
  Pennant_Analyst_Name: {
    type: String,
  },
  Analyst_Email_ID: {
    type: String,
  },
  Other_Fields: {
    type: Object,
  },
  SFDC_Lead_ID: {
    type: String,
  },
  Sanctions_Result: {
    type: Array,
  },
  Sanctions_Country_Result: {
    type: Array,
  },
  PEP_Result: {
    type: Array,
  },
  AMS_Result: {
    type: Array,
  },
  Legal_Result: {
    type: Array,
  },
  Corporate_Result: {
    type: Array,
  },
  Final_Result: {
    type: Object,
  },
});

const WorldCheck = mongoose.model("worldCheck", worldCheckSchema);

module.exports = WorldCheck;
