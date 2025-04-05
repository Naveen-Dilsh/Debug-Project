import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import moment from "moment/moment";
import { Pagination, Select, Checkbox, Spin } from "antd";

import NoDataImg from "../assets/img/no-notifications.jpg";

import TabZ from "../components/TabZ";
import LoaderZ from "../components/LoaderZ";
import SearchBoxZ from "../components/SearchBoxZ";
import DateFilter from "../components/DateFilter";

import {
  Each,
  socket,
  fetchApi,
  convertQueryParams,
  timeDiff,
  htmlDecode,
  getTempProfile,
} from "../helper";

import { fetchNotifications } from "../store/notifications/notificationsSlice";

export default function Notification() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { userDetails } = useSelector((state) => state.auth);

  const [payload, setPayload] = useState({
    skip: 0,
    limit: 20,
    status: "A",
  });

  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState([]);
  const [notifyList, setNotifyList] = useState(null);
  const [notifyCount, setNotifyCount] = useState(null);
  const [notifySelected, setNotifySelected] = useState([]);
  const [allSelected, setAllSelected] = useState(false);

  useEffect(() => {
    socket.on("notify", (notify) => {
      if (userDetails?.role == notify?.to || userDetails?.id == notify?.to) {
        getNotify();
      }
    });
    return () => {
      socket.off("notify");
    };
  }, []);

  useEffect(() => {
    getNotify();
  }, [payload]);

  const groupByDate = (data) => {
    if (data?.length > 0) {
      const groupedData = {};

      data.forEach((item) => {
        const formattedDate = moment.unix(item.createdAt).format("DD-MM-YYYY");
        const isToday = moment().isSame(moment.unix(item.createdAt), "day");

        const dateLabel = isToday ? "Today" : formattedDate;

        if (!groupedData[dateLabel]) {
          groupedData[dateLabel] = [];
        }
        groupedData[dateLabel].push(item);
      });

      // Convert to expected format
      return Object.keys(groupedData).map((dateLabel) => ({
        createdDate: dateLabel,
        data: groupedData[dateLabel],
      }));
    } else {
      return [];
    }
  };

  const getNotify = () => {
    setLoading(true);
    let query = convertQueryParams(payload);
    fetchApi({
      method: "GET",
      url: `/notification?${query}`,
    })
      .then((res) => {
        let data = res?.data;
        setNotification(data?.list);
        let group = groupByDate(data?.list);
        setNotifyList(group);
        setNotifyCount(data?.count);
        setLoading(false);
      })
      .catch((err) => console.log(err));
  };

  const labels = [
    {
      key: "A",
      label: (
        <>
          <i className="ri-archive-stack-line"></i> All Notification
        </>
      ),
    },
    {
      key: "U",
      label: (
        <>
          <i className="ri-mail-unread-line"></i> Unread
        </>
      ),
    },
    {
      key: "R",
      label: (
        <>
          <i className="ri-mail-open-line"></i> Read
        </>
      ),
    },
  ];

  const onTabChange = (key) => {
    let obj = { ...payload };
    obj["status"] = key;
    obj["skip"] = 0;
    obj["limit"] = 20;
    setPayload(obj);
  };

  const updatePayload = (value, key) => {
    let obj = { ...payload };
    if (value) {
      obj[key] = value;
    } else {
      delete obj[key];
    }
    setPayload(obj);
  };

  const getDateRange = (date, dateString) => {
    // console.log(date, dateString);
    let obj = { ...payload };
    obj["from"] = dateString[0];
    obj["to"] = dateString[1];
    setPayload(obj);
  };

  const handleNavigation = (n) => {
    updateNotify(n?._id);
    navigate(`/app/${n?.link}`);
  };

  const updateNotify = (id) => {
    let payload = {
      method: "PUT",
      url: `/notification/${id}`,
      data: { status: "R" },
    };
    fetchApi(payload).then((res) => {
      getNotify();
    });
  };

  const onPagination = (page, pageSize) => {
    let obj = { ...payload };
    obj["limit"] = pageSize;
    obj["skip"] = (page - 1) * pageSize;
    setPayload(obj);
    setAllSelected(false);
    setNotifySelected([]);
  };

  const updateManyNotify = () => {
    let list = [];
    if (allSelected) {
      list = notification.map(function (n) {
        return n._id.toString();
      });
    } else {
      list = notifySelected;
    }

    let api = {
      method: "POST",
      url: "/notification",
      data: { list, status: payload["status"] == "R" ? "U" : "R" },
    };
    fetchApi(api).then((res) => {
      setAllSelected(false);
      setNotifySelected([]);
      getNotify();
      dispatch(
        fetchNotifications({
          limit: 5,
          status: "U",
        })
      );
    });
  };

  const getSelected = (id) => {
    let arr = [...notifySelected];
    let index = arr.findIndex((a) => a == id);
    if (index == -1) {
      arr.push(id);
    } else {
      arr.splice(index, 1);
    }
    setNotifySelected(arr);
  };

  return (
    <div>
      <div className="page-header">
        <div className="d-flex align-items-center gap-4">
          <h1>Notifications</h1>
          <SearchBoxZ
            placeholder={"Search by tracking ID or serial number"}
            onSearch={(value) => updatePayload(value, "search")}
          />
        </div>
        <div className="d-flex align-items-center gap-3">
          <Select
            allowClear
            // showSearch
            value={payload["client"]}
            className="custom-select p-small w-50"
            placeholder="Select Client"
            onChange={(value) => updatePayload(value, "client")}
            options={[]}
          />
          <DateFilter
            onChange={getDateRange}
            disabledDate={(current) => {
              return moment().add(0, "days") < current;
            }}
          />
        </div>
      </div>
      <div className="page-content">
        <div className="d-flex justify-content-between align-items-center">
          <TabZ labels={labels} defaultActive={"A"} onChange={onTabChange} />
          <div className="d-flex align-items-center gap-3">
            <button
              className="secondary-btn"
              onClick={() => setAllSelected(!allSelected)}
            >
              {allSelected ? "Unselect" : "Select"} All
            </button>
            <button className="primary-btn" onClick={updateManyNotify}>
              Make as {payload["status"] == "R" ? "Unread" : "Read"}
            </button>
          </div>
        </div>
        <Spin spinning={loading}>
          <div className="notification-page mt-1">
            {notifyList?.length > 0 ? (
              <div>
                <Each
                  array={notifyList}
                  render={(notify) => {
                    return (
                      <div>
                        <h6 className="time-line">{notify?.createdDate}</h6>
                        <div className="notification-wrap">
                          <Each
                            array={notify?.data}
                            render={(n) => {
                              return (
                                <div
                                  className={`notification-box ${
                                    n?.status == "U" ? "unread" : ""
                                  } ${n?.important ? "important" : ""}`}
                                >
                                  <div
                                    className="navigation-btn"
                                    onClick={() => handleNavigation(n)}
                                  ></div>
                                  <Checkbox
                                    className="custom-checkbox notify-checkbox me-2"
                                    onChange={() => getSelected(n?._id)}
                                    checked={
                                      notifySelected.includes(n?._id) ||
                                      allSelected
                                    }
                                  ></Checkbox>
                                  <div className="notification-icon">
                                    {n?.createdBy?.profileImg ? (
                                      <img
                                        className="notification-avatar"
                                        src={n?.createdBy?.profileImg}
                                        alt=""
                                      />
                                    ) : (
                                      <div className="me-2">
                                        <h4 className="temp-profile">
                                          {getTempProfile(n?.createdBy)}
                                        </h4>
                                      </div>
                                    )}
                                  </div>
                                  <div className="notification-content pt-0">
                                    <div className="d-flex align-items-center gap-3 me-3">
                                      <h6
                                        dangerouslySetInnerHTML={{
                                          __html: htmlDecode(n?.subject),
                                        }}
                                      ></h6>
                                    </div>

                                    <p className="notification-time">
                                      {timeDiff(n.createdAt)}
                                    </p>
                                  </div>
                                </div>
                              );
                            }}
                          />
                        </div>
                      </div>
                    );
                  }}
                />
                <Pagination
                  className="custom-pagination mt-4 ms-auto"
                  defaultCurrent={1}
                  pageSize={payload["limit"]}
                  total={
                    notifyCount[
                      payload["status"] == "A"
                        ? "total"
                        : payload["status"] == "U"
                        ? "unread"
                        : "read"
                    ]
                  }
                  onChange={onPagination}
                />
              </div>
            ) : (
              <div>
                <div className="no-notification my-5">
                  <img src={NoDataImg} alt="" />
                  <h4>
                    {payload["status"] == "U"
                      ? "No new notification"
                      : "No notification yet"}
                  </h4>
                </div>
              </div>
            )}
          </div>
        </Spin>
      </div>
    </div>
  );
}
