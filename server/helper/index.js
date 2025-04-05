const moment = require("moment");

function formatMs(time) {
  const formatTimeUnit = (count, unit) => {
    return `${count > 9 ? count : "0" + count}${unit}`;
  };

  return `${formatTimeUnit(time?.min, "m")}:${formatTimeUnit(
    time?.sec,
    "s"
  )}:${formatTimeUnit(time?.ms, "ms")}`;
}

function formatFieldName(fieldName) {
  let formatted = fieldName.replaceAll(/([A-Z])/g, " $1");

  formatted = formatted
    .split(" ")
    .map((word) => {
      if (word.toLowerCase() === "of") {
        return word.toLowerCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");

  return formatted.trim();
}

function htmlEncode(str) {
  return str
    .replaceAll(/&/g, "&amp;")
    .replaceAll(/</g, "&lt;")
    .replaceAll(/>/g, "&gt;")
    .replaceAll(/'/g, "&#39;")
    .replaceAll(/"/g, "&quot;");
}

function htmlDecode(str) {
  return str
    .replaceAll(/&lt;/g, "<")
    .replaceAll(/&gt;/g, ">")
    .replaceAll(/&#39;/g, "'")
    .replaceAll(/&quot;/g, '"')
    .replaceAll(/&amp;/g, "&");
}

function getUnixTime() {
  const time = moment();
  const unixTime = time.unix();
  return unixTime;
}

module.exports = {
  response: require("./response"),
  crypto: require("./crypto"),
  asyncErrorHandler: require("./asyncErrorHandler"),
  jwtAuth: require("./jwtAuth"),
  fetchApi: require("./fetchApi"),
  responser: require("./messages"),
  sendEmail: require("./sendMail"),
  formatMs,
  formatFieldName,
  htmlEncode,
  htmlDecode,
  getUnixTime,
};
