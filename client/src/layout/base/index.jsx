import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";

import { Outlet } from "react-router-dom";
import axios from "axios";
import { FloatButton, Popover, Switch } from "antd";

import Navbar from "./Navbar";
import Footer from "./Footer";

import { fetchProfile } from "../../store/profile/profileSlice";
import { checkThemeColor } from "../../store/theme-color/themeColorSlice";

import { updateSEO } from "../../helper";

export default function Index() {
  const dispatch = useDispatch();

  const profile = useSelector((state) => state.profile);

  let token = localStorage.getItem(process.env.REACT_APP_JWT_TOKEN);

  axios.defaults.headers.common["Authorization"] = "Bearer " + token;

  useEffect(() => {
    dispatch(fetchProfile());
  }, []);

  useEffect(() => {
    let obj = {
      title:
        profile?.data?.companyName ??
        profile?.data?.firstName + " " + profile?.data?.lastName,
      favicon: profile?.data?.favicon,
    };

    updateSEO(obj);
    dispatch(checkThemeColor(profile["data"]?.theme));
  }, [profile]);

  return (
    <div>
      <div className="base-layout">
        <div className="main">
          <Navbar logo={profile?.data?.logo} />
          <div className="page-wrapper">
            <Outlet />
          </div>
          <Footer />
        </div>
      </div>
      <FloatButton.BackTop />
    </div>
  );
}
