import React from "react";

import NoDataImg from "../assets/img/no-data.png";

export default function NoData() {
  return (
    <div className="no-data">
      <img src={NoDataImg} alt="" />
      <h6>No data was found to render.</h6>
    </div>
  );
}
