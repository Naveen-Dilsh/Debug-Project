import React from "react";
import { DatePicker } from "antd";
import dayjs from "dayjs";

const { RangePicker } = DatePicker;

export default function DateFilter({ onChange, disabledDate }) {
  const rangePresets = [
    {
      label: "Today",
      value: [dayjs().startOf("day"), dayjs().endOf("day")],
    },
    {
      label: "Yesterday",
      value: [
        dayjs().subtract(1, "day").startOf("day"),
        dayjs().subtract(1, "day").endOf("day"),
      ],
    },
    {
      label: "This week",
      value: [dayjs().startOf("week"), dayjs().endOf("week")],
    },
    {
      label: "Last week",
      value: [
        dayjs().subtract(1, "week").startOf("week"),
        dayjs().subtract(1, "week").endOf("week"),
      ],
    },
    {
      label: "This month",
      value: [dayjs().startOf("month"), dayjs().endOf("month")],
    },
    {
      label: "Last month",
      value: [
        dayjs().subtract(1, "month").startOf("month"),
        dayjs().subtract(1, "month").endOf("month"),
      ],
    },
    {
      label: "This year",
      value: [dayjs().startOf("year"), dayjs().endOf("year")],
    },
    {
      label: "Last year",
      value: [
        dayjs().subtract(1, "year").startOf("year"),
        dayjs().subtract(1, "year").endOf("year"),
      ],
    },
  ];

  return (
    <RangePicker
      className="custom-datepicker p-small"
      presets={rangePresets}
      onChange={onChange}
      disabledDate={disabledDate}
    />
  );
}
