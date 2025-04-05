import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Skeleton } from "antd";
import html2pdf from "html2pdf.js";

import LogoLight from "../assets/img/logo-light.svg";
import NoImage from "../assets/img/no-image.png";
import PowerIcon from "../assets/img/power-icon.png";
import InProgressImg from "../assets/img/work-in-progress.svg";

import {
  fetchApi,
  formatTime,
  checkDate,
  checkEmpty,
  checkLink,
  arrayToStr,
} from "../helper";
import dayjs from "dayjs";

import { Each } from "../helper";

export default function VerificationReport() {
  let { id } = useParams();

  const navigate = useNavigate();

  const [report, setReport] = useState(null);
  const [wcReport, setWcReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      getReport();
    } else {
      setReport(null);
    }
  }, [id]);

  function getReport() {
    setLoading(true);
    let payload = {
      method: "GET",
      url: `/wc-report/${id}`,
    };
    fetchApi(payload)
      .then((res) => {
        let data = res?.data;
        setLoading(false);
        setReport(data["task"]);
        setWcReport(data["wcReport"]);
      })
      .catch((err) => console.log(err));
  }

  function downloadReport(id, filename) {
    const wcReport = document.getElementById(id);

    const report = wcReport.cloneNode(true);
    report.classList.remove("d-none");

    let opt = {
      margin: [15, 0, 15, 0],
      filename,
      jsPDF: { unit: "pt", format: "a4", orientation: "p" },
      pagebreak: { mode: "avoid-all" },
    };

    html2pdf()
      .from(report)
      .set(opt)
      .toPdf()
      .get("pdf")
      .then((pdf) => {
        var totalPages = pdf.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
          pdf.setPage(i);

          pdf.setFillColor(118, 40, 47);
          pdf.rect(
            0,
            pdf.internal.pageSize.getHeight() - 30,
            pdf.internal.pageSize.getWidth(),
            30,
            "F"
          );

          // Add icon
          pdf.addImage(
            PowerIcon,
            "PNG",
            pdf.internal.pageSize.getWidth() / 2 - 69,
            pdf.internal.pageSize.getHeight() - 22,
            8,
            13
          );

          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(10);
          pdf.setTextColor(255, 255, 255);
          pdf.text(
            "Powered by",
            pdf.internal.pageSize.getWidth() / 2 - 56,
            pdf.internal.pageSize.getHeight() - 12
          );

          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(10);
          pdf.setTextColor(255, 255, 255);
          pdf.text(
            "NorthLark Wren",
            pdf.internal.pageSize.getWidth() / 2,
            pdf.internal.pageSize.getHeight() - 12
          );
        }
      })
      .catch((err) => {
        console.log(err);
      })
      .save();
  }

  const backToList = () => {
    navigate(-1);
  };

  return (
    <div>
      <div className="page-header">
        <h1
          className="d-flex align-items-center gap-2 cursor-pointer"
          onClick={backToList}
        >
          <i className="ri-arrow-left-line"></i> Customer Verification Report
        </h1>
        <div className={`${report?.status == "C" ? "d-flex" : "d-none"} gap-3`}>
          <button
            className="primary-btn"
            onClick={() =>
              downloadReport("report-pdf", `Verification Report - ${id}.pdf`)
            }
          >
            <i className="ri-download-line"></i>
            Verification Report
          </button>
          <button
            className="primary-btn ms-auto"
            onClick={() =>
              downloadReport("wcReport", `World Check Report - ${id}.pdf`)
            }
          >
            <i className="ri-download-line"></i> World Check Report
          </button>
        </div>
      </div>
      <div className="page-content">
        <div className="row">
          <div className="col-md-7 custom-border-right pe-3">
            {report?.status == "C" ? (
              <div>
                <div className="breadcrumb-wrapper">
                  <span className="breadcrumb-badge">
                    <i className="ri-global-line"></i> {id}
                  </span>
                  <span className="breadcrumb-arrow">
                    <i className="ri-arrow-right-s-line"></i>
                  </span>
                  <span className="breadcrumb-text">Processed Details</span>
                </div>
                <ul className="verification-report mt-3">
                  {report?.photo && (
                    <li>
                      <div className="verification-report-item">
                        <span className="label">Face Match</span>
                        <span
                          className={`custom-badge ${
                            report?.faceMatch ? "badge-success" : "badge-error"
                          }`}
                        >
                          {report?.faceMatch ? "Match" : "Not Match"}
                        </span>
                      </div>
                    </li>
                  )}
                  {report?.subResult && (
                    <li>
                      <div className="verification-report-item">
                        <span className="label">Sub Results</span>
                        <span
                          className={`custom-badge ${
                            report?.subResult == "Rejected"
                              ? "badge-error"
                              : report?.subResult == "Suspected"
                              ? "badge-warning"
                              : report?.subResult == "Caution"
                              ? "badge-warning"
                              : "badge-success"
                          }`}
                        >
                          {report?.subResult}
                        </span>
                      </div>
                    </li>
                  )}
                  {report?.wcReportStatus && (
                    <li>
                      <div className="verification-report-item">
                        <span className="label">World Check Report</span>
                        <span className={`custom-badge uppercase`}>
                          {report?.wcReportStatus}
                        </span>
                      </div>
                    </li>
                  )}
                  <li>
                    <div className="verification-report-item">
                      <span className="label">Issuing Country</span>
                      <span
                        className={`custom-badge ${
                          report?.flags.includes("issuingCountry")
                            ? "badge-error"
                            : ""
                        }`}
                      >
                        {report?.flags.includes("issuingCountry")
                          ? "Not readable"
                          : report?.issuingCountry ?? "N/A"}
                      </span>
                    </div>
                  </li>
                  <li>
                    <div className="verification-report-item">
                      <span className="label">Region</span>
                      <span
                        className={`custom-badge ${
                          report?.flags.includes("region") ? "badge-error" : ""
                        }`}
                      >
                        {report?.flags.includes("region")
                          ? "Not readable"
                          : report?.region ?? "N/A"}
                      </span>
                    </div>
                  </li>
                  <li>
                    <div className="verification-report-item">
                      <span className="label">Type of Document</span>
                      <span
                        className={`custom-badge ${
                          report?.flags.includes("documentType")
                            ? "badge-error"
                            : ""
                        }`}
                      >
                        {report?.flags.includes("documentType")
                          ? "Not readable"
                          : report?.documentType ?? "N/A"}
                      </span>
                    </div>
                  </li>
                  <li>
                    <div className="verification-report-item">
                      <span className="label">First Name</span>
                      <span
                        className={`custom-badge ${
                          report?.flags.includes("firstName")
                            ? "badge-error"
                            : ""
                        }`}
                      >
                        {report?.flags.includes("firstName")
                          ? "Not readable"
                          : report?.firstName ?? "N/A"}
                      </span>
                    </div>
                  </li>
                  <li>
                    <div className="verification-report-item">
                      <span className="label">Last Name</span>
                      <span
                        className={`custom-badge ${
                          report?.flags.includes("lastName")
                            ? "badge-error"
                            : ""
                        }`}
                      >
                        {report?.flags.includes("lastName")
                          ? "Not readable"
                          : report?.lastName ?? "N/A"}
                      </span>
                    </div>
                  </li>
                  <li>
                    <div className="verification-report-item">
                      <span className="label">Date of Birth</span>
                      <span
                        className={`custom-badge ${
                          report?.flags.includes("dateOfBirth")
                            ? "badge-error"
                            : ""
                        }`}
                      >
                        {report?.flags.includes("dateOfBirth")
                          ? "Not readable"
                          : report?.dateOfBirth
                          ? dayjs(report?.dateOfBirth).format("MMM DD, YYYY")
                          : "N/A"}
                      </span>
                    </div>
                  </li>
                  <li>
                    <div className="verification-report-item">
                      <span className="label">Document Number</span>
                      <span
                        className={`custom-badge ${
                          report?.flags.includes("documentNo")
                            ? "badge-error"
                            : ""
                        }`}
                      >
                        {report?.flags.includes("documentNo")
                          ? "Not readable"
                          : report?.documentNo ?? "N/A"}
                      </span>
                    </div>
                  </li>
                  <li>
                    <div className="verification-report-item">
                      <span className="label">Personal Number</span>
                      <span
                        className={`custom-badge ${
                          report?.flags.includes("personalNo")
                            ? "badge-error"
                            : ""
                        }`}
                      >
                        {report?.flags.includes("personalNo")
                          ? "Not readable"
                          : report?.personalNo ?? "N/A"}
                      </span>
                    </div>
                  </li>
                  <li>
                    <div className="verification-report-item">
                      <span className="label">Expiry Date</span>
                      <span
                        className={`custom-badge ${
                          report?.flags.includes("dateOfExpiry")
                            ? "badge-error"
                            : ""
                        }`}
                      >
                        {report?.flags.includes("dateOfExpiry")
                          ? "Not readable"
                          : report?.dateOfExpiry
                          ? dayjs(report?.dateOfExpiry).format("MMM DD, YYYY")
                          : "N/A"}
                      </span>
                    </div>
                  </li>
                  <div className="custom-border-bottom my-3"></div>
                  {report?.iqFail && (
                    <div>
                      <li>
                        <div className="verification-report-item">
                          <span className="label">IQ Fail</span>
                          <span className="custom-badge">{report?.iqFail}</span>
                        </div>
                      </li>
                      <div className="custom-border-bottom my-3"></div>
                    </div>
                  )}
                  {/* <li>
                    <div className="verification-report-item">
                      <span className="label">Face Recognition Time</span>
                      <span className="custom-badge">
                        {report?.faceMatchTime
                          ? formatTime(report?.faceMatchTime)
                          : "N/A"}
                      </span>
                    </div>
                  </li>
                  <li>
                    <div className="verification-report-item">
                      <span className="label">Text Extraction Time</span>
                      <span className="custom-badge">
                        {report?.extractionTime
                          ? formatTime(report?.extractionTime)
                          : "N/A"}
                      </span>
                    </div>
                  </li>
                  <div className="custom-border-bottom my-3"></div> */}
                </ul>
                <button className="secondary-btn ms-auto">
                  Contact Support
                </button>
              </div>
            ) : (
              <div className="in-progress-wrapper w-75 mx-auto mt-5 pt-5">
                <img src={InProgressImg} className="in-progress-icon" alt="" />
                <div>
                  <h6>Processing</h6>
                  <p>
                    Your request is still being processed. Please check back
                    shortly for the complete results. <br />
                    <br /> If you have urgent inquiries, feel free to contact
                    our support team.
                  </p>
                  <button className="secondary-btn">Contact Support</button>
                </div>
              </div>
            )}
          </div>
          <div className="col-md-5">
            <div className="document-img px-5 mx-5">
              {report?.photo && (
                <>
                  <div className="custom-label">Live Photo</div>
                  <div className="w-100">
                    {loading ? (
                      <Skeleton.Image
                        active
                        className="custom-image-loader h-400 mt-2 mb-3"
                      />
                    ) : (
                      <img
                        src={report?.photo ?? NoImage}
                        alt=""
                        className="w-100 mt-2 mb-3"
                      />
                    )}
                  </div>
                </>
              )}
              <div className="custom-label">Document Front</div>
              <div className="w-100">
                {loading ? (
                  <Skeleton.Image
                    active
                    className="custom-image-loader mt-2 mb-3"
                  />
                ) : (
                  <img
                    src={report?.docFront ?? NoImage}
                    alt=""
                    className="w-100 mt-2 mb-3"
                  />
                )}
              </div>
              <div className="custom-label">Document Back</div>
              <div className="w-100">
                {loading ? (
                  <Skeleton.Image
                    active
                    className="custom-image-loader mt-2 mb-3"
                  />
                ) : (
                  <img
                    src={report?.docBack ?? NoImage}
                    alt=""
                    className="w-100 mt-2 mb-3"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-white d-none" id="report-pdf">
        <table style={{ width: "100%", borderSpacing: 0 }}>
          <thead>
            <tr
              style={{
                borderBottom: "1px solid #ededed",
                background: "#f6f8fa",
              }}
            >
              <td
                style={{
                  padding: "16px 20px",
                }}
              >
                <img
                  src={LogoLight}
                  alt="Logo"
                  style={{ width: 100 }}
                  width={100}
                />
              </td>
              <td
                style={{
                  textAlign: "right",
                  padding: "16px 20px",
                }}
              >
                <h6
                  style={{
                    color: "#393a4b",
                    fontSize: 14,
                    fontStyle: "normal",
                    fontWeight: 500,
                    lineHeight: "normal",
                    margin: "0px 0px 10px 0px",
                  }}
                >
                  Customer Verification Report
                </h6>
                <span className="track-id-badge ms-auto">
                  <i
                    style={{ fontSize: 16, marginRight: 5 }}
                    className="ri-global-line"
                  ></i>
                  {report?.trackId}
                </span>
              </td>
            </tr>
          </thead>
          <tbody className="pdf-report-body">
            <tr style={{ verticalAlign: "top" }}>
              <td style={{ width: "100%" }}>
                <div
                  style={{
                    margin: "20px 0px 20px 20px",
                    padding: "12px 10px",
                    border: "2px solid #ededed",
                    borderRadius: 12,
                  }}
                >
                  {report?.photo && (
                    <>
                      <label className="pdf-label">Face Match</label>
                      <span
                        className={`custom-badge ${
                          report?.faceMatch ? "badge-success" : "badge-error"
                        }`}
                      >
                        {report?.faceMatch ? "Match" : "Not Match"}
                      </span>
                      <div className="line-border" />
                    </>
                  )}
                  {report?.subResult && (
                    <>
                      <label className="pdf-label">Sub Results</label>
                      <span
                        className={`custom-badge ${
                          report?.subResult == "Rejected"
                            ? "badge-error"
                            : report?.subResult == "Suspected"
                            ? "badge-outline"
                            : report?.subResult == "Caution"
                            ? "badge-warning"
                            : "badge-success"
                        }`}
                      >
                        {report?.subResult}
                      </span>
                      <div className="line-border" />
                    </>
                  )}
                  {report?.wcReportStatus && (
                    <>
                      <label className="pdf-label">World Check Report</label>
                      <span className={`custom-badge uppercase`}>
                        {report?.wcReportStatus}
                      </span>
                      <div className="line-border" />
                    </>
                  )}
                  <label className="pdf-label">Issuing Country</label>
                  <span
                    className={`custom-badge ${
                      report?.flags.includes("issuingCountry")
                        ? "badge-error"
                        : ""
                    }`}
                  >
                    {report?.flags.includes("issuingCountry")
                      ? "Not readable"
                      : report?.issuingCountry ?? "N/A"}
                  </span>
                  <div className="line-border" />
                  <label className="pdf-label">Region</label>
                  <span
                    className={`custom-badge ${
                      report?.flags.includes("region") ? "badge-error" : ""
                    }`}
                  >
                    {report?.flags.includes("region")
                      ? "Not readable"
                      : report?.region ?? "N/A"}
                  </span>
                  <div className="line-border" />
                  <label className="pdf-label">Type of Document</label>
                  <span
                    className={`custom-badge ${
                      report?.flags.includes("documentType")
                        ? "badge-error"
                        : ""
                    }`}
                  >
                    {report?.flags.includes("documentType")
                      ? "Not readable"
                      : report?.documentType ?? "N/A"}
                  </span>
                  <div className="line-border" />
                  <label className="pdf-label">First Name</label>
                  <span
                    className={`custom-badge ${
                      report?.flags.includes("firstName") ? "badge-error" : ""
                    }`}
                  >
                    {report?.flags.includes("firstName")
                      ? "Not readable"
                      : report?.firstName ?? "N/A"}
                  </span>
                  <div className="line-border" />
                  <label className="pdf-label">Last Name</label>
                  <span
                    className={`custom-badge ${
                      report?.flags.includes("lastName") ? "badge-error" : ""
                    }`}
                  >
                    {report?.flags.includes("lastName")
                      ? "Not readable"
                      : report?.lastName ?? "N/A"}
                  </span>
                  <div className="line-border" />
                  <label className="pdf-label">Date of Birth</label>
                  <span
                    className={`custom-badge ${
                      report?.flags.includes("dateOfBirth") ? "badge-error" : ""
                    }`}
                  >
                    {report?.flags.includes("dateOfBirth")
                      ? "Not readable"
                      : report?.dateOfBirth
                      ? dayjs(report?.dateOfBirth).format("MMM DD, YYYY")
                      : "N/A"}
                  </span>
                  <div className="line-border" />
                  <label className="pdf-label">Document Number</label>
                  <span
                    className={`custom-badge ${
                      report?.flags.includes("documentNo") ? "badge-error" : ""
                    }`}
                  >
                    {report?.flags.includes("documentNo")
                      ? "Not readable"
                      : report?.documentNo ?? "N/A"}
                  </span>
                  <div className="line-border" />
                  <label className="pdf-label">Personal Number</label>
                  <span
                    className={`custom-badge ${
                      report?.flags.includes("personalNo") ? "badge-error" : ""
                    }`}
                  >
                    {report?.flags.includes("personalNo")
                      ? "Not readable"
                      : report?.personalNo ?? "N/A"}
                  </span>
                  <div className="line-border" />
                  <label className="pdf-label">Expiry Date</label>
                  <span
                    className={`custom-badge ${
                      report?.flags.includes("dateOfExpiry")
                        ? "badge-error"
                        : ""
                    }`}
                  >
                    {report?.flags.includes("dateOfExpiry")
                      ? "Not readable"
                      : report?.dateOfExpiry
                      ? dayjs(report?.dateOfExpiry).format("MMM DD, YYYY")
                      : "N/A"}
                  </span>
                  {/* <div className="line-border" />
                  <label className="pdf-label">Face Recognition Time</label>
                  <span className="custom-badge">
                    {report?.faceMatchTime
                      ? formatTime(report?.faceMatchTime)
                      : "N/A"}
                  </span>
                  <div className="line-border" />
                  <label className="pdf-label">Text Extraction Time</label>
                  <span className="custom-badge">
                    {report?.extractionTime
                      ? formatTime(report?.extractionTime)
                      : "N/A"}
                  </span> */}
                  {report?.iqFail && (
                    <div>
                      <div className="line-border" />
                      <label className="pdf-label">IQ Fail</label>
                      <span className="custom-badge">{report?.iqFail}</span>
                    </div>
                  )}
                </div>
              </td>
              <td style={{ width: "100%" }}>
                <div style={{ margin: "20px 20px 45px 20px" }}>
                  {report?.photo && (
                    <>
                      <label htmlFor="" className="doc-label">
                        Live Photo
                      </label>
                      <img className="live-photo" src={report?.photo} alt="" />
                    </>
                  )}

                  <label htmlFor="" className="doc-label">
                    Document Front
                  </label>
                  <img className="doc-image" src={report?.docFront} alt="" />

                  <label htmlFor="" className="doc-label">
                    Document Back
                  </label>
                  <img className="doc-image" src={report?.docBack} alt="" />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="d-none" id="wcReport">
        <div className="report-header">
          <img src={LogoLight} alt="Logo" />
          <h6>World Check Report</h6>
          <span className="track-id-badge mx-auto">
            <i className="ri-global-line"></i>
            {id}
          </span>
        </div>
        <div className="aml-report w-75 pb-5 pdf-mode">
          <h5>AML Search Report</h5>
          <ul>
            <li>
              <div className="aml-report-item">
                <label htmlFor="">Name</label>
                <div className="d-flex gap-2">
                  <span className="custom-badge">
                    {wcReport?.Applicant_Name}
                  </span>
                  <div className="overflow-badge">
                    <span className="custom-badge badge-warning">PEP</span>
                    <span className="custom-badge badge-error">Sanction</span>
                  </div>
                </div>
              </div>
            </li>
            <li>
              <div className="aml-report-item">
                <label htmlFor="">Alias</label>
                <span className={`custom-badge`}>
                  {wcReport?.PEP_Result[0]?.alias_names.join(" ") ?? "N/A"}
                </span>
              </div>
            </li>
            <li>
              <div className="aml-report-item">
                <label htmlFor="">Address:</label>
                <span className={`custom-badge`}>
                  {wcReport?.PEP_Result[0]?.address.join(" ") ?? "N/A"}
                </span>
              </div>
            </li>
            <li>
              <div className="aml-report-item">
                <label htmlFor="">Gender:</label>
                <span className={`custom-badge`}>
                  {wcReport?.PEP_Result[0]?.gender ?? "N/A"}
                </span>
              </div>
            </li>
            <li>
              <div className="aml-report-item">
                <label htmlFor="">National ID:</label>
                <span className={`custom-badge`}>
                  {report?.documentNo ?? "N/A"}
                </span>
              </div>
            </li>
            <li>
              <div className="aml-report-item">
                <label htmlFor="">Country:</label>
                <span className={`custom-badge`}>
                  {wcReport?.PEP_Result[0]?.country.join(" ") ?? "N/A"}
                </span>
              </div>
            </li>
            <li>
              <div className="aml-report-item">
                <label htmlFor="">Date of Birth</label>
                <span className={`custom-badge`}>
                  {wcReport?.PEP_Result[0]?.date_of_birth ?? "N/A"}
                </span>
              </div>
            </li>
            <li>
              <div className="aml-report-item">
                <label htmlFor="">Passport No</label>
                <span className={`custom-badge`}>
                  {wcReport?.PEP_Result[0]?.passport_number !== ""
                    ? wcReport?.PEP_Result[0]?.passport_number
                    : "N/A"}
                </span>
              </div>
            </li>
            <li>
              <div className="aml-report-item">
                <label htmlFor="">Nationality</label>
                <span className={`custom-badge`}>
                  {wcReport?.PEP_Result[0]?.nationality > 0
                    ? wcReport?.PEP_Result[0]?.nationality.join(" ")
                    : "N/A"}
                </span>
              </div>
            </li>
            <li>
              <div className="aml-report-item">
                <label htmlFor="">TIN / PAN</label>
                <span className={`custom-badge`}>
                  {wcReport?.PEP_Result[0]?.pan ?? "N/A"}
                </span>
              </div>
            </li>
            <li>
              <div className="aml-report-item">
                <label htmlFor="">Search ID:</label>
                <span className={`custom-badge`}>
                  {wcReport?.Search_ID ?? "N/A"}
                </span>
              </div>
            </li>
          </ul>
        </div>
        <div className="wc-report pdf-mode mt-5 pt-5">
          <div className="px-4 py-3">
            <div className="d-flex justify-content-between align-items-center">
              <span className="title-badge">Sanctions Information</span>
            </div>
            <div className="wc-report-box">
              <table className="listing-table">
                <tbody>
                  <tr>
                    <td>Sanctions Type:</td>
                    <td>N/A</td>
                  </tr>
                  <tr>
                    <td>List Name:</td>
                    <td>N/A</td>
                  </tr>
                  <tr>
                    <td>Country:</td>
                    <td>N/A</td>
                  </tr>
                  <tr>
                    <td>Source URL:</td>
                    <td>{checkLink("")}</td>
                  </tr>
                  <tr>
                    <td>Description:</td>
                    <td>N/A</td>
                  </tr>
                  <tr>
                    <td>Banned Subjects:</td>
                    <td>N/A</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <Each
              array={wcReport?.PEP_Result}
              render={(pep, index) => {
                return (
                  <div>
                    <div className="text-center">
                      <span className="title-badge">
                        Politically Exposed Person
                      </span>
                    </div>
                    <div
                      key={index}
                      className={
                        wcReport?.Final_Result?.["results"]["pep_result"].find(
                          (a) => a.id == pep.id
                        )?.status
                          ? ""
                          : "hidden"
                      }
                    >
                      <div className="wc-report-box">
                        <div className="d-flex justify-content-between align-items-center">
                          <h4 className="report-sub-title mb-4">
                            Personal Information #{index + 1}
                          </h4>
                        </div>
                        <table className="listing-table">
                          <tbody>
                            <tr>
                              <td>Full Name:</td>
                              <td>{checkEmpty(pep?.name)}</td>
                            </tr>
                            <tr>
                              <td>Alias:</td>
                              <td>{arrayToStr(pep?.alias_names)}</td>
                            </tr>
                            <tr>
                              <td>Address:</td>
                              <td>{arrayToStr(pep?.address)}</td>
                            </tr>
                            <tr>
                              <td>PEP Type:</td>
                              <td>{checkEmpty(pep?.pep_type)}</td>
                            </tr>
                            <tr>
                              <td>Associate:</td>
                              <td>{arrayToStr(pep?.citizenship)}</td>
                            </tr>
                            <tr>
                              <td>Gender:</td>
                              <td>{checkEmpty(pep?.gender)}</td>
                            </tr>
                            <tr>
                              <td>Place Of Birth:</td>
                              <td>{arrayToStr(pep?.place_of_birth)}</td>
                            </tr>
                            <tr>
                              <td>Nationality:</td>
                              <td>{arrayToStr(pep?.nationality)}</td>
                            </tr>
                            <tr>
                              <td>Passport No:</td>
                              <td>{checkEmpty(pep?.passport_number)}</td>
                            </tr>
                            <tr>
                              <td>DOB:</td>
                              <td>{checkEmpty(pep?.date_of_birth)}</td>
                            </tr>
                            <tr>
                              <td>Organisation:</td>
                              <td>{checkEmpty(pep?.organisation)}</td>
                            </tr>
                            <tr>
                              <td>SSN No:</td>
                              <td>{checkEmpty(pep?.ssn)}</td>
                            </tr>
                            <tr>
                              <td>IDs Matched:</td>
                              <td>{arrayToStr(pep?.sams_score?.matched_id)}</td>
                            </tr>
                            <tr>
                              <td>Country:</td>
                              <td>{arrayToStr(pep?.country)}</td>
                            </tr>
                            <tr>
                              <td>Citizenship:</td>
                              <td>{arrayToStr(pep?.citizenship)}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      <div className="wc-report-box top-space bottom-space my-3">
                        <h4 className="report-sub-title mb-3">Role Info</h4>
                        <table className="primary-table">
                          <thead>
                            <tr>
                              <th>Designation</th>
                              <th>PEP Type</th>
                              <th>Start Date</th>
                              <th>End Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {pep?.designation.length > 0 &&
                              pep.designation.map((des, i) => {
                                return (
                                  <tr key={i}>
                                    <td>{des?.designation}</td>
                                    <td>
                                      {checkEmpty(des?.designation_pep_type)}
                                    </td>
                                    <td>
                                      {checkEmpty(des?.designation_start_date)}
                                    </td>
                                    <td>
                                      {checkEmpty(des?.designation_end_date)}
                                    </td>
                                  </tr>
                                );
                              })}
                          </tbody>
                        </table>

                        <table className="primary-table mt-4">
                          <thead>
                            <tr>
                              <th>Associated family Members</th>
                              <th>Relationship</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.keys(pep["family-tree"]).length > 0 &&
                              Object.keys(pep["family-tree"]).map((ft, i) => {
                                return (
                                  <tr key={i}>
                                    <td>{pep["family-tree"][ft]}</td>
                                    <td className="text-capitalize">{ft}</td>
                                  </tr>
                                );
                              })}
                          </tbody>
                        </table>
                      </div>
                      <div className="wc-report-box top-space">
                        <table className="listing-table">
                          <tbody>
                            <tr>
                              <td>PEP List:</td>
                              <td>{checkEmpty(pep?.source_name)}</td>
                            </tr>
                            <tr>
                              <td>Link:</td>
                              <td>
                                {pep?.source_link ? (
                                  <a href={pep?.source_link} target="_blank">
                                    {pep?.source_link}
                                  </a>
                                ) : (
                                  "N/A"
                                )}
                              </td>
                            </tr>
                            <tr>
                              <td>Other Links:</td>
                              <td>
                                {pep?.other_urls ? (
                                  <a href={pep?.other_urls} target="_blank">
                                    {pep?.other_urls}
                                  </a>
                                ) : (
                                  "N/A"
                                )}
                              </td>
                            </tr>
                            <tr>
                              <td>Description:</td>
                              <td>{checkEmpty(pep?.source_description)}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                );
              }}
            />
          </div>
          <div className="line-box-content">
            <h3>AMS Matched</h3>
            <p>
              {wcReport?.Final_Result?.["results"]["ams_result"]?.length}{" "}
              Results Matched
            </p>
          </div>
          <div className="px-4 py-4">
            {wcReport?.AMS_Result?.length > 0 &&
              wcReport?.AMS_Result.map((ams, index) => {
                return (
                  <div
                    key={index}
                    className={
                      wcReport?.Final_Result?.["results"]["ams_result"].find(
                        (a) => a.id == ams.id
                      )?.status
                        ? ""
                        : "hidden"
                    }
                  >
                    <div className="wc-report-box bordered-box w-75 mx-auto px-5 mb-4">
                      <table className="listing-table">
                        <tbody>
                          <tr>
                            <td>Name:</td>
                            <td>{checkEmpty(ams?.name)}</td>
                          </tr>
                          <tr>
                            <td>Heading:</td>
                            <td>{checkEmpty(ams?.heading)}</td>
                          </tr>
                          <tr>
                            <td>Source:</td>
                            <td>{checkLink(ams?.source)}</td>
                          </tr>
                        </tbody>
                      </table>
                      <div className="child-box mx-5 mt-2">
                        <table className="listing-table">
                          <tbody>
                            <tr>
                              <td>URL:</td>
                              <td>{checkLink(ams?.url)}</td>
                            </tr>
                            <tr>
                              <td>Description:</td>
                              <td>{checkEmpty(ams?.summary)}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}
