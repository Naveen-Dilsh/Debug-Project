import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import axios from "axios";

import { toggleThemeMode } from "../../store/theme/themeSlice";
import { checkThemeColor } from "../../store/theme-color/themeColorSlice";
import { checkLogged } from "../../store/auth/authSlice";

import NotificationBtn from "../../components/NotificationBtn";
import ModalZ from "../../components/ModalZ";

import { sendNotify, getTempProfile, fetchApi } from "../../helper";

export default function Navbar() {
  const dispatch = useDispatch();

  const { themeMode } = useSelector((state) => state.theme);
  const profile = useSelector((state) => state.profile);
  const { userDetails } = useSelector((state) => state.auth);

  const [profileData, setProfileData] = useState(null);
  const [confirmPopup, setConfirmPopup] = useState(false);

  useEffect(() => {
    setProfileData(profile["data"]);
    dispatch(checkThemeColor(profile["data"]?.theme));
  }, [profile]);

  const logout = async () => {
    try {
      const userId = localStorage.getItem("CURRUNT_USER_ID");
      let payload = {
        method: "post",
        url: "/auth/logout",
        data: { userId },
      };
      await fetchApi(payload)
        .then((response) => {
          if (response) {
            console.log(response.data);
            sendNotify("success", "Logged out Successfully.");
            localStorage.removeItem(process.env.REACT_APP_JWT_TOKEN);
            localStorage.removeItem(process.env.REACT_APP_CURRENT_USER);
            localStorage.removeItem("CURRUNT_USER_ID");
            axios.defaults.headers.common["Authorization"] = null;
            dispatch(checkLogged());
            dispatch(checkThemeColor());
          }
        })
        .catch((error) => {
          console.log(error);
        });
    } catch (error) {
      console.error("Error logging out:", error);
      sendNotify("error", "Error logging out. Please try again.");
    }
  };

  const changeTheme = () => {
    dispatch(toggleThemeMode());
    // dispatch(checkThemeColor());
  };

  return (
    <nav className="admin-navbar">
      {(userDetails?.role == "admin" || userDetails?.role == "analyst") && (
        <NotificationBtn />
      )}
      <div className="profile-wrap">
        <div className="profile-toggle">
          <i className="ri-arrow-down-s-line"></i>
          <div className="profile-img">
            {profileData?.profileImg ? (
              <img src={profileData?.profileImg} alt="" />
            ) : (
              <h4
                className="temp-profile"
                // style={{ backgroundColor: "#000" }}
              >
                {getTempProfile(profileData)}
              </h4>
            )}
          </div>
        </div>
        <ul className="profile-dropdown">
          <li onClick={changeTheme}>
            {themeMode} Mode
            <div className="theme-switch-wrapper">
              <div className={`theme-switch theme-${themeMode}`}>
                <i
                  className={
                    themeMode == "light" ? "ri-sun-line" : "ri-moon-line"
                  }
                ></i>
              </div>
            </div>
          </li>
          {userDetails?.role !== "analyst" && (
            <Link to={"/app/profile-settings"}>
              <li>Settings</li>
            </Link>
          )}
          <li onClick={() => setConfirmPopup(true)}>Log Out</li>
        </ul>
      </div>
      <ModalZ
        show={confirmPopup}
        title={
          <>
            <i className="ri-information-line icon-yellow"></i> Confirm Logout
          </>
        }
        onOk={logout}
        onCancel={() => setConfirmPopup(false)}
        okBtnText="Logout"
      >
        <p>Are you sure you want to log out?</p>
      </ModalZ>
    </nav>
  );
}
