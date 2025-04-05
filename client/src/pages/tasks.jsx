import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { Table, DatePicker, Popover } from "antd";
import moment from "moment";

import EmptyTable from "../components/EmptyTable";
import SearchBoxZ from "../components/SearchBoxZ";
import TabZ from "../components/TabZ";

import { fetchTasks } from "../store/tasks/tasksSlice";

import { socket, tableStatusTabs } from "../helper";

const { RangePicker } = DatePicker;

export default function Tasks() {
  const dispatch = useDispatch();

  const [searchParams, setSearchParams] = useSearchParams();

  const tasks = useSelector((state) => state.tasks);

  const [payload, setPayload] = useState({
    limit: 10,
    skip: 0,
    status: searchParams.get("status") ?? "I",
  });

  const [tableData, setTableData] = useState([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    socket.on("tasks", (tasks) => {
      if (tasks?.update) {
        getTasks();
      }
    });
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

  const getTasks = () => {
    dispatch(fetchTasks(payload));
  };

  const pendingCol = [
    {
      title: "Serial No",
      dataIndex: "serialNo",
    },
    {
      title: "Tracking ID",
      dataIndex: "trackId",
      render: (_, { trackId }) => (
        <Link to={`/app/verification-report/${trackId}`} className="table-link">
          {trackId}
        </Link>
      ),
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
      title: "Submitted",
      dataIndex: "createdAt",
      render: (_, { createdAt }) => (
        <span>{moment.unix(createdAt).format("DD MMM YYYY, hh:mm A")}</span>
      ),
    },
  ];

  const completeCol = [
    {
      title: "Serial No",
      dataIndex: "serialNo",
    },
    {
      title: "Tracking ID",
      dataIndex: "trackId",
      render: (_, { trackId }) => (
        <Link to={`/app/verification-report/${trackId}`} className="table-link">
          {trackId}
        </Link>
      ),
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
            `${flags?.length} field${flags.length > 1 ? "s" : ""} not readable`
          ) : (
            "No flags"
          )}
        </span>
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

  const searchClick = (value) => {
    let obj = { ...payload };
    obj["search"] = value;
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

  return (
    <div>
      <div className="page-header">
        <div className="d-flex align-items-center gap-4">
          <h1>Tasks</h1>
          <SearchBoxZ
            placeholder={"Search by tracking ID or serial number"}
            onSearch={searchClick}
            onClear={searchClick}
          />
        </div>
        <RangePicker className="custom-datepicker" onChange={getDateRange} />
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
    </div>
  );
}
