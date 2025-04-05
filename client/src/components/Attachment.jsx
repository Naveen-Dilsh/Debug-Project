import { useState, useEffect } from "react";

import PDFIcon from "../assets/img/pdf-file-icon.svg";
import DOCIcon from "../assets/img/document-icon.svg";
import XLSIcon from "../assets/img/spreadsheet-icon.svg";
import IMGIcon from "../assets/img/image-icon.svg";

import { downloadBase64, formatBytes } from "../helper";

export default function Attachment({ file }) {
  const [fileIcon, setFileIcon] = useState("");

  useEffect(() => {
    let type = "";
    if (file?.type == "pdf") {
      type = PDFIcon;
    } else if (["doc", "docx", "txt"].includes(file?.type)) {
      type = DOCIcon;
    } else if (["xls", "xlsx"].includes(file?.type)) {
      type = XLSIcon;
    } else {
      type = IMGIcon;
    }
    setFileIcon(type);
  }, [file]);

  return (
    <div className="attachment">
      <div className="d-flex align-items-center gap-1 w-76">
        <img className="attachment-icon" src={fileIcon} alt="" />
        <div className="attachment-details">
          <h6>{file?.name}</h6>
          <p>{formatBytes(file?.size)}</p>
        </div>
      </div>
      <button
        className="attachment-download-btn"
        onClick={() => downloadBase64(file?.base64, file?.name, file?.type)}
      >
        <i className="ri-download-2-line"></i>
      </button>
    </div>
  );
}
