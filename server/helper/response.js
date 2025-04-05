class Response {
  success(res, status, message, data) {
    let response = {
      error: false,
      message,
      data,
    };
    return res.status(status).json(response);
  }
  error(res, status, message) {
    let response = {
      error: true,
      message,
    };
    return res.status(status).json(response);
  }
}

module.exports = new Response();
