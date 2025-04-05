const ShortUniqueId = require("short-unique-id");
const ObjectId = require("mongoose").Types.ObjectId;
const moment = require("moment");

const Tasks = require("../models/tasks.model");
const Countries = require("../models/countries.model");
const Accounts = require("../models/accounts.model");
const Histories = require("../models/histories.model");
const Notifications = require("../models/notifications.model");
const DocTypes = require("../models/documentTypes.model");
const Nationalities = require("../models/nationalities.model");

const {
  response,
  responser,
  fetchApi,
  formatMs,
  formatFieldName,
  htmlEncode,
  getUnixTime,
  sendEmail,
} = require("../helper");

const client_url = process.env.CLIENT_URL;

const message = responser();

const validPhoto = async function (req, res, next) {
  let { photo } = req.body;

  let message = responser("photo");

  try {
    if (photo) {
      fetchApi({
        method: "POST",
        url: `${process.env.PYTHON_API}/photo-validate`,
        data: { data: photo },
      }).then((data) => {
        if (!data?.error) {
          return response.success(
            res,
            message["task"]["validate"]["success"]["status"],
            message["task"]["validate"]["success"]["message"]
          );
        } else {
          return response.error(
            res,
            message["task"]["validate"]["failed"]["status"],
            message["task"]["validate"]["failed"]["message"]
          );
        }
      });
    } else {
      return response.error(
        res,
        message["task"]["validate"]["data_req"]["status"],
        message["task"]["validate"]["data_req"]["message"]
      );
    }
  } catch (error) {
    return response.error(
      res,
      message["server_error"]["status"],
      message["server_error"]["message"]
    );
  }
};

const validDocument = async function (req, res, next) {
  let { document } = req.body;

  let message = responser("document");

  try {
    if (document) {
      fetchApi({
        method: "POST",
        url: `${process.env.PYTHON_API}/doc-validate`,
        data: { data: document },
      }).then((data) => {
        if (!data?.error) {
          return response.success(
            res,
            message["task"]["validate"]["success"]["status"],
            message["task"]["validate"]["success"]["message"]
          );
        } else {
          return response.error(
            res,
            message["task"]["validate"]["failed"]["status"],
            message["task"]["validate"]["failed"]["message"]
          );
        }
      });
    } else {
      return response.error(
        res,
        message["task"]["validate"]["data_req"]["status"],
        message["task"]["validate"]["data_req"]["message"]
      );
    }
  } catch (error) {
    return response.error(
      res,
      message["server_error"]["status"],
      message["server_error"]["message"]
    );
  }
};

const submitDocuments = async function (req, res, next) {
  let payload = req.body;
  let user = req.user;

  try {
    const { randomUUID } = new ShortUniqueId({ length: 15 });
    let trackId = "NLTRACK" + randomUUID().toUpperCase();

    let client = await Accounts.findById(ObjectId(user?.id));

    let history = [
      {
        taskId: trackId,
        content: `AI started on ${trackId}.`,
        createdAt: getUnixTime(),
      },
      {
        taskId: trackId,
        content: `AI extracted ${5}/7 fields.`,
        description: [
          `Face Match, Issuing Country, Region, First Name, Last Name extracted.`,
          `Face recognition time: 01m : 02s : 10ms.`,
          `Text extraction time: 02m : 14s : 20ms.`,
        ],
        createdAt: getUnixTime(),
      },
      {
        taskId: trackId,
        content: "Escalated to an analyst.",
        createdAt: getUnixTime(),
      },
    ];

    await Histories.insertMany(history, function (err, data) {
      if (err) {
        console.log(err);
      }
    });

    let task = {
      ...payload,
      trackId,
      status: "I",
      type: "AN",
      client: ObjectId(client?.parent),
      createdAt: getUnixTime(),
      faceMatchTime: 72000,
      extractionTime: 126000,
    };

    if (!payload?.photo) {
      task["faceMatch"] = true;
    }

    await Tasks.create(task, function (err, data) {
      if (!err) {
        return response.success(
          res,
          message["task"]["submit"]["success"]["status"],
          message["task"]["submit"]["success"]["message"],
          { trackId }
        );
      } else {
        return response.error(
          res,
          message["task"]["submit"]["failed"]["status"],
          message["task"]["submit"]["failed"]["message"]
        );
      }
    });

    io.emit("tasks", { update: true });

    // fetchApi({
    //   method: "POST",
    //   url: `${process.env.PYTHON_API}/upload`,
    //   data: {
    //     ...data,
    //     tracker_id: trackId,
    //   },
    // }).then(async (raw) => {
    //   console.log(raw);
    //   if (!raw?.error) {
    //     return response.success(
    //       res,
    //       message["task"]["submit"]["success"]["status"],
    //       message["task"]["submit"]["success"]["message"],
    //       { trackId }
    //     );
    //   } else {
    //     console.log(raw?.error);
    //     return response.error(
    //       res,
    //       message["task"]["submit"]["failed"]["status"],
    //       message["task"]["submit"]["failed"]["message"]
    //     );
    //   }
    // });
  } catch (error) {
    console.log(error);
    return response.error(
      res,
      message["server_error"]["status"],
      message["server_error"]["message"]
    );
  }
};

