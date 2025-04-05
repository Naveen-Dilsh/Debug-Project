import React from "react";

export default function TableSortArrows(props) {
  let { sorted } = props;

  return (
    <div className="table-sort-arrows">
      <i
        className={`fas fa-chevron-up ${
          sorted == "ascend" ? "color-primary" : ""
        }`}
      ></i>
      <i
        className={`fas fa-chevron-down ${
          sorted == "descend" ? "color-primary" : ""
        }`}
      ></i>
    </div>
  );
}
