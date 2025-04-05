const Documents = require("../models/documents.model");

const { response, responser } = require("../helper");

const message = responser();

const getDocuments = async (req, res, next) => {
  const { country, doc_type } = req.query;

  let query = {};

  try {
    if (country) {
      query["country"] = { $eq: country };
    }

    if (doc_type) {
      query["document_type"] = { $eq: doc_type };
    }

    let documents = await Documents.aggregate([
      {
        $match: query,
      },
    ]);

    return response.success(
      res,
      200,
      "Get all documents successfully.",
      documents
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

module.exports = {
  getDocuments,
};
