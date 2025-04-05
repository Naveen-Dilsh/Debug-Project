const axios = require("axios");

// axios.defaults.baseURL = process.env.PYTHON_API;
axios.defaults.headers.common["Accept"] = "application/json";

async function fetchApi(payload) {
  const response = await axios(payload)
    .then((response) => {
      return response?.data;
    })
    .catch((error) => {
      return { error: error };
    });
  return response;
}

module.exports = fetchApi;
