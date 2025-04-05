const ObjectId = require("mongoose").Types.ObjectId;
const moment = require("moment");

const Tasks = require("../models/tasks.model");
const WorldCheck = require("../models/worldCheck.model");

const { response, responser, fetchApi } = require("../helper");

async function fetchWcApi(search_id) {
  return await fetchApi({
    method: "GET",
    headers: {
      Authorization: `Api-Key ${process.env.WC_API_KEY}`,
      "x-api-key": process.env.WC_X_API_KEY,
    },
    url: `${process.env.WC_API}/async-search-initiate/initial/${search_id}`,
  });
}

async function getWorldCheckReport(search_id) {
  const response = await fetchWcApi(search_id);

  if (!response || response?.Search_Status == "Inprogress") {
    await new Promise((resolve) => setTimeout(resolve, 4000));

    return await fetchApi({
      method: "GET",
      headers: {
        Authorization: `Api-Key ${process.env.WC_API_KEY}`,
        "x-api-key": process.env.WC_X_API_KEY,
      },
      url: `${process.env.WC_API}/async-search-initiate/initial/${search_id}`,
    });
  }

  return response;
}

const getWcReport = async function (req, res, next) {
  let user = req.user;
  let { id } = req.params;

  let message = responser();

  try {
    if (user) {
      if (id) {
        let task = await Tasks.findOne({ trackId: id });
        if (!task) {
          return response.error(res, 422, "Track Id required.");
        }

        let wcReport = await WorldCheck.findOne({
          Search_ID: task?.wcReport,
        });

        if (wcReport?.Status) {
          let data = { task, wcReport };
          return response.success(
            res,
            200,
            "Get world check report successfully.",
            data
          );
        } else {
          try {
            let fetchResponse = await getWorldCheckReport(task?.wcReport);

            console.log(fetchResponse);

            const createdReport = await WorldCheck.create({
              ...fetchResponse,
            });
            let output = { task, wcReport: createdReport };
            return response.success(
              res,
              200,
              "Get world check report successfully.",
              output
            );
          } catch (fetchError) {
            console.error(fetchError);
            return response.error(res, 422, "Error while world check report");
          }
        }
      } else {
        return response.error(res, 422, "Track Id required.");
      }
    } else {
      return response.error(
        res,
        message["unauthorized"]["status"],
        message["unauthorized"]["message"]
      );
    }
  } catch (error) {
    console.error(error);
    return response.error(res, 500, "Internal server error.");
  }
};

const updateWcReport = async function (req, res, next) {
  let { searchId } = req.params;
  let payload = req.body;

  let message = responser();

  try {
    if (searchId) {
      let wcReport = await WorldCheck.findOne({ Search_ID: searchId });

      if (wcReport?.Status === "Pending") {
        fetchApi({
          method: "POST",
          headers: {
            Authorization: `Api-Key ${process.env.WC_API_KEY}`,
            "x-api-key": process.env.WC_X_API_KEY,
          },
          url: `${process.env.WC_API}/verdict/initial/${searchId}`,
          data: payload,
        })
          .then(async (data) => {
            let update = {
              Status: payload?.status == "accepted" ? "Accepted" : "Rejected",
              Final_Result: payload,
            };
            updateReport(update);
          })
          .catch((err) => {
            console.log(err);
            return response.error(res, 422, "Error while world check report");
          });
      } else {
        let update = { Final_Result: payload };
        updateReport(update);
      }

      function updateReport(update) {
        WorldCheck.findOneAndUpdate(
          { Search_ID: searchId },
          { ...update },
          async function (err, data) {
            if (!err) {
              return response.success(
                res,
                200,
                "Submit world check report successfully."
              );
            } else {
              console.log(err);

              return response.error(
                res,
                422,
                "Error while submit world check report"
              );
            }
          }
        );
      }
    } else {
      return response.error(res, 422, "Search Id required.");
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

module.exports = {
  getWcReport,
  updateWcReport,
};
