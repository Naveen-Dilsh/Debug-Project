import React from "react";
import { Outlet, useLocation, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

import LogoLight from "../../assets/img/logo-light.svg";
import LogoDark from "../../assets/img/logo-dark.svg";

export default function Index() {
  const { isLogged, userDetails } = useSelector((state) => state.auth);
  const { themeMode } = useSelector((state) => state.theme);

  let location = useLocation();

  let from = location.state?.from?.pathname || null;
  if (isLogged) {
    if (from) {
      return <Navigate to={from} replace />;
    } else {
      if (userDetails?.role == "super-admin" || userDetails?.role == "admin") {
        return <Navigate to="/app/admin-tasks" replace />;
      } else if (userDetails?.role == "analyst") {
        return <Navigate to="/app/analyst-tasks" replace />;
      } else if (userDetails?.role == "client") {
        return <Navigate to="/app/tasks" replace />;
      } else {
        return <Navigate to="/app/upload" replace />;
      }
    }
  }

  return (
    <div className="auth-layout">
      <div className="auth-card">
        <img
          className="logo"
          src={themeMode == "dark" ? LogoDark : LogoLight}
          alt="Wren - NorthLark"
        />
        <Outlet />
      </div>
    </div>
  );
}
