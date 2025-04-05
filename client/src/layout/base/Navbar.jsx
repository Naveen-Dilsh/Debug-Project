import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";

import { checkLogged } from "../../store/auth/authSlice";
import { checkThemeColor } from "../../store/theme-color/themeColorSlice";

import { sendNotify, updateSEO, fetchApi } from "../../helper";

import ModalZ from "../../components/ModalZ";

export default function Navbar({ logo }) {
  const dispatch = useDispatch();

  const [confirmPopup, setConfirmPopup] = useState(false);

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
            updateSEO();
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
  return (
    <nav className="navbar">
      <img
        className="logo"
        // src={themeMode == "dark" ? ClientLogoDark : ClientLogoLight}
        src={logo}
        alt=""
      />
      <button className="primary-btn" onClick={() => setConfirmPopup(true)}>
        <i className="ri-shut-down-line"></i> Logout
      </button>
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
