const ObjectId = require("mongoose").Types.ObjectId;

const Notifications = require("../models/notifications.model");

const { response, responser, getUnixTime } = require("../helper");

const message = responser();

const getNotifications = async (req, res, next) => {
  const user = req.user;
  const { status, limit, skip } = req.query;

  let query = {};

  try {
    query["$or"] = [
      { to: { $eq: user?.role ?? "NA" } },
      { to: { $eq: user?.id } },
    ];

    if (status && status !== "A") query["status"] = { $eq: status };

    let notifications = await Notifications.aggregate([
      {
        $match: {
          status: { $ne: "D" },
          ...query,
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $skip: skip ? Number(skip) : 0,
      },
      {
        $limit: limit ? Number(limit) : 20,
      },
      {
        $lookup: {
          from: "accounts",
          localField: "createdBy",
          foreignField: "_id",
          as: "createdBy",
          pipeline: [
            {
              $project: {
                profileImg: 1,
                firstName: 1,
                lastName: 1,
                username: 1,
                email: 1,
              },
            },
          ],
        },
      },
      {
        $addFields: {
          createdBy: { $arrayElemAt: ["$createdBy", 0] },
        },
      },
    ]);

    delete query["status"];

    let counts = await Notifications.aggregate([
      {
        $match: query,
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: {
              $cond: [{ $ne: ["$status", "D"] }, 1, 0],
            },
          },
          read: {
            $sum: {
              $cond: [{ $eq: ["$status", "R"] }, 1, 0],
            },
          },
          unread: {
            $sum: {
              $cond: [{ $eq: ["$status", "U"] }, 1, 0],
            },
          },
        },
      },
    ]);

    let data = {
      list: notifications,
      count: counts[0] || { total: 0, read: 0, unread: 0 },
    };

    return response.success(
      res,
      200,
      "Get all notifications successfully.",
      data
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

const updateNotification = async function (req, res, next) {
  let body = req.body;

  let { id } = req.params;

  try {
    Notifications.findByIdAndUpdate(
      ObjectId(id),
      {
        status: body?.status,
        updatedAt: getUnixTime(),
      },
      function (err, data) {
        if (!err) {
          io.emit("notify", { to: "admin" });
          return response.success(
            res,
            200,
            "Notification updated successfully."
          );
        } else {
          console.log(err);
          return response.error(
            res,
            message["server_error"]["status"],
            message["server_error"]["message"]
          );
        }
      }
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

const updateNotifyMany = async function (req, res, next) {
  let body = req.body;

  try {
    const objectIdList = body?.list.map((id) => new ObjectId(id));

    const filter = { _id: { $in: objectIdList } };
    const update = { $set: { status: body?.status } };

    Notifications.updateMany(filter, update)
      .then((result) => {
        // console.log(result);
        return response.success(res, 200, "Notification updated successfully.");
      })
      .catch((error) => {
        return response.error(
          res,
          message["server_error"]["status"],
          message["server_error"]["message"]
        );
      });
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
  getNotifications,
  updateNotification,
  updateNotifyMany,
};
