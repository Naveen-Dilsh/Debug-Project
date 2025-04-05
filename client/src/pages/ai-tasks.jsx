import { useState, useEffect } from "react";
import { Table, DatePicker } from "antd";

import SearchBoxZ from "../components/SearchBoxZ";
import TabZ from "../components/TabZ";

import InProgressIcon from "../assets/img/in-progress-icon.svg";
import ApprovedIcon from "../assets/img/approved-icon.svg";

export default function AiTasks() {
  const labels = [
    {
      key: 1,
      label: (
        <>
          <img src={ApprovedIcon} alt="" /> Completed
        </>
      ),
    },
    {
      key: 2,
      label: (
        <>
          <img src={InProgressIcon} alt="" /> In Progress
        </>
      ),
    },
  ];

  const columns = [
    {
      title: "Serial No",
      dataIndex: "serialNo",
    },
    {
      title: "Tracking ID",
      dataIndex: "trackingID",
      render: (_, { trackingID }) => (
        <span className="table-id">{trackingID}</span>
      ),
    },
    {
      title: "Flags",
      dataIndex: "flags",
    },
    {
      title: "Status",
      dataIndex: "status",
    },
    {
      title: "Submitted",
      dataIndex: "submitted",
    },
  ];

  const data = [
    {
      serialNo: "00000001",
      trackingID: "NLTRACKQOZTVTMS",
      flags: "2 fields not readable",
      completed: "12 May 2024, 12.54 PM",
      submitted: "11 May 2024, 10.54 AM",
    },
    {
      serialNo: "00000002",
      trackingID: "NLTRACKQOZTVTMS",
      flags: "2 fields not readable",
      completed: "12 May 2024, 12.54 PM",
      submitted: "11 May 2024, 10.54 AM",
    },
    {
      serialNo: "00000003",
      trackingID: "NLTRACKQOZTVTMS",
      flags: "2 fields not readable",
      completed: "12 May 2024, 12.54 PM",
      submitted: "11 May 2024, 10.54 AM",
    },
    {
      serialNo: "00000004",
      trackingID: "NLTRACKQOZTVTMS",
      flags: "2 fields not readable",
      completed: "12 May 2024, 12.54 PM",
      submitted: "11 May 2024, 10.54 AM",
    },
    {
      serialNo: "00000005",
      trackingID: "NLTRACKQOZTVTMS",
      flags: "2 fields not readable",
      completed: "12 May 2024, 12.54 PM",
      submitted: "11 May 2024, 10.54 AM",
    },
  ];

  const searchClick = (value) => {
    console.log(value);
  };

  return (
    <div>
      <div className="page-header">
        <div className="d-flex align-items-center gap-4">
          <h1>Tasks</h1>
          <SearchBoxZ onSearch={searchClick} />
        </div>
        <DatePicker className="custom-datepicker" />
      </div>
      <div className="page-content">
        <TabZ
          labels={labels}
          defaultActive={"2"}
          customClass={"table-tabs mb-4"}
        />
        <Table
          className="custom-table"
          rowKey={"serialNo"}
          columns={columns}
          dataSource={data}
          pagination={{
            className: "custom-pagination",
          }}
        />
      </div>
    </div>
  );
}
