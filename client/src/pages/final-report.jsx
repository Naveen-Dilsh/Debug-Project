import { useState, useEffect, useRef } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Modal, Select, Spin } from "antd";
import html2pdf from "html2pdf.js";

import TimerZ from "../components/TimerZ";

import {
  Each,
  fetchApi,
  arrayToStr,
  checkEmpty,
  checkDate,
  checkLink,
  sendNotify,
} from "../helper";

import Logo from "../assets/img/logo-light.svg";
import PowerIcon from "../assets/img/power-icon.png";

export default function FinalReport(props) {
  let { id } = useParams();

  const navigate = useNavigate();

  const [task, setTask] = useState(null);
  const [wcReport, setWcReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [wcStatus, setWcStatus] = useState(null);
  const [wcStatusErr, setWcStatusErr] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [timeSpent, setTimeSpent] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  let { userDetails } = useSelector((state) => state.auth);

  useEffect(() => {
    if (id) {
      getWcReport();
    }
  }, [id]);

  function getWcReport() {
    setLoading(true);
    let payload = {
      method: "GET",
      url: `/wc-report/${id}`,
    };
    fetchApi(payload)
      .then((res) => {
        let data = res?.data;
        setLoading(false);
        setTask(data["task"]);
        setWcReport(data["wcReport"]);
        setWcStatus(data?.task?.wcReportStatus);

        let time = localStorage.getItem("time-token");
        if (time) {
          updateTasks({ timeSpent: JSON.parse(time) }, { showNotify: false });
        }
      })
      .catch((err) => console.log(err));
  }

  async function updateTasks(data, options) {
    if (task?.status == "I") {
      let response = fetchApi(
        {
          method: "PUT",
          url: `/task/${id}`,
          data,
        },
        { showNotify: options?.showNotify ?? true }
      )
        .then((res) => {
          return res;
        })
        .catch((err) => console.log(err));

      return response;
    }
  }

  const backToList = () => {
    navigate(-1);
  };

  function getTime(value) {
    localStorage.setItem("time-token", JSON.stringify(value));
    setTimeSpent(value);
  }

  function goBack() {
    updateTasks({ timeSpent }, { showNotify: false });
    backToList();
  }

  const hasExecuted = useRef(false);

  window.onbeforeunload = function (event) {
    updateTasks({ timeSpent }, { showNotify: false });
  };

  // function handleBack() {
  //   if (!hasExecuted.current && task?.status == "I") {
  //     let time = localStorage.getItem("time-token");
  //     if (time) {
  //       updateTasks({ timeSpent: JSON.parse(time) }, { sendNotify: false });
  //     }
  //     hasExecuted.current = true;
  //     // localStorage.removeItem("time-token");
  //     window.removeEventListener("popstate", handleBack);
  //   }
  // }

  // window.addEventListener("popstate", handleBack);

  const getWcStatus = (value) => {
    if (value) {
      setWcStatusErr(false);
    } else {
      setWcStatusErr(true);
    }
    setWcStatus(value);
  };

  const downloadReport = () => {
    var pdfEle = document.createElement("div");
    const reportDev = document.getElementById("finalReport");

    const report = reportDev.cloneNode(true);
    report.classList.remove("d-none");
    pdfEle.appendChild(report);

    let opt = {
      margin: [15, 0, 15, 0],
      filename: `World Check Report - ${id}.pdf`,
      jsPDF: { unit: "pt", format: "a4", orientation: "p" },
      pagebreak: { mode: "avoid-all" },
    };

    html2pdf()
      .from(pdfEle)
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
  };

  function onSubmit() {
    if (wcStatus) {
      setSubmitting(true);
      let data = {
        wcReportStatus: wcStatus,
        timeSpent,
      };
      updateTasks(data)
        .then((res) => {
          setSubmitting(false);
          navigate(
            `/app/${
              userDetails?.role == "admin" ? "admin-tasks" : "analyst-tasks"
            }`
          );
        })
        .catch((err) => console.log(err));
    } else {
      setWcStatusErr(true);
      sendNotify("error", "World check report required");
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1
          className="d-flex align-items-center gap-2 cursor-pointer"
          onClick={goBack}
        >
          <i className="ri-arrow-left-line"></i> Job ID: {id}
        </h1>
        <TimerZ
          start={!loading && task?.status == "I"}
          defaultTime={
            userDetails?.role == "admin"
              ? task?.adminTimeSpent
              : task?.analystTimeSpent
          }
          getTime={getTime}
        />
      </div>
      <Spin spinning={loading}>
        <div className="page-content">
          <div className="text-center mb-4">
            <h6 className="report-title">World Check Report</h6>
            <span className="track-id-badge mx-auto">
              <i className="ri-global-line"></i>
              {id}
            </span>
          </div>
          <div className="row">
            <div className="col-md-4">
              <table className="primary-table wc-table">
                <thead>
                  <tr>
                    <th>Document Summary</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {task?.photo && (
                    <tr>
                      <td>Facial Biometrics</td>
                      <td>
                        <span
                          className={`custom-badge ${
                            task?.faceMatch ? "badge-success" : "badge-error"
                          }`}
                        >
                          {task?.faceMatch ? "" : "Not "}Matched
                        </span>
                      </td>
                    </tr>
                  )}
                  <tr>
                    <td>Sub Results</td>
                    <td>
                      <span
                        className={`custom-badge ${
                          task?.subResult == "Rejected"
                            ? "badge-error"
                            : task?.subResult == "Suspected"
                            ? "badge-outline"
                            : task?.subResult == "Caution"
                            ? "badge-warning"
                            : "badge-success"
                        }`}
                      >
                        {task?.subResult}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td>World Check Report</td>
                    <td>
                      <Select
                        value={wcStatus}
                        className={`custom-select p-small ${
                          wcStatusErr ? "select-error" : ""
                        }`}
                        onChange={getWcStatus}
                        placeholder={"Select"}
                        style={{ width: 100 }}
                        options={[
                          {
                            value: "hit",
                            label: "Hit",
                          },
                          {
                            value: "not-hit",
                            label: "Not Hit",
                          },
                        ]}
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="col-md-4">
              <table className="primary-table wc-table">
                <thead>
                  <tr>
                    <th>Document Information</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Document Type</td>
                    <td>{checkEmpty(task?.documentType)}</td>
                  </tr>
                  <tr>
                    <td>Issuing Country</td>
                    <td>{checkEmpty(task?.issuingCountry)}</td>
                  </tr>
                  <tr>
                    <td>State/Region</td>
                    <td>{checkEmpty(task?.region)}</td>
                  </tr>
                  <tr>
                    <td>Date of Issue</td>
                    <td>{checkDate(task?.dateOfIssue, "DD.MM.YYYY")}</td>
                  </tr>
                  <tr>
                    <td>Date of Expiry</td>
                    <td>{checkDate(task?.dateOfExpiry, "DD.MM.YYYY")}</td>
                  </tr>
                  <tr>
                    <td>Document No.</td>
                    <td>{checkEmpty(task?.documentNo)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="col-md-4">
              <table className="primary-table wc-table">
                <thead>
                  <tr>
                    <th>Customer Information</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>First Name</td>
                    <td>{checkEmpty(task?.firstName)}</td>
                  </tr>
                  <tr>
                    <td>Last Name</td>
                    <td>{checkEmpty(task?.lastName)}</td>
                  </tr>
                  <tr>
                    <td>DOB</td>
                    <td>{checkDate(task?.dateOfBirth, "DD.MM.YYYY")}</td>
                  </tr>
                  <tr>
                    <td>Gender</td>
                    <td>{checkEmpty(task?.gender)}</td>
                  </tr>
                  <tr>
                    <td>Nationality</td>
                    <td>{checkEmpty(task?.nationality)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div className="d-flex justify-content-center align-items-center gap-4 mt-5 mb-4">
            <button className="primary-btn" onClick={() => setShowReport(true)}>
              View Analyze Report
            </button>
            <button className="cancel-btn" onClick={downloadReport}>
              Download
            </button>
            <button
              className="submit-btn"
              disabled={submitting}
              onClick={onSubmit}
            >
              {submitting && <i className="ri-loader-4-line icon-spin-ani"></i>}
              Submit
            </button>
          </div>
        </div>
      </Spin>
      <Modal
        open={showReport}
        title={"Analyze Report"}
        className="custom-modal"
        width={900}
        onOk={() => setShowReport(false)}
        onCancel={() => setShowReport(false)}
      >
        <div className="report-header">
          <img src={Logo} alt="Logo" />
          <h6>World Check Report</h6>
          <span className="track-id-badge mx-auto">
            <i className="ri-global-line"></i>
            {id}
          </span>
        </div>
        <div className="aml-report w-75 pdf-mode">
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
                  {task?.documentNo ?? "N/A"}
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
        <div className="wc-report pdf-mode mt-2">
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
                        wcReport?.Final_Result?.results?.pep_result?.find(
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
                            {pep["family-tree"] &&
                              Object.keys(pep["family-tree"]).length > 0 &&
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
          <div className="line-box-content mt-0">
            <h3>AMS Matched</h3>
            <p>
              {wcReport?.Final_Result?.results?.ams_result?.length} Results
              Matched
            </p>
          </div>
          <div className="px-4 py-4">
            <Each
              array={wcReport?.AMS_Result}
              render={(ams, index) => {
                return (
                  <div
                    key={index}
                    className={
                      wcReport?.Final_Result?.results?.ams_result.find(
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
              }}
            />
          </div>
        </div>
      </Modal>
      <div className="d-none" id="finalReport">
        <div className="report-header">
          <img src={Logo} alt="Logo" />
          <h6>World Check Report</h6>
          <span className="track-id-badge mx-auto">
            <i className="ri-global-line"></i>
            {id}
          </span>
        </div>
        <div className="aml-report w-75 pdf-mode">
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
                  {task?.documentNo ?? "N/A"}
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
        <div className="wc-report pdf-mode mt-2">
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
                        wcReport?.Final_Result?.results?.pep_result?.find(
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
                            {pep["family-tree"] &&
                              Object.keys(pep["family-tree"]).length > 0 &&
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
          <div className="line-box-content mt-0">
            <h3>AMS Matched</h3>
            <p>
              {wcReport?.Final_Result?.results?.ams_result?.length} Results
              Matched
            </p>
          </div>
          <div className="px-4 py-4">
            <Each
              array={wcReport?.AMS_Result}
              render={(ams, index) => {
                return (
                  <div
                    key={index}
                    className={
                      wcReport?.Final_Result?.results?.ams_result?.find(
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
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