const getTasks = async function (req, res, next) {
  let user = req.user;
  let { limit, skip, search, from, to, status, id, role, client } = req.query;

  let message = responser();

  let query = {};

  try {
    if (user) {
      if (user.role === "client") {
        query["client"] = { $eq: ObjectId(user?.id) };
      }
      if (client) {
        query["client"] = { $eq: ObjectId(client) };
      }

      if (id) {
        query["trackId"] = { $eq: id };

        let pipeline = [
          {
            $match: { ...query },
          },
        ];

        if (user.role === "client") {
          pipeline.push(
            {
              $lookup: {
                from: "countries",
                localField: "issuingCountry",
                foreignField: "code",
                as: "issuingCountry",
              },
            },
            {
              $addFields: {
                issuingCountry: { $arrayElemAt: ["$issuingCountry.name", 0] },
              },
            },
            {
              $project: {
                admin: 0,
                adminTimeSpent: 0,
                analyst: 0,
                analystTimeSpent: 0,
                client: 0,
                type: 0,
              },
            }
          );
        }

        if (["admin", "analyst"].includes(user.role)) {
          pipeline.push({
            $lookup: {
              from: "histories",
              localField: "trackId",
              foreignField: "taskId",
              as: "history",
              pipeline: [
                {
                  $lookup: {
                    from: "accounts",
                    localField: "updatedBy",
                    foreignField: "_id",
                    as: "updatedBy",
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
                  $unwind: {
                    path: "$updatedBy",
                    preserveNullAndEmptyArrays: true,
                  },
                },
              ],
            },
          });
        }

        let task = await Tasks.aggregate(pipeline);

        return response.success(res, 200, "Get task successfully.", task[0]);
      } else {
        if (["admin", "analyst"].includes(user.role)) {
          query["type"] = { $eq: role ?? "NA" };
        }

        if (from && to) {
          query["createdAt"] = {
            $gte: moment(`${from}T00:00:00.000Z`).unix(),
            $lt: moment(`${to}T23:59:59.999Z`).unix(),
          };
        }

        if (search)
          query = { trackId: { $regex: search.trim(), $options: "i" } };

        if (status) {
          query["status"] = { $eq: status };
          if (user.role === "analyst" && status == "C") {
            query["analyst"] = { $eq: ObjectId(user?.id) };
          }
        }

        let tasks = await Tasks.aggregate([
          {
            $match: {
              status: { $ne: "D" },
              ...query,
            },
          },
          {
            $sort: { [status == "C" ? "completedAt" : "createdAt"]: 1 },
          },
          {
            $skip: skip ? Number(skip) : 0,
          },
          {
            $limit: limit ? Number(limit) : 50,
          },
          {
            $lookup: {
              from: "accounts",
              localField: "client",
              foreignField: "_id",
              as: "clientName",
            },
          },
          {
            $addFields: {
              clientName: { $arrayElemAt: ["$clientName.companyName", 0] },
            },
          },
          {
            $lookup: {
              from: "accounts",
              localField: "analyst",
              foreignField: "_id",
              as: "analystData",
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
              analyst: { $arrayElemAt: ["$analystData", 0] },
            },
          },
          {
            $lookup: {
              from: "accounts",
              localField: "admin",
              foreignField: "_id",
              as: "adminData",
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
              admin: { $arrayElemAt: ["$adminData", 0] },
            },
          },
          {
            $project: {
              trackId: 1,
              faceMatch: 1,
              clientName: 1,
              analyst: 1,
              admin: 1,
              flags: 1,
              iqFail: 1,
              status: 1,
              type: 1,
              position: 1,
              createdAt: 1,
              completedAt: 1,
            },
          },
        ]);

        delete query["status"];

        let counts = await Tasks.aggregate([
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
              inactive: {
                $sum: {
                  $cond: [{ $eq: ["$status", "I"] }, 1, 0],
                },
              },
              active: {
                $sum: {
                  $cond: [{ $eq: ["$status", "C"] }, 1, 0],
                },
              },
            },
          },
        ]);

        let data = {
          list: tasks,
          count: counts[0] || { total: 0, active: 0, inactive: 0 },
        };

        return response.success(res, 200, "Get all tasks successfully.", data);
      }
    } else {
      return response.error(
        res,
        message["unauthorized"]["status"],
        message["unauthorized"]["message"]
      );
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

const updateTask = async function (req, res, next) {
  let user = req.user;
  let body = req.body;
  let { taskId } = req.params;

  let message = "Task updated successfully.";

  try {
    io.emit("assigned", { id: user.id });

    let account = await Accounts.findById(ObjectId(user.id));

    let username = `${account?.firstName} ${account?.lastName}`;

    let payload = { ...body };

    async function addHistory(data, user, comment, attachment) {
      if (typeof data != "string") {
        let arr = [];
        data.map((c) => {
          let obj = {};
          obj = {
            taskId,
            content: c,
            comment,
            attachment,
            createdAt: getUnixTime(),
            updatedBy: user,
          };
          arr.push(obj);
        });

        await Histories.insertMany(arr, function (err, data) {
          if (err) {
            console.log(err);
          }
        });
      } else {
        await Histories.create(
          {
            taskId,
            content: data,
            comment,
            attachment,
            createdAt: getUnixTime(),
            updatedBy: user,
          },
          function (err, data) {
            if (err) {
              console.log(err);
            }
          }
        );
      }
    }

    async function addNotification(to, subject, link, user) {
      await Notifications.create(
        {
          to,
          subject,
          link,
          createdBy: user,
          createdAt: getUnixTime(),
        },
        function (err, data) {
          if (!err) {
            io.emit("notify", data);
          } else {
            console.log(err);
          }
        }
      );
    }

    const task = await Tasks.findOne({ trackId: taskId });
    const client = await Accounts.findOne({ _id: task?.client });

    if (payload?.analyst) {
      payload["analyst"] = user?.id;
      addHistory(`${username} picked this task`);
      // addNotification(
      //   "admin",
      //   htmlEncode(`<b>${username}</b> picked the task <span>${taskId}</span>`),
      //   "analyst-tasks",
      //   user?.id
      // );
    }

    if (payload?.admin) {
      payload["admin"] = user?.id;
      addHistory(`Admin (${username}) taken this task.`);
    }

    let wcStart = false;

    if (payload?.changes) {
      let data = { ...payload };
      delete data["changes"];
      delete data["flags"];
      delete data["timeSpent"];
      delete data["sendToAdmin"];

      const changedFields = Object.keys(data);
      let changeDescription = `${username} edited: `;
      const changedFieldsDescription = [];

      // if (field == "faceMatch") {
      //   function getMatch(value) {
      //     return value !== undefined
      //       ? value == false
      //         ? "Failed"
      //         : "Successful"
      //       : "empty";
      //   }
      //   changeDescription += `${field} (from "${getMatch(
      //     oldValue
      //   )}" to "${getMatch(oldValue)}")`;
      // } else {
      //   changeDescription += `${field} (from "${oldValue ?? "empty"}" to "${
      //     newValue ?? "empty"
      //   }")`;
      // }

      changedFields.forEach((field, index) => {
        let oldValue = task[field];
        let newValue = data[field];

        if (oldValue instanceof Date && newValue) {
          oldValue = oldValue.toISOString();
          newValue = new Date(newValue).toISOString();
        }

        if (oldValue !== newValue) {
          changedFieldsDescription.push(formatFieldName(field));
        }
      });

      if (changedFieldsDescription.length > 0) {
        changeDescription += changedFieldsDescription.join(", ") + ".";
      } else {
        changeDescription = changeDescription.slice(0, -2) + ".";
      }

      if (changeDescription != `${username} edited.`) {
        addHistory(
          [
            `${username} spent ${formatMs(payload["timeSpent"])} on this task.`,
            changeDescription,
          ],
          user.id
        );
      }
      if (!payload?.sendToAdmin && !task?.wcReport) {
        // payload["status"] = "C";
        // payload["position"] = payload?.iqFail ? "R" : "A";
        // payload["completedAt"] = getUnixTime();
        wcStart = true;
      }
      // else {
      //   if (payload?.flags?.length == 0) {
      //     return response.success(res, 208, "No changes has been made.");
      //   }
      // }
    }

    if (payload?.comment) {
      addHistory(
        `${username} left a comment${
          payload?.attachment?.length > 0 ? " with attachment." : "."
        }`,
        user.id,
        payload?.comment,
        payload?.attachment
      );
    }

    if (payload?.flags?.length !== 0) {
      const oldFlags = task?.flags || [];
      const newFlags = payload?.flags || [];

      const addedFlags = newFlags.filter((flag) => !oldFlags.includes(flag));

      const removedFlags = oldFlags.filter((flag) => !newFlags.includes(flag));

      let flagDes = "";
      if (addedFlags.length > 0) {
        let raw = addedFlags.join(", ") + (removedFlags.length == 0 ? "." : "");
        let str = formatFieldName(raw);
        flagDes += `${username} flagged: ${str}`;
      }

      if (removedFlags.length > 0) {
        if (flagDes.length > 0) flagDes += "; ";
        let raw = removedFlags.join(", ") + ".";
        let str = formatFieldName(raw);

        flagDes += `${
          addedFlags.length == 0 ? username : ""
        } unflagged: ${str}`;
      }

      if (flagDes.length !== 0) {
        addHistory(
          [
            `${username} spent ${formatMs(payload["timeSpent"])} on this task.`,
            flagDes,
          ],
          user.id
        );
      }
      // else {
      //   return response.success(res, 208, "No field has been flagged.");
      // }
    }

    if (payload?.sendToAdmin) {
      addHistory("Escalated to an admin", user.id);
      addNotification(
        "admin",
        htmlEncode(
          `<b>${username}</b> escalated the task <span>${taskId}</span> to admin`
        ),
        `task/${taskId}`,
        user?.id
      );
      payload["type"] = "AD";
      message = "The task Escalated Successfully.";
    }

    if (payload?.sendToAnalyst) {
      addHistory(
        `${username} has reassigned this task to an analyst.`,
        user.id
      );
      addNotification(
        task?.analyst,
        htmlEncode(
          `<b>${username}</b> has reassigned the task <span>${taskId}</span> to you`
        ),
        `task/${taskId}`,
        user?.id
      );
      payload["type"] = "AN";
      message = "Task assigned back to the analyst successfully";
    }

    if (payload?.sendToClient) {
      addHistory(`${username} escalated this task to an client.`, user.id);
      payload["status"] = "C";
      payload["position"] = "R";
      payload["completedAt"] = getUnixTime();
      sendEmail(
        "vaheeshan@northlark.com", //payload["email"]
        "Unclear task at NorthLark Wren",
        "flagged-task.html",
        {
          client: `${client.firstName} ${client.lastName}`,
          trackId: taskId,
          link: `${client_url}/app/verification-report/${taskId}`,
        }
      )
        .then((success) => {
          console.log("Sign-up mail sent");
        })
        .catch((err) => {
          return response.error(
            res,
            400,
            "Unable to send sign-up mail, Please try again."
          );
        });
    }

    if (payload?.unassign) {
      if (account?.role == "admin") {
        payload["analyst"] = null;
        addHistory(`Admin (${username}) unassign this task.`, user.id);
      } else {
        return response.error(
          res,
          message["unauthorized"]["status"],
          message["unauthorized"]["message"]
        );
      }
    }

    if (payload?.fraudAssessment) {
      message = "Fraud assessment submitted.";
      if (payload?.checked?.iqFail) {
        payload["subResult"] = "Rejected";
      } else if (
        payload?.fraudAssessment?.checked?.cq?.length > 0 ||
        payload?.fraudAssessment?.checked?.odp?.length > 0 ||
        payload?.fraudAssessment?.flagged?.includes("Face Detection")
      ) {
        payload["subResult"] = "Caution";
      } else if (
        payload?.fraudAssessment?.flagged?.some((word) =>
          [
            "Picture Face Integrity",
            "Shape & Template",
            "Security Features",
            "Fonts",
            "Digital Tampering",
          ].includes(word)
        )
      ) {
        payload["subResult"] = "Suspected";
      } else {
        payload["subResult"] = "Clear";
      }
    }

    if (wcStart) {
      let obj = {
        screen_type: "initial",
        applicant_id: "uhi4hi-3safdsa3-asdfj",
        search_type: "individual",
        name: `${payload["firstName"]} ${payload["lastName"]}`,
        gender: payload["gender"] ?? "",
        date_of_birth: payload["dateOfBirth"] ?? "",
        aliases: "",
        email: payload["email"] ?? "",
        nationality: payload["nationality"] ?? "",
        country: payload["country"],
        country_of_jurisdiction: "American",
        address: "",
        national_id: "",
        voter_id: "",
        passport_number: "",
        pan: "",
        phone_number: "",
        sanction_field: true,
        pep_field: true,
        ams_field: true,
        target_date: moment().format("YYYY-MM-DD"),
        application_id: "uhi4hi-3safdsa3-asdfj",
        sfdc_lead_id: "uhi4hi-3safdsa3-asdfj",
        branch_name: "Chennai",
        product_line: "123",
        pennant_analyst_name: "manager_sams",
        analyst_email_id: "consular.northlark@gmail.com",
        other_fields: {
          field1: "IT",
          field2: "",
          field3: "",
        },
      };

      await fetchApi({
        method: "POST",
        headers: {
          Authorization: `Api-Key ${process.env.WC_API_KEY}`,
          "x-api-key": process.env.WC_X_API_KEY,
        },
        url: `${process.env.WC_API}/async-search-initiate`,
        data: obj,
      })
        .then(async (data) => {
          payload["wcReport"] = data?.search_id;
        })
        .catch((err) => {
          return response.error(res, 422, "Error while world check report");
        });
    }

    if (payload?.wcReportStatus) {
      if (task?.wcReport) {
        payload["status"] = "C";
        payload["position"] = "A";
        payload["completedAt"] = getUnixTime();
        message = "World Check report submit successfully";
      } else {
        return response.error(res, 422, "Error while submit the task");
      }
    }

    Tasks.findOneAndUpdate(
      { trackId: taskId },
      {
        ...payload,
        [account?.role == "admin" ? "adminTimeSpent" : "analystTimeSpent"]:
          payload["timeSpent"],
        updatedAt: getUnixTime(),
      },
      async function (err, data) {
        if (!err) {
          // io.emit("tasks", { update: true });
          // io.emit(`task-${taskId}`, { update: true });
          if (wcStart) {
            await new Promise((resolve) => setTimeout(resolve, 2000));
          }
          return response.success(res, 200, message);
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

const getCountries = async (req, res, next) => {
  try {
    let countries = await Countries.aggregate([
      {
        $match: {},
      },
      {
        $addFields: {
          value: "$code",
          label: {
            $concat: ["$name", " (", "$code", ")"],
          },
          region: {
            $map: {
              input: "$region",
              as: "region",
              in: {
                value: "$$region.region_code",
                label: {
                  $concat: ["$$region.region_name", " (", "$$region.region_code", ")"],
                }
              },
            },
          },
        },
      },
      {
        $addFields: {
          region: {
            $sortArray: {
              input: "$region",
              sortBy: { label: 1 },
            },
          },
        },
      },
      {
        $sort: {
          label: 1,
        },
      },
      {
        $project: {
          value: 1,
          label: 1,
          region: 1,
        },
      },
    ]);

    return response.success(res, 200, "Get all countries successfully.", [
      ...countries,
      {
        value: "unsupported",
        label: "Unsupported",
      },
    ]);
  } catch (error) {
    console.log(error);
    return response.error(
      res,
      message["server_error"]["status"],
      message["server_error"]["message"]
    );
  }
};

const getNationalities = async (req, res, next) => {
  try {
    let nationalities = await Nationalities.aggregate([
      {
        $match: {},
      },
      {
        $addFields: {
          value: "$code",
          label: {
            $concat: ["$nationality", " (", "$code", ")"],
          },
        },
      },
      {
        $sort: {
          label: 1,
        },
      },
      {
        $project: {
          value: 1,
          label: 1,
        },
      },
    ]);

    return response.success(res, 200, "Get all nationalities successfully.", [
      ...nationalities,
      {
        value: "unsupported",
        label: "Unsupported",
      },
    ]);
  } catch (error) {
    console.log(error);
    return response.error(
      res,
      message["server_error"]["status"],
      message["server_error"]["message"]
    );
  }
};

const getDocTypes = async (req, res, next) => {
  let { code } = req.params;

  try {
    let docTypes = await DocTypes.aggregate([
      {
        $match: { country_code: { $eq: code } },
      },
      {
        $unwind: "$documents",
      },
      {
        $addFields: {
          value: "$documents",
          label: "$documents",
        },
      },
      {
        $project: {
          value: 1,
          label: 1,
        },
      },
    ]);

    return response.success(res, 200, "Get all document types available.", [
      ...docTypes,
      {
        value: "unsupported",
        label: "Unsupported",
      },
    ]);
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
  validPhoto,
  validDocument,
  submitDocuments,
  getTasks,
  updateTask,
  getCountries,
  getDocTypes,
  getNationalities,
};
