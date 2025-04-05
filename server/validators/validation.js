const { response } = require("../helper");

function validationResponse(req, res, next, schema) {
  try {
    const { error } = schema.validate(req.body);
    if (error)
      return response.error(
        res,
        417,
        error["details"][0]["message"].replaceAll(`"`, "")
      );
    next();
  } catch (error) {
    return response.error(res, 417, error);
  }
}

module.exports = validationResponse;
