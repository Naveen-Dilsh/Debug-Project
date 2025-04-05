import React from "react";

export default function Loading(props) {
  let { type } = props;

  return (
    <div className="loading">
      {type == "download" && (
        <div>
          <span className="loader-download"></span>
          <h6>Fetching the data...</h6>
        </div>
      )}
      {type == "upload" && (
        <div>
          <span className="loader-upload"></span>
          <h6>Uploading the data...</h6>
        </div>
      )}
      {!type && (
        <div>
          <div className="loading-wrapper">
            <span className="loader-normal"></span>
          </div>
          <h6>Loading...</h6>
        </div>
      )}
    </div>
  );
}
