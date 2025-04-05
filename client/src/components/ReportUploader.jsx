import React, { useRef, useState, useEffect } from "react";
import { Modal, Popover } from "antd";

import {
  sendNotify,
  fileToBase64,
  downloadFile,
  formatBytes,
  createEmptyArray,
  fetchApi,
} from "../helper";

import PDFIcon from "../assets/img/pdf-icon.svg";
import DOCIcon from "../assets/img/doc-icon.svg";
import DOCXIcon from "../assets/img/docx-icon.svg";
import XLSIcon from "../assets/img/xls-icon.svg";
import XLSXIcon from "../assets/img/xlsx-icon.svg";

export default function UploadZ(props) {
  let {
    file,
    fileName,
    downloadOnly,
    onStoreFile,
    onDeleteFile,
    hideDownload,
    clearUpload,
    customError,
  } = props;

  const uploaderRef = useRef(null);

  const [document, setDocument] = useState(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [docModal, setDocModal] = useState(false);

  useEffect(() => {
    if (file) {
      let obj = { ...file };
      obj.size = formatBytes(obj.size);
      setDocument(obj);
    }
  }, [file, file?.isApproved]);

  useEffect(() => {
    if (clearUpload) {
      onDeleteHandle();
    }
  }, [clearUpload]);

  useEffect(() => {
    if (customError) {
      setError(customError);
    }
  }, [customError]);

  const onFileUpload = (e) => {
    let file = e.target.files[0];
    extractFile(file);
  };

  const extractFile = (file) => {
    setError(false);
    let doc = {};
    if (file) {
      if (file?.size > 10485760) {
        setError(true);
        sendNotify("error", "File is too big!, Upload below 10MB file.");
      } else {
        let type = file?.name.substring(file?.name.lastIndexOf(".") + 1);
        var regex = new RegExp("(.*?)(pdf|docx|doc|xls|xlsx|csv)$");
        if (regex.test(type)) {
          setLoading(true);
          fileToBase64(file)
            .then((data) => {
              doc["url"] = URL.createObjectURL(file);
              doc["name"] = file?.name;
              doc["size"] = formatBytes(file?.size);
              doc["type"] = type;
              doc["base64"] = data;
              setDocument(doc);
              onStoreFile(doc);
              sendNotify("success", "File uploaded successfully.");
              setLoading(false);
            })
            .catch((error) => ({ error: JSON.stringify(error) }));
          var bodyFormData = new FormData();
          bodyFormData.append("file", file);
          bodyFormData.append("folder", "test");
          let payload = {
            method: "POST",
            url: `/file`,
            data: bodyFormData,
            headers: {
              "Content-Type": "multipart/form-data",
            },
          };
          // fetchApi(payload)
          //   .then((res) => {
          //     console.log(res, "res");
          //     doc["url"] = res?.data?.singedUrl;
          //     doc["name"] = file?.name;
          //     doc["size"] = formatBytes(file?.size);
          //     doc["type"] = type;
          //     doc["base64"] = res?.data?.value;
          //     setDocument(doc);
          //     onStoreFile({
          //       document: fileName,
          //       name: file?.name,
          //       size: file?.size,
          //       type: type,
          //       url: res?.data?.url,
          //     });
          //     sendNotify("success", res?.message);
          //     setLoading(false);
          //   })
          //   .catch((error) => {
          //     setLoading(false);
          //     sendNotify("error", error?.message);
          //   });
        } else {
          setError(true);
          sendNotify(
            "error",
            "Only PDF, DOC, DOCX, XLS or CSV file are supported."
          );
        }
      }
    }
  };

  const fileIcons = {
    pdf: PDFIcon,
    doc: DOCIcon,
    docx: DOCXIcon,
    xls: XLSIcon,
    xlsx: XLSXIcon,
  };

  const viewDocument = () => {
    setDocModal(true);
  };

  const onDeleteHandle = () => {
    setDocument(null);
    if (typeof onStoreFile != "undefined") {
      onStoreFile(null);
    }
    if (typeof onDeleteFile != "undefined") {
      onDeleteFile(fileName);
    }
  };

  const handleOk = () => {
    setDocModal(false);
  };

  const handleCancel = () => {
    setDocModal(false);
  };

  return (
    <div>
      <div className="uploader report-uploader">
        <div className={`uploaded ${document ? "show-file" : ""}`}>
          <div className="uploaded-file">
            <img className="file-icon" src={fileIcons[document?.type]} alt="" />
            <div className="ms-2 w-100">
              <h6
                onClick={() =>
                  document?.type == "pdf" ? viewDocument(document?.name) : null
                }
                disabled={document?.type != "pdf"}
              >
                {document?.name}
              </h6>
              <p>{document?.size}</p>
            </div>
          </div>
          <div className="d-flex align-items-center gap-2 w-100 mt-2">
            {!downloadOnly && (
              <button
                className="download-btn"
                title="Reupload"
                onClick={() => uploaderRef.current.click()}
              >
                <i className="ri-loop-left-line"></i>
              </button>
            )}
            {!hideDownload && (
              <button
                className="download-btn"
                title="Download"
                onClick={() => downloadFile(document?.url, document?.name)}
              >
                <i className="ri-download-2-line"></i>
              </button>
            )}
            {!downloadOnly && (
              <button
                className="delete-btn"
                title="Delete"
                onClick={onDeleteHandle}
              >
                <i className="ri-delete-bin-line"></i>
              </button>
            )}
          </div>
        </div>
        <div
          className={`upload-wrapper ${document ? "hide-upload" : ""} ${
            error ? "upload-error" : ""
          } ${loading ? "loading-upload" : ""}`}
        >
          <input
            ref={uploaderRef}
            type="file"
            name={fileName}
            id="dealCsv"
            onChange={onFileUpload}
            accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
          />
          <span className="icon">
            {loading ? (
              <div className="rotate-ani">
                <i className="ri-loader-2-line"></i>
              </div>
            ) : (
              <>
                {error ? (
                  <i className="ri-file-close-line"></i>
                ) : (
                  <i className="ri-upload-line"></i>
                )}
              </>
            )}
          </span>
          <h4>Drag and Drop your files here</h4>
          <h3>Or</h3>
          <h6>Browse Files</h6>
        </div>
      </div>
      <Modal
        title={document?.name}
        className="custom-modal"
        open={docModal}
        width={1000}
        onOk={handleOk}
        onCancel={handleCancel}
      >
        <div className="document-view">
          <iframe
            src={`data:application/pdf;base64,${document?.base64}`}
            frameBorder="0"
            height="100%"
            width="100%"
          ></iframe>
        </div>
      </Modal>
    </div>
  );
}
