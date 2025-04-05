import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";

import NoData from "../assets/img/no-notifications.jpg";
import Logo from "../assets/img/fav-icon.png";

import TabZ from "./TabZ";

import {
  Each,
  getTempProfile,
  timeDiff,
  socket,
  fetchApi,
  htmlDecode,
  stripHtmlTags,
} from "../helper";

import { fetchNotifications } from "../store/notifications/notificationsSlice";

export default function NotificationBtn() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { userDetails } = useSelector((state) => state.auth);
  const { themeMode } = useSelector((state) => state.theme);
  const notification = useSelector((state) => state.notification);

  const [newCount, setNewCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [payload, setPayload] = useState({
    limit: 5,
    status: "U",
  });

  useEffect(() => {
    socket.on("notify", (notify) => {
      if (userDetails?.role == notify?.to || userDetails?.id == notify?.to) {
        getNotify();
        if (notify?.status == "U") {
          pushNotify(notify);
        }
      }
    });
  }, []);

  useEffect(() => {
    let count = notification?.data?.count?.unread;
    setNewCount(count);
  }, [notification?.data?.count]);

  useEffect(() => {
    getNotify();
  }, [payload]);

  const getNotify = () => {
    dispatch(fetchNotifications(payload));
  };

  const togglePopup = () => {
    setIsOpen(!isOpen);
  };

  const pushNotify = (notify) => {
    function send() {
      var messageNotify = new Notification(
        stripHtmlTags(htmlDecode(notify?.subject)),
        {
          // body: notify.body,
          icon: Logo,
          color: "#975497",
          sound: "default",
        }
      );
      messageNotify.onclick = () => {
        let url = window.location.origin;
        window.open(url + "/app/" + notify?.link);
        updateNotify(notify?._id);
      };
    }

    if (!("Notification" in window)) {
      alert("This browser does not support web notifications");
    } else if (Notification.permission === "granted") {
      send();
    } else {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          send();
        }
      });
    }
  };

  const updateNotify = (id) => {
    togglePopup();
    let payload = {
      method: "PUT",
      url: `/notification/${id}`,
      data: { status: "R" },
    };
    fetchApi(payload).then((res) => {
      getNotify();
    });
  };

  const labels = [
    {
      key: "U",
      label: "NEW",
    },
    {
      key: "R",
      label: "CLEARED",
    },
  ];

  const onTabChange = (key) => {
    let obj = { ...payload };
    obj["status"] = key;
    setPayload(obj);
  };

  const viewAll = () => {
    togglePopup();
    navigate("/app/notifications");
  };

  return (
    <div className="notification-wrapper">
      <button className="notification-btn" onClick={togglePopup}>
        <i className="ri-notification-2-line"></i>
        {newCount > 0 && (
          <span className="notification-count">
            {newCount <= 9 ? newCount : "9+"}
          </span>
        )}
      </button>
      <div className={`notification-popup ${isOpen ? "open" : ""}`}>
        <div className="notification-header">
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center gap-2">
              <h6>Notifications</h6>
              {newCount > 0 && (
                <span className="count">
                  {newCount <= 99 ? newCount : "99+"}
                </span>
              )}
            </div>
            <button className="close-btn" onClick={togglePopup}>
              <i className="ri-close-line"></i>
            </button>
          </div>
        </div>
        <div className="notification-content">
          <div className="d-flex justify-content-between align-items-center mb-2 px-3">
            <TabZ
              labels={labels}
              defaultActive="U"
              customClass="sm"
              onChange={onTabChange}
            />
            <button onClick={viewAll} className="secondary-btn py-1">
              View All
            </button>
          </div>
          <div className="notification-wrap">
            {notification?.data?.list?.length > 0 ? (
              <Each
                array={notification?.data?.list}
                render={(notify, i) => {
                  return (
                    <Link
                      to={notify?.link}
                      className="notification-link"
                      key={i}
                      onClick={() => updateNotify(notify?._id)}
                    >
                      <div
                        className={`notification-item ${
                          notify?.status == "U" ? "unread" : ""
                        } ${notify?.important ? "important" : ""}`}
                      >
                        {notify?.createdBy?.profileImg ? (
                          <img
                            className="notification-avatar"
                            src={notify?.createdBy?.profileImg}
                            alt=""
                          />
                        ) : (
                          <div>
                            <h4 className="temp-profile">
                              {getTempProfile(notify?.createdBy)}
                            </h4>
                          </div>
                        )}
                        <div className="notification-text">
                          <h6
                            dangerouslySetInnerHTML={{
                              __html: htmlDecode(notify?.subject),
                            }}
                          ></h6>
                        </div>
                        <p className="notification-time my-2">
                          {timeDiff(notify?.createdAt, "DD/MM/YYYY  hh:mm a")}
                        </p>
                      </div>
                    </Link>
                  );
                }}
              />
            ) : (
              <div className="no-notification">
                <img src={NoData} alt="" />
                <h4>
                  {payload["status"] == "U"
                    ? "No new notification"
                    : "No notification yet"}
                </h4>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
