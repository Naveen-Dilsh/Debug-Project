import React from "react";

export default function LoaderZ({ children, loading }) {
  return (
    <div className={`loader-z ${loading ? "loading" : ""}`}>
      <div className="loader-z-wrapper">
        <div className="loader-z-icon-wrapper">
          <div className="loader-z-icon">
            <i className="ri-loader-4-line"></i>
          </div>
        </div>
      </div>
      <div className="loader-z-content">{children}</div>
    </div>
  );
}
