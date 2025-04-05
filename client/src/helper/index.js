import { Children } from "react";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import { notification } from "antd";
import axios from "axios";
import moment from "moment/moment";
import io from "socket.io-client";

import { store } from "../store/configureStore";
import { checkLogged } from "../store/auth/authSlice";

import NoData from "../components/NoData";
import Loading from "../components/Loading";

import InProgressIcon from "../assets/img/in-progress-icon.svg";
import ApprovedIcon from "../assets/img/approved-icon.svg";
import Favicon from "../assets/img/fav-icon.png";

const server_url = process.env.REACT_APP_NODE_API_URL?.split("/api")[0];

export const socket = io(server_url);

export function updateSEO(content) {
  let links = document.querySelectorAll("link[rel~='icon']");
  let apple = document.querySelector(
    "link[rel='apple-touch-icon-precomposed']"
  );

  Array.from([...links, apple]).reduce((acc, elem) => {
    elem.href = content?.favicon ?? Favicon;
  }, {});

  document.title = content?.title ?? "Wren - NorthLark";
}

export function generateRandom() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function percentageOf(value, total) {
  return ((value / total) * 100).toFixed(0);
}

export const getSubdomain = () => {
  const hostname = window.location.hostname;
  const parts = hostname.split(".");
  if (parts.length > 1) {
    return parts.slice(0, -1).join(".");
  }
  return null;
};

export const isArrayEmpty = (array) => {
  let bool = array.length == 0 ? true : false;
  return bool;
};

export const isObjectEmpty = (object, key) => {
  let bool = !Object.values(object).every(
    (x) => x[key] !== null || x[key] !== ""
  );
  return bool;
};

export function removeEmpty(object) {
  Object.keys(object).forEach((k) => object[k] == null && delete object[k]);
  return object;
}

export function formatMs(ms) {
  const formatTimeUnit = (count, unit) => {
    return `${count > 9 ? count : "0" + count}${unit}`;
  };

  const min = Math.floor(ms / (60 * 1000));
  ms %= 60 * 1000;

  const sec = Math.floor(ms / 1000);
  ms %= 1000;

  const milliseconds = Math.floor(ms / 10);

  return `${formatTimeUnit(min, "m")} : ${formatTimeUnit(
    sec,
    "s"
  )} : ${formatTimeUnit(milliseconds, "ms")}`;
}

