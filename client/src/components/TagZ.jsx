import { useState, useEffect } from "react";

import InProgressIcon from "../assets/img/in-progress-icon.svg";
import ApprovedIcon from "../assets/img/approved-icon.svg";
import RejectedIcon from "../assets/img/rejected-icon.svg";
import ResubmittedIcon from "../assets/img/resubmitted-icon.svg";
import NewIcon from "../assets/img/new-icon.svg";
import ReviewIcon from "../assets/img/review-icon.svg";

export default function TagZ(props) {
  let { status, statusText } = props;

  const [currStatus, setCurrStatus] = useState({});

  useEffect(() => {
    let icon, text;
    switch (status) {
      case "in-progress":
        icon = InProgressIcon;
        text = "In progress";
        break;
      case "approved":
        icon = ApprovedIcon;
        text = "Approved";
        break;
      case "rejected":
        icon = RejectedIcon;
        text = "Rejected";
        break;
      case "resubmitted":
        icon = ResubmittedIcon;
        text = "Resubmitted";
        break;
      case "new":
        icon = NewIcon;
        text = "New";
        break;
      case "review":
        icon = ReviewIcon;
        text = "Review";
        break;
    }

    setCurrStatus({ icon, text });
  }, [status]);

  return (
    <div className="tag-z">
      <img src={currStatus?.icon} alt="" />
      <p>{statusText ?? currStatus?.text}</p>
    </div>
  );
}
