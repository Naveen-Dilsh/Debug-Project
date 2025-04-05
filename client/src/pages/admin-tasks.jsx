import { useState, useEffect } from "react";
import { Table, Select, DatePicker, Popover } from "antd";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import moment from "moment";

import SearchBoxZ from "../components/SearchBoxZ";
import TabZ from "../components/TabZ";
import TagZ from "../components/TagZ";
import EmptyTable from "../components/EmptyTable";
import DateFilter from "../components/DateFilter";
import ModalZ from "../components/ModalZ";

import { fetchTasks } from "../store/tasks/tasksSlice";
import { fetchUser } from "../store/users/usersSlice";

import {
  arrayToOption,
  socket,
  tableStatusTabs,
  downloadAsCSV,
  getTempProfile,
  formatFieldName,
} from "../helper";

export default function AdminTasks() {
  const dispatch = useDispatch();

  const navigate = useNavigate();

  const [searchParams, setSearchParams] = useSearchParams();

  const { userDetails } = useSelector((state) => state.auth);
  const tasks = useSelector((state) => state.tasks);
  const users = useSelector((state) => state.user);

  const [payload, setPayload] = useState({
    limit: 10,
    skip: 0,
    status: searchParams.get("status") ?? "I",
    role: "AD",
  });

  const [tableData, setTableData] = useState([]);
  const [total, setTotal] = useState(0);
  const [clientOptions, setClientOptions] = useState([]);
  const [picked, setPicked] = useState(false);

  useEffect(() => {
    getUsers();
    socket.on("tasks", (tasks) => {
      if (tasks?.update) {
        getTasks();
      }
    });
    return () => {
      socket.off("tasks");
    };
  }, []);

  useEffect(() => {
    getTasks();
  }, [payload]);

  useEffect(() => {
    let arr = [];
    tasks?.data?.list?.map((task, index) => {
      let obj = { ...task };
      obj["serialNo"] = index + payload["skip"] * 1 + 1;
      arr.push(obj);
    });

    setTableData(arr);

    let taskTotal =
      tasks?.data?.count[payload["status"] == "I" ? "inactive" : "active"];

    setTotal(taskTotal);
  }, [tasks]);

  useEffect(() => {
    let arr = arrayToOption(users?.data?.list, "_id", "username");
    setClientOptions(arr);
  }, [users]);

  const getTasks = () => {
    dispatch(fetchTasks(payload));
  };

  const getUsers = () => {
    dispatch(fetchUser({}));
  };

  const pendingCol = [
    {
      title: "",
      dataIndex: "isNew",
      render: (_, { isNew }) => (
        <span className={`table-new ${isNew ? "show" : ""}`}></span>
      ),
    },
    {
      title: "Serial No",
      dataIndex: "serialNo",
    },
    {
      title: "Tracking ID",
      dataIndex: "trackId",
      render: (_, { trackId, admin }) => (
        <>
          {userDetails?.role !== "admin" ||
          (admin && admin?._id !== userDetails?.id) ? (
            <span>{trackId}</span>
          ) : (
            <Link to={`/app/task/${trackId}`} className="table-link">
              {trackId}
            </Link>
          )}
        </>
      ),
    },
    {
      title: "Client",
      dataIndex: "clientName",
    },
    {
      title: "Assigned to",
      dataIndex: "assignee",
      render: (_, { analyst }) => {
        return (
          <div className="assignee">
            <div className="profile-img">
              {analyst?.profileImg ? (
                <img src={analyst?.profileImg} alt="" />
              ) : (
                <h4
                  className="temp-profile"
                  // style={{ backgroundColor: "#000" }}
                >
                  {getTempProfile(analyst)}
                </h4>
              )}
            </div>
            <p>{analyst?.firstName + " " + analyst?.lastName}</p>
          </div>
        );
      },
    },
    {
      title: "Flags",
      dataIndex: "flags",
      render: (_, { flags, iqFail, faceMatch }) => (
        <span>
          {!faceMatch ? (
            "Facial biometrics not match"
          ) : iqFail ? (
            <Popover content={iqFail} className="cursor-pointer">
              Fail Image Quality
            </Popover>
          ) : flags?.length > 0 ? (
            `${flags?.length} fields not readable`
          ) : (
            "No flags"
          )}
        </span>
      ),
    },
    {
      title: "Admin",
      dataIndex: "admin",
      render: (_, { admin }) => {
        if (admin) {
          return (
            <div className="assignee">
              <div className="profile-img">
                {admin?.profileImg ? (
                  <img src={admin?.profileImg} alt="" />
                ) : (
                  <h4
                    className="temp-profile"
                    // style={{ backgroundColor: "#000" }}
                  >
                    {getTempProfile(admin)}
                  </h4>
                )}
              </div>
              <p>{admin?.firstName + " " + admin?.lastName}</p>
            </div>
          );
        } else {
          return (
            <div className="assignee">
              <div className="profile-img unassigned">
                <h4 className="temp-profile">U</h4>
              </div>
              <p>Unassigned</p>
            </div>
          );
        }
      },
    },
    {
      title: "Submitted",
      dataIndex: "createdAt",
      render: (_, { createdAt }) => (
        <span>{moment.unix(createdAt).format("DD MMM YYYY, hh:mm A")}</span>
      ),
    },
  ];

  const completeCol = [
    {
      title: "",
      dataIndex: "isNew",
      render: (_, { isNew }) => (
        <span className={`table-new ${isNew ? "show" : ""}`}></span>
      ),
    },
    {
      title: "Serial No",
      dataIndex: "serialNo",
    },
    {
      title: "Tracking ID",
      dataIndex: "trackId",
      render: (_, { trackId, admin }) => (
        <>
          {userDetails?.role !== "admin" ||
          (admin && admin?._id !== userDetails?.id) ? (
            <span>{trackId}</span>
          ) : (
            <Link to={`/app/task/${trackId}`} className="table-link">
              {trackId}
            </Link>
          )}
        </>
      ),
    },
    {
      title: "Assigned to",
      dataIndex: "assignee",
      render: (_, { analyst }) => {
        if (analyst) {
          return (
            <div className="assignee">
              <span className="position-relative">
                {userDetails?.role == "admin" && (
                  <button className="remove-btn">
                    <i className="ri-close-circle-fill"></i>
                  </button>
                )}
                <div className="profile-img">
                  {analyst?.profileImg ? (
                    <img src={analyst?.profileImg} alt="" />
                  ) : (
                    <h4
                      className="temp-profile"
                      // style={{ backgroundColor: "#000" }}
                    >
                      {getTempProfile(analyst)}
                    </h4>
                  )}
                </div>
              </span>
              <p>{analyst?.firstName + " " + analyst?.lastName}</p>
            </div>
          );
        } else {
          return (
            // <Popover
            //   content={assigneeList}
            //   trigger="click"
            //   className="custom-popover"
            // >
            <div className="assignee">
              <div className="profile-img unassigned">
                <h4 className="temp-profile">U</h4>
              </div>
              <p>Unassigned</p>
            </div>
            // </Popover>
          );
        }
      },
    },
    {
      title: "Flags",
      dataIndex: "flags",
      render: (_, { flags, iqFail, faceMatch }) => (
        <span>
          {!faceMatch ? (
            "Facial biometrics not match"
          ) : iqFail ? (
            <Popover content={iqFail} className="cursor-pointer">
              Fail Image Quality
            </Popover>
          ) : flags?.length > 0 ? (
            `${flags?.length} fields not readable`
          ) : (
            "No flags"
          )}
        </span>
      ),
    },
    {
      title: "Admin",
      dataIndex: "admin",
      render: (_, { admin }) => {
        return (
          <div className="assignee">
            <div className="profile-img">
              {admin?.profileImg ? (
                <img src={admin?.profileImg} alt="" />
              ) : (
                <h4
                  className="temp-profile"
                  // style={{ backgroundColor: "#000" }}
                >
                  {getTempProfile(admin)}
                </h4>
              )}
            </div>
            <p>{admin?.firstName + " " + admin?.lastName}</p>
          </div>
        );
      },
    },
    {
      title: "Status",
      dataIndex: "position",
      render: (_, { position }) => (
        <TagZ
          status={position == "A" ? "approved" : "rejected"}
          statusText={position == "A" ? "Approved" : "Rejected"}
        />
      ),
    },
    {
      title: "Submitted",
      dataIndex: "createdAt",
      render: (_, { createdAt }) => (
        <span>{moment.unix(createdAt).format("DD MMM YYYY, hh:mm A")}</span>
      ),
    },
    {
      title: "Completed",
      dataIndex: "completedAt",
      render: (_, { completedAt }) => (
        <span>{moment.unix(completedAt).format("DD MMM YYYY, hh:mm A")}</span>
      ),
    },
  ];

  const updatePayload = (value, key) => {
    let obj = { ...payload };
    if (value) {
      obj[key] = value;
    } else {
      delete obj[key];
    }
    setPayload(obj);
  };

  const onStatusChange = (key) => {
    let obj = { ...payload };
    // console.log(key);
    obj["limit"] = 10;
    obj["skip"] = 0;
    obj["status"] = key;
    setSearchParams({ status: key });
    setPayload(obj);
  };

  const getDateRange = (date, dateString) => {
    // console.log(date, dateString);
    let obj = { ...payload };
    obj["from"] = dateString[0];
    obj["to"] = dateString[1];
    setPayload(obj);
  };

  const onPagination = (page, pageSize) => {
    let obj = { ...payload };
    obj["limit"] = pageSize;
    obj["skip"] = (page - 1) * pageSize;
    setPayload(obj);
  };

  const downloadReport = () => {
    const transformedData = tableData.map((item) => {
      let obj = {
        "Serial no": item.serialNo,
        "Track Id": item.trackId,
        Analyst: item?.analyst
          ? `${item?.analyst?.firstName} ${item?.analyst?.lastName}`
          : "Unassigned",
        Flags:
          item.flags?.length > 0
            ? formatFieldName(item.flags?.join(", "))
            : "No flags",
        Admin: item?.admin
          ? `${item?.admin?.firstName} ${item?.admin?.lastName}`
          : "Unassigned",
        Submitted: moment.unix(item.createdAt).format("DD MMM YYYY, hh:mm A"),
      };
      if (payload["status"] == "C") {
        obj["Status"] = item.position == "A" ? "Approved" : "Rejected";
      } else {
        obj["Client"] = item.clientName;
      }
      return obj;
    });
    let fileName = `admin-tasks_${
      payload["status"] == "I" ? "in-progress" : "completed"
    }${
      payload["client"]
        ? "_client=" +
          clientOptions.filter((c) => c.value == payload["client"]).label
        : ""
    }${payload["from"] ? "_" + payload["from"] + "_" + payload["to"] : ""}`;

    downloadAsCSV(transformedData, fileName);
  };

  // useEffect(() => {
  //   socket.on("message", (data) => {
  //     getTasks();
  //     let task = localStorage.getItem("picked-task");
  //     if (data?.user == userDetails?.id && data?.trackId == task) {
  //       navigate(`/app/task/${data?.trackId}`);
  //     } else {
  //       setPicked(true);
  //     }
  //     localStorage.removeItem("picked-task");
  //   });

  //   return () => {
  //     socket.off("message");
  //   };
  // }, []);

  // const pickTask = (trackId) => {
  //   localStorage.setItem("picked-task", trackId);
  //   socket.emit("message", { trackId, user: userDetails?.id });
  // };

  return (
    <div>
      <div className="page-header">
        <div className="d-flex align-items-center gap-4">
          <h1>Admin Tasks</h1>
          <SearchBoxZ
            placeholder={"Search by tracking ID or serial number"}
            onSearch={(value) => updatePayload(value, "search")}
            onClear={(value) => updatePayload(value, "search")}
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
            options={clientOptions}
          />
          <DateFilter
            onChange={getDateRange}
            disabledDate={(current) => {
              return moment().add(0, "days") < current;
            }}
          />
          <button className="primary-btn" onClick={downloadReport}>
            Download
          </button>
        </div>
      </div>
      <div className="page-content">
        <TabZ
          labels={tableStatusTabs}
          defaultActive={payload["status"]}
          customClass={"table-tabs mb-4"}
          onChange={onStatusChange}
        />
        {tableData?.length > 0 ? (
          <Table
            loading={tasks.isLoading}
            className="custom-table"
            rowKey={"serialNo"}
            columns={payload["status"] == "I" ? pendingCol : completeCol}
            dataSource={tableData}
            pagination={{
              className: "custom-pagination",
              defaultCurrent: 1,
              total,
              onChange: onPagination,
            }}
          />
        ) : (
          <EmptyTable message="It looks like you haven't submitted any documents for scanning yet." />
        )}
      </div>
      <ModalZ
        show={picked}
        title={
          <>
            <i className="ri-information-line icon-yellow"></i> Access denied
          </>
        }
        onOk={() => setPicked(false)}
        onCancel={() => setPicked(false)}
        okBtnText="Okay"
      >
        <p>
          This task has already been taken by some admin; pick any other task.
        </p>
      </ModalZ>
    </div>
  );
}
