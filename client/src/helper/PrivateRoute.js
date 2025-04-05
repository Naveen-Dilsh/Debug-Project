import { Outlet, useNavigate, useLocation, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

import routes from "./routes";
import AccessDenied from "../pages/access-denied";

const PrivateRoute = () => {
  let { isLogged, userDetails } = useSelector((state) => state.auth);
  let location = useLocation();

  console.log (userDetails, "123")
  let path = location.pathname.split("/")[2];
  let access = routes
    ?.find((r) => r.path.split("/")[0] === path)
    ?.permissions?.find((r) => r === userDetails?.role)
    ? true
    : false;
    
  return isLogged ? (
    access ? (
      <Outlet />
    ) : (
      <AccessDenied />
    )
  ) : (
    <Navigate to={"/login"} state={{ from: location }} replace />
  );
};

export default PrivateRoute;
