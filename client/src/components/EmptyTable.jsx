import React from "react";

export default function EmptyTable({ message }) {
  return (
    <div className="empty-table">
      <ul className="empty-vector">
        <li>
          <span className="line"></span>
          <span className="round"></span>
        </li>
        <li>
          <span className="line"></span>
          <span className="round"></span>
        </li>
        <li>
          <span className="line"></span>
          <span className="round"></span>
        </li>
        <li>
          <span className="line"></span>
          <span className="round"></span>
        </li>
        <li>
          <span className="line"></span>
          <span className="round"></span>
        </li>
      </ul>
      <p>{message}</p>
    </div>
  );
}
