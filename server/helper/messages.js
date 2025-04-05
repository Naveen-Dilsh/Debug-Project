function responser(model, key) {
  return {
    auth: {
      login: {
        success: {
          status: 200,
          message: "Login successfully.",
        },
        not_exists: {
          status: 401,
          message: "Invalid user, don't have an account register first.",
        },
        invalid_pass: {
          status: 401,
          message: "Invalid credentials, Try any other.",
        },
      },
      register: {
        success: {
          status: 200,
          message: "Login successfully.",
        },
      },
    },
    get: {
      success: {
        status: 200,
        message: `All ${model} get successfully.`,
      },
      nodata: {
        status: 204,
        message: `Currently no ${model} we have.`,
      },
    },
    add: {
      success: {
        status: 201,
        message: `${model} added successfully.`,
      },
    },
    update: {
      success: {
        status: 200,
        message: `${model} updated successfully.`,
      },
    },
    delete: {
      success: {
        status: 200,
        message: `${model} removed successfully.`,
      },
    },
    subscribe: {
      success: {
        status: 201,
        message: "Subscribed successfully.",
      },
      invalid_plan: {
        status: 400,
        message: "Invalid plan id, Check id once again.",
      },
      plan_id_req: {
        status: 411,
        message: "Plan id is required.",
      },
    },
    task: {
      validate: {
        success: {
          status: 200,
          message: `Validate the ${model} successfully`,
        },
        failed: {
          status: 422,
          message: `Not a valid ${model}, Please try again.`,
        },
        data_req: {
          status: 411,
          message: `Valid ${model} required.`,
        },
      },
      submit: {
        success: {
          status: 201,
          message: "Submitted all the document successfully.",
        },
        failed: {
          status: 422,
          message: "Not a valid photo or document, Please try again.",
        },
      },
      track: {
        success: {
          status: 200,
          message: "Track successfully.",
        },
        failed: {
          status: 400,
          message: "Not a valid track id, Please try again.",
        },
      },
    },
    already_exists: {
      status: 208,
      message: `${model} ${key} already exists, Please try any other.`,
    },
    unauthorized: {
      status: 401,
      message: "Unauthorized, Permission denied.",
    },
    server_error: {
      status: 500,
      message: "Internal server error.",
    },
  };
}

module.exports = responser;
