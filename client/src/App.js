import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  Navigate,
} from "react-router-dom";
import { useDispatch } from "react-redux";
import { isExpired } from "react-jwt";

//Layout
import AuthLayout from "./layout/auth";
import Layout from "./layout";

import routes from "./helper/routes";
import PrivateRoute from "./helper/PrivateRoute";
import { sendNotify } from "./helper";

import { checkLogged } from "./store/auth/authSlice";
import { checkThemeMode } from "./store/theme/themeSlice";
import { checkThemeColor } from "./store/theme-color/themeColorSlice";

import Login from "./pages/auth/login";

export default function App() {
  const dispatch = useDispatch();

  dispatch(checkThemeMode());
  dispatch(checkThemeColor());

  let token = localStorage.getItem(process.env.REACT_APP_JWT_TOKEN);

  if (token) {
    let expired = isExpired(token);
    if (expired) {
      sendNotify("error", "Token was expired!");
      localStorage.removeItem(process.env.REACT_APP_JWT_TOKEN);
    } else {
      dispatch(checkLogged());
    }
  }

  return (
    <Router>
      <Routes>
        <Route element={<AuthLayout />}>
          {routes
            .filter((r) => r.type === "public")
            .map((route) => {
              return (
                <Route
                  element={route.component}
                  key={route.path}
                  path={route.path}
                  errorElement={<Login />}
                />
              );
            })}
          <Route path="*" element={<Navigate to="/" />} />
        </Route>
        <Route element={<PrivateRoute />}>
          <Route element={<Layout />} path="/app">
            {routes
              .filter((r) => r.type === "private")
              .map((route) => {
                return (
                  <Route
                    element={route.component}
                    key={route.path}
                    path={route.path}
                  />
                );
              })}
            <Route path="" element={<Navigate to="/home" />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}
