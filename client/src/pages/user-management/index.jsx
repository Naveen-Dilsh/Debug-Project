import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { Table, Popover } from "antd";
import dayjs from "dayjs";

import { customPagination, socket } from "../../helper";

import TableSortArrows from "../../components/tableSortArrows";
import TagZ from "../../components/TagZ";

import { fetchUser } from "../../store/users/usersSlice";

export default function UserManagement() {
  const dispatch = useDispatch();

  let { userDetails } = useSelector((state) => state.auth);
  const user = useSelector((state) => state.user);

  const [payload, setPayload] = useState({
    limit: 10,
    skip: 0,
  });

  useEffect(() => {
    socket.on("users", (users) => {
      if (users?.update) {
        getUsers();
      }
    });
    return () => {
      socket.off("users");
    };
  }, []);

  useEffect(() => {
    getUsers();
  }, [payload]);

  const getUsers = () => {
    dispatch(fetchUser(payload));
  };

  let columns = [
    {
      title: "",
      dataIndex: "",
      width: 50,
      render: (_, { resetReq }) => (
        <div className={`req-reset ${resetReq ? "show" : ""}`}>
          <div className="lock-icon">
            <i className="ri-lock-2-line"></i>
          </div>
        </div>
      ),
    },
    {
      title: "Name",
      dataIndex: "name",
      render: (_, { firstName, lastName, _id, status }) => (
        <Link to={`/app/edit-user/${_id}`} className="table-link">
          {firstName + " " + lastName}
        </Link>
      ),
    },
    {
      title: "Username",
      dataIndex: "username",
    },
    {
      title: "Email Address",
      dataIndex: "email",
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (_, { status }) => {
        return (
          <TagZ
            status={
              status == "A"
                ? "approved"
                : status == "I"
                ? "rejected"
                : status == "P" && "resubmitted"
            }
            statusText={
              status == "A"
                ? "Active"
                : status == "I"
                ? "Inactive"
                : status == "P" && "Pending"
            }
          />
        );
      },
    },
  ];

  if (userDetails?.role === "admin") {
    columns.push({
      title: "Access Type",
      dataIndex: "role",
      sorter: (a, b) => a.role - b.role,
      sortIcon: ({ sortOrder }) => <TableSortArrows sorted={sortOrder} />,
      render: (_, { role }) => {
        return (
          <div className="access-badge">
            <span className={role}></span>
            {role}
          </div>
        );
      },
    });
  }

  const onPagination = (page, pageSize) => {
    let obj = { ...payload };
    obj["limit"] = pageSize;
    obj["skip"] = (page - 1) * pageSize;
    setPayload(obj);
  };

  return (
    <div>
      <div className="page-header">
        <h1>User Management</h1>
        <Link to={"/app/add-user"} className="primary-btn">
          Add User
        </Link>
      </div>
      <div className="page-content">
        <Table
          rowKey={"_id"}
          className="custom-table"
          columns={columns}
          dataSource={user?.data?.list}
          pagination={{
            className: "custom-pagination",
            defaultCurrent: 1,
            total: user?.data?.count?.total,
            onChange: onPagination,
          }}
        />
      </div>
    </div>
  );
}
