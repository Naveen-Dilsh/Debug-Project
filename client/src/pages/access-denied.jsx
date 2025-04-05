import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

import AccessDeniedImg from "../assets/img/access-denied.png";

export default function AccessDenied() {
  const navigate = useNavigate();
  const { userDetails } = useSelector((state) => state.auth);

  const [path, setPath] = useState("");

  useEffect(() => {
    let location = "";

    if (userDetails?.role == "super-admin" || userDetails?.role == "admin") {
      location = "/app/admin-tasks";
    } else if (userDetails?.role == "analyst") {
      location = "/app/analyst-tasks";
    } else if (userDetails?.role == "client") {
      location = "/app/tasks";
    } else {
      location = "/app/upload";
    }

    setPath(location);
  }, []);

  return (
    <div className="access-denied">
      <img src={AccessDeniedImg} alt="access denied" />
      <h1>You don't have authorization to view this page</h1>
      <button className="primary-btn mt-4" onClick={() => navigate(path)}>
        Go Back Home
      </button>
    </div>
  );
}
