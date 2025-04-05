import React from "react";
import ReactDOM from "react-dom/client";
import { store } from "./store/configureStore";
import { Provider } from "react-redux";
import axios from "axios";

import "antd/dist/reset.css";
import "./assets/css/antd.customize.scss";
import "./assets/css/bootstrap.min.css";
import "./assets/css/style.z.scss";
import "./assets/css/global.css";
import "./assets/css/style.scss";

import App from "./App";

axios.defaults.baseURL = process.env.REACT_APP_NODE_API_URL;
axios.defaults.headers.common["Accept"] = "application/json";

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <Provider store={store}>
    <App />
  </Provider>
);
