import React, { useEffect } from "react";
import { Outlet } from "react-router-dom";
import axios from "axios";
import { FloatButton, Popover, Switch } from "antd";
import { useSelector, useDispatch } from "react-redux";

import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

import { fetchProfile } from "../../store/profile/profileSlice";
import { fetchNotifications } from "../../store/notifications/notificationsSlice";

export default function AdminLayout() {
  const dispatch = useDispatch();

  let token = localStorage.getItem(process.env.REACT_APP_JWT_TOKEN);

  axios.defaults.headers.common["Authorization"] = "Bearer " + token;

  useEffect(() => {
    dispatch(fetchProfile());
    dispatch(
      fetchNotifications({
        limit: 5,
        status: "U",
      })
    );
  }, []);

  return (
    <div>
      <div className="admin-layout">
        <Sidebar />
        <div className="main">
          <Navbar />
          <div className="page-wrapper">
            <Outlet />
          </div>
        </div>
      </div>
      <FloatButton.BackTop />
    </div>
  );
}