export function formatFieldName(fieldName) {
  let formatted = fieldName.replace(/([A-Z])/g, " $1");

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

export function getLabels(object) {
  let arr = Object.keys(object);
  let str = arr.join(", ");
  return formatFieldName(str);
}

export const fetchApi = async (payload, config) => {
  const response = await axios(payload)
    .then((response) => {
      if (config?.showNotify) {
        sendNotify(
          response?.status == 208 ? "warning" : "success",
          response?.data?.message
        );
      }
      let res = { ...response?.data };
      res["status"] = response?.status;
      return res;
    })
    .catch((error) => {
      if (error?.response?.status === 403) {
        sendNotify("error", "Token was expired, Login again.");
        localStorage.removeItem(process.env.REACT_APP_JWT_TOKEN);
        store.dispatch(checkLogged());
      }
      if (config?.showNotify) {
        sendNotify("error", error?.response?.data?.message);
      }
      return { error: error };
    });
  return response;
};

export function formatTime(ms) {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const milliseconds = ms % 1000;

  const formattedMinutes = String(minutes).padStart(2, "0");
  const formattedSeconds = String(seconds).padStart(2, "0");
  const formattedMilliseconds = String(milliseconds)
    .padStart(3, "0")
    .substring(0, 2);

  return `${
    formattedMinutes > 0 ? `${formattedMinutes}m : ` : ""
  } ${formattedSeconds}s : ${formattedMilliseconds}ms`;
}

export const focusOn = (id) => {
  setTimeout(() => {
    if (document.getElementById(id) !== null) {
      document.getElementById(id).scrollIntoView();
    }
  }, 100);
};

export const sendNotify = (type, content) => {
  notification.open({
    type: type,
    message: content,
    className: "custom-notification",
  });
};

export function htmlEncode(str) {
  const div = document.createElement("div");
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

export function htmlDecode(str) {
  const div = document.createElement("div");
  div.innerHTML = str;
  return div.innerText || div.textContent;
}

export function stripHtmlTags(htmlString) {
  return htmlString.replace(/<[^>]*>/g, "");
}

export const downloadFile = (path, filename) => {
  var link = document.createElement("a");
  link.href = path;
  link.download = filename;
  link.dispatchEvent(new MouseEvent("click"));
};

export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

export function formatBytes(bytes, decimals = 0) {
  if (!+bytes) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export const downloadBase64 = (base64String, filename, fileType) => {
  var base64result = base64String.split(",")[1];
  const binaryString = atob(base64result);
  const length = binaryString.length;
  const uint8Array = new Uint8Array(length);
  for (let i = 0; i < length; i++) {
    uint8Array[i] = binaryString.charCodeAt(i);
  }
  const blob = new Blob([uint8Array], {
    type: fileType || "application/octet-stream",
  });
  saveAs(blob, filename);
};

const fileType =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8";
const fileExtension = ".xlsx";

export const downloadAsCSV = (apiData, fileName) => {
  const ws = XLSX.utils.json_to_sheet(apiData);
  const wb = { Sheets: { data: ws }, SheetNames: ["data"] };
  const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const data = new Blob([excelBuffer], { type: fileType });
  saveAs(data, fileName + fileExtension);
};

export const Each = ({ loading, loadingStyle, render, array, warning }) =>
  loading ? (
    <Loading type={loadingStyle} />
  ) : (
    Children.toArray(
      array?.length > 0 ? (
        array?.map((item, index) => render(item, index))
      ) : !warning ? (
        <></>
      ) : (
        <NoData />
      )
    )
  );

// export const Show = (props) => {
//   let when = null;
//   let otherwise = null;

//   Children.forEach(props?.children, children => {
//     if (children?.props?.isTrue === undefined) {
//       otherwise == children;
//     } else if (!when && children?.props?.isTrue === true) {
//       when = children;
//     }
//   });

//   return when || otherwise;
// };

// Show.When = ({ isTrue, children }) => isTrue && children;
// Show.Else = ({ render, children }) => render || children;

export function parseJwt(token) {
  const base64Url = token.split(".")[1];
  const base64 = base64Url?.replace("-", "+").replace("_", "/");
  let data = getAtob(base64) ? getAtob(base64) : null;
  let details = {};
  details = { ...JSON.parse(data) };
  return details;
}

export function getAtob(data) {
  try {
    return window.atob(data);
  } catch (e) {
    return false;
  }
}

export function createEmptyArray(size) {
  var x = [];
  for (var i = 0; i < size; ++i) {
    x[i] = i;
  }
  return x;
}

// export function getOptions(data) {
//   let arr = [];
//   let obj = {};
//   data?.map((option) => {
//     obj["label"] = option?.name ? `${option?.name} - ${option?.code}` : `${option?.code}`;
//     obj["value"] = option?.code;
//     arr.push(obj);
//     obj = {};
//   });
//   return arr;
// }

export function copyThat(value) {
  navigator.clipboard.writeText(value);
}

export function getOptions(data) {
  let arr = [];
  let obj = {};
  data?.map((option) => {
    obj["label"] = option?.name
      ? `${option?.name} - ${option?.code}`
      : option.label;
    obj["value"] = option?.code ?? option.value;
    arr.push(obj);
    obj = {};
  });
  return arr;
}

export function arrayToOption(data, value, label) {
  let arr = [];
  let obj = {};
  data?.map((option) => {
    obj["label"] = option[label];
    obj["value"] = option[value];
    arr.push(obj);
    obj = {};
  });
  return arr;
}

export function convertQueryParams(obj) {
  return Object.entries(obj)
    .map(
      ([key, value]) =>
        `${encodeURIComponent(`${key}`)}=${encodeURIComponent(value)}`
    )
    .join("&");
}

export function showCount(count) {
  return count || count == 0 ? (count > 9 ? count : "0" + count) : "00";
}

export function getQuery() {
  let urlQuery =
    typeof window !== "undefined" ? window.location.search.split("?")[1] : null;
  let query = {};
  if (urlQuery) {
    if (urlQuery.includes("&")) {
      let params = urlQuery.split("&");
      for (let i = 0; i < params.length; i++) {
        query[params[i].split("=")[0]] = params[i].split("=")[1];
      }
    } else {
      query[urlQuery.split("=")[0]] = urlQuery.split("=")[1];
    }
  }
  return query;
}

export const customPagination = (_, type, originalElement) => {
  if (type === "prev") {
    return (
      <a>
        <i className="far fa-arrow-left"></i>&nbsp; Previous
      </a>
    );
  }
  if (type === "next") {
    return (
      <a>
        Next &nbsp;<i className="far fa-arrow-right"></i>
      </a>
    );
  }
  return originalElement;
};

export function eachChatTextTime(time) {
  return moment(time).format("hh:mm a");
}

export function chatTime(time) {
  let postedTimeStr = "";
  if (moment().isSame(time, "day")) {
    postedTimeStr = moment(time).format("hh:mm a"); //format("HH:mm")
  } else {
    postedTimeStr = moment(time).format("DD/MMM/YYYY"); //format("DD/MMM/YYYY HH:mm")
  }
  return postedTimeStr;
}

export function timeDiff(time, format) {
  let postedTimeStr = "";
  let postedTime = moment().diff(moment.unix(time), "minutes");

  if (postedTime < 1) {
    postedTimeStr = "Just now";
  } else if (postedTime < 60) {
    postedTimeStr = `${postedTime} min ago`;
  } else {
    postedTimeStr = moment.unix(time).format(format ?? "hh:mm a"); //format("HH:mm")
  }
  return postedTimeStr;
}

export function getRandomColor() {
  var letters = "0123456789ABCDEF";
  var color = "#";
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

export const getTempProfile = (user) => {
  if (user?.firstName && user?.lastName) {
    let f = user?.firstName?.substring(0, 1);
    let s = user?.lastName?.substring(0, 1);
    return f.toUpperCase() + s.toUpperCase();
  }
};

export function arrayToStr(value) {
  return value?.length > 0 ? value.join(", ") : "N/A";
}

export function checkEmpty(value) {
  return value ? value : "N/A";
}

export function checkLink(link) {
  return link ? (
    <a href={link} target="_blank">
      {link}
    </a>
  ) : (
    "N/A"
  );
}

export function checkDate(date, format) {
  return date ? moment(date).format(format) : "N/A";
}

export const tableStatusTabs = [
  {
    key: "C",
    label: (
      <>
        <img src={ApprovedIcon} alt="" /> Completed
      </>
    ),
  },
  {
    key: "I",
    label: (
      <>
        <img src={InProgressIcon} alt="" /> In Progress
      </>
    ),
  },
];

// ('.ppt' '.pptx' '.doc', '.docx', '.xls', '.xlsx'):-
// src = "https://view.officeapps.live.com/op/embed.aspx?src=(Link)";
// Sample Doc: https://file-examples.com/storage/fe0e2ce82f660c1579f31b4/2017/02/file-sample_100kB.doc
// Sample Excel: https://file-examples.com/storage/fe0e2ce82f660c1579f31b4/2017/02/file_example_XLS_10.xls
// Sample PPT: https://file-examples.com/storage/fe0e2ce82f660c1579f31b4/2017/08/file_example_PPT_250kB.ppt
