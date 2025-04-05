import { useState, useEffect, useRef } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { Modal, Spin, Skeleton, Switch } from "antd";
import html2pdf from "html2pdf.js";

import {
  fetchApi,
  removeEmpty,
  arrayToStr,
  checkEmpty,
  checkLink,
  Each,
} from "../helper";

import LoaderZ from "../components/LoaderZ";
import ModalZ from "../components/ModalZ";
import TimerZ from "../components/TimerZ";

import NoImage from "../assets/img/no-image.png";
import Logo from "../assets/img/logo-light.svg";
import PowerIcon from "../assets/img/power-icon.png";

const { confirm } = Modal;

export default function WorldCheck() {
  let { id } = useParams();

  const dispatch = useDispatch();

  const navigate = useNavigate();

  let { userDetails } = useSelector((state) => state.auth);

  const [task, setTask] = useState(null);
  const [wcReport, setWcReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [assigned, setAssigned] = useState(false);
  const [timeSpent, setTimeSpent] = useState(null);
  const [confirmReq, setConfirmReq] = useState(false);
  const [payload, setPayload] = useState({
    remarks: "",
    status: "accepted",
    results: {
      ams_result: [],
      pep_result: [],
      sanction_result: [],
      sanctioncountry_result: [],
      legal_result: [],
    },
  });
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    if (id) {
      getTask();
    } else {
      setTask(null);
    }
  }, [id]);

  // useEffect(() => {
  //   socket.on(`task-${id}`, (task) => {
  //     if (task?.update) {
  //       getTask();
  //     }
  //   });
  //   return () => {
  //     socket.off(`task-${id}`);
  //   };
  // }, []);

  useEffect(() => {
    let time =
      userDetails?.role == "admin"
        ? task?.adminTimeSpent
        : task?.analystTimeSpent;
    setTimeSpent(time);
  }, [task]);

  function getTask() {
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

        let result = data?.wcReport?.Final_Result ?? {
          remarks: "",
          status: "accepted",
          results: {
            ams_result: [],
            pep_result: [],
            sanction_result: [],
            sanctioncountry_result: [],
            legal_result: [],
          },
        };
        setPayload(result);

        let role = userDetails?.role;
        if (data[role]) {
          if (data[role] != userDetails?.id) {
            setAssigned(true);
          }
        } else {
          updateTasks({ [role]: userDetails?.id }, { status: data?.status });
        }
      })
      .catch((err) => console.log(err));
  }

  function updateTasks(data, options) {
    if (task?.status == "I" || options?.status == "I") {
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

  function changeAnalyst() {
    updateTasks({ sendToAnalyst: true, timeSpent });
    backToList();
  }

  function changeClient() {
    updateTasks({ sendToClient: true, timeSpent });
    backToList();
  }

  function submit() {
    let obj = { ...payload };
    let data = removeEmpty(obj);
    updateTasks({ changes: true, ...data, timeSpent }).then((res) => {
      if (res?.status == 200) {
        backToList();
      }
    });
  }

  function reqApproval() {
    let obj = { ...payload };
    let data = removeEmpty(obj);
    updateTasks({ sendToAdmin: true, changes: true, ...data, timeSpent });
    backToList();
  }

  function approved() {
    confirm({
      title: <h5>Approve Document</h5>,
      icon: (
        <div className="modal-icon">
          <i className="ri-checkbox-circle-fill color-green"></i>
        </div>
      ),
      content: (
        <p>
          Are you sure you want to request a resubmission for this document?
        </p>
      ),
      open: false,
      className: "custom-confirm",
      centered: true,
      closable: true,
      okText: "Okay",
      onOk() {
        changeClient();
      },
      onCancel() {
        console.log("Cancel");
      },
    });
  }

  function reject() {
    confirm({
      title: <h5>Reject Document</h5>,
      icon: (
        <div className="modal-icon">
          <i className="ri-close-circle-fill color-red"></i>
        </div>
      ),
      content: <p>Are you sure you want to assign this back to the analyst?</p>,
      open: false,
      className: "custom-confirm",
      centered: true,
      closable: true,
      okText: "Okay",
      okButtonProps: { className: "btn-red" },
      onOk() {
        changeAnalyst();
      },
      onCancel() {
        console.log("Cancel");
      },
    });
  }

  const backToList = () => {
    // `/app/${userDetails?.role == "admin" ? "admin-tasks" : "analyst-tasks"}`;
    navigate(-1);
  };

  function getTime(value) {
    localStorage.setItem("time-token", JSON.stringify(value));
    setTimeSpent(value);
  }

  const hasExecuted = useRef(false);

  window.onbeforeunload = function (event) {
    updateTasks({ timeSpent }, { showNotify: false });
  };

  function goBack() {
    updateTasks({ timeSpent }, { showNotify: false });
    backToList();
  }

  // function handleBack() {
  //   if (!hasExecuted.current && task?.status == "I") {
  //     let time = localStorage.getItem("time-token");
  //     console.log(JSON.parse(time), "time at wc");
  //     updateTasks({ timeSpent: JSON.parse(time) });
  //     // console.log("back called!");
  //     hasExecuted.current = true;
  //     // localStorage.removeItem("time-token");
  //     window.removeEventListener("popstate", handleBack);
  //   }
  // }

  // window.addEventListener("popstate", handleBack);

  const reportAction = (action, id, key) => {
    let obj = { ...payload };
    let result = obj["results"];
    let arr = result[key];

    let item = arr.find((a) => a.id == id);
    if (item) {
      if (action?.Remark) {
        item["Remark"] = action?.Remark;
      } else {
        item["status"] = action?.status;
      }
    } else {
      let value = {
        id,
      };
      if (action?.Remark) {
        value["Remark"] = action?.Remark;
      } else {
        value["status"] = action?.status;
      }
      arr.push(value);
    }

    result[key] = arr;
    obj["results"] = result;

    console.log(obj);
    setPayload(obj);
  };

  const downloadReport = () => {
    var pdfEle = document.createElement("div");
    const reportHeader = document.getElementById("reportHeader");
    const amlReport = document.getElementById("amlReport");
    const wcReport = document.getElementById("wcReport");

    const reportHead = reportHeader.cloneNode(true);
    reportHead.classList.remove("d-none");

    const report1 = amlReport.cloneNode(true);
    report1.classList.add("pdf-mode");

    const report2 = wcReport.cloneNode(true);
    report2.classList.add("pdf-mode");

    pdfEle.appendChild(reportHead);
    pdfEle.appendChild(report1);
    pdfEle.appendChild(report2);

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
        reportHeader.classList.add("d-none");
      })
      .catch((err) => {
        console.log(err);
      })
      .save();
  };

  const getReview = (review) => {
    let obj = { ...payload };
    obj["remarks"] = review;
    setPayload(obj);
  };

  const submitReport = () => {
    setSubmitLoading(true);
    fetchApi(
      {
        method: "PUT",
        url: `/wc-report/${wcReport?.Search_ID}`,
        data: payload,
      },
      { showNotify: true }
    )
      .then((res) => {
        // console.log(res);
        setSubmitLoading(false);
        updateTasks({ timeSpent });
        if (!res?.error) {
          navigate(`/app/fraud-assessment/${id}`);
        }
      })
      .catch((err) => console.log(err));
  };

  return (
    <div>
      <div className="page-header">
        <h1
          className="d-flex align-items-center gap-2 cursor-pointer"
          onClick={goBack}
        >
          <i className="ri-arrow-left-line"></i> Job ID: {id}
        </h1>
        <div className="d-flex gap-4 align-items-center">
          <button className="primary-btn" onClick={downloadReport}>
            Download Report
          </button>

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
      </div>
      {assigned ? (
        <ModalZ
          show={true}
          title={
            <>
              <i className="ri-information-line icon-yellow"></i> Access denied
            </>
          }
          onOk={backToList}
          onCancel={backToList}
          okBtnText="Go back"
        >
          <p>
            {userDetails?.role == "admin"
              ? "This task currently at the analyst stage."
              : "This task already taken, Contact admin for reassign to you."}
          </p>
        </ModalZ>
      ) : (
        <Spin spinning={loading}>
          <div className="page-content">
            <div className="row">
              <div className="col-md-2">
                <div className="document-img">
                  {task?.photo && (
                    <>
                      <label className="doc-label">Live Photo</label>
                      <div className="w-100">
                        {loading ? (
                          <Skeleton.Image
                            active
                            className="custom-image-loader h-400 mt-2 mb-3"
                          />
                        ) : (
                          <img
                            src={task?.photo ?? NoImage}
                            alt=""
                            className="w-100 mt-2 mb-3"
                          />
                        )}
                      </div>
                    </>
                  )}

                  <div className="doc-label">Document Front</div>
                  <div className="w-100">
                    {loading ? (
                      <Skeleton.Image
                        active
                        className="custom-image-loader mt-2 mb-3"
                      />
                    ) : (
                      <img
                        src={task?.docFront ?? NoImage}
                        alt=""
                        className="w-100 mt-2 mb-3"
                      />
                    )}
                  </div>
                  <div className="doc-label">Document Back</div>
                  <div className="w-100">
                    {loading ? (
                      <Skeleton.Image
                        active
                        className="custom-image-loader mt-2 mb-3"
                      />
                    ) : (
                      <img
                        src={task?.docBack ?? NoImage}
                        alt=""
                        className="w-100 mt-2 mb-3"
                      />
                    )}
                  </div>
                </div>
              </div>
              <div className="col-md-7">
                <div className="aml-report w-75" id="amlReport">
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
                            <span className="custom-badge badge-warning">
                              PEP
                            </span>
                            <span className="custom-badge badge-error">
                              Sanction
                            </span>
                          </div>
                        </div>
                      </div>
                    </li>
                    <li>
                      <div className="aml-report-item">
                        <label htmlFor="">Alias</label>
                        <span className={`custom-badge`}>
                          {wcReport?.PEP_Result?.[0]?.alias_names.join(", ") ??
                            "N/A"}
                        </span>
                      </div>
                    </li>
                    <li>
                      <div className="aml-report-item">
                        <label htmlFor="">Address:</label>
                        <span className={`custom-badge`}>
                          {wcReport?.PEP_Result?.[0]?.address.join(" ") ??
                            "N/A"}
                        </span>
                      </div>
                    </li>
                    <li>
                      <div className="aml-report-item">
                        <label htmlFor="">Gender:</label>
                        <span className={`custom-badge`}>
                          {checkEmpty(wcReport?.PEP_Result?.[0]?.gender)}
                        </span>
                      </div>
                    </li>
                    <li>
                      <div className="aml-report-item">
                        <label htmlFor="">National ID:</label>
                        <span className={`custom-badge`}>
                          {checkEmpty(task?.documentNo)}
                        </span>
                      </div>
                    </li>
                    <li>
                      <div className="aml-report-item">
                        <label htmlFor="">Country:</label>
                        <span className={`custom-badge`}>
                          {arrayToStr(wcReport?.PEP_Result?.[0]?.country)}
                        </span>
                      </div>
                    </li>
                    <li>
                      <div className="aml-report-item">
                        <label htmlFor="">Date of Birth</label>
                        <span className={`custom-badge`}>
                          {checkEmpty(wcReport?.PEP_Result?.[0]?.date_of_birth)}
                        </span>
                      </div>
                    </li>
                    <li>
                      <div className="aml-report-item">
                        <label htmlFor="">Passport No</label>
                        <span className={`custom-badge`}>
                          {checkEmpty(
                            wcReport?.PEP_Result?.[0]?.passport_number
                          )}
                        </span>
                      </div>
                    </li>
                    <li>
                      <div className="aml-report-item">
                        <label htmlFor="">Nationality</label>
                        <span className={`custom-badge`}>
                          {arrayToStr(wcReport?.PEP_Result[0]?.nationality)}
                        </span>
                      </div>
                    </li>
                    <li>
                      <div className="aml-report-item">
                        <label htmlFor="">TIN / PAN</label>
                        <span className={`custom-badge`}>
                          {checkEmpty(wcReport?.PEP_Result?.[0]?.pan)}
                        </span>
                      </div>
                    </li>
                    <li>
                      <div className="aml-report-item">
                        <label htmlFor="">Search ID:</label>
                        <span className={`custom-badge`}>
                          {checkEmpty(wcReport?.Search_ID)}
                        </span>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="col-md-3">
                <div className="text-end">
                  <h6 className="report-title">World Check Report</h6>
                  <span className="track-id-badge ms-auto">
                    <i className="ri-global-line"></i>
                    {task?.trackId}
                  </span>
                </div>
              </div>
              <div className="col-md-12 mt-4">
                <div className="wc-report" id="wcReport">
                  <div className="py-3">
                    <div className="px-4">
                      <div className="d-flex justify-content-between align-items-center py-2">
                        <span className="title-badge">
                          Sanctions Information
                        </span>
                        {wcReport?.Sanctions_Result?.length == 0 && (
                          <p className="mb-0">No Results</p>
                        )}
                      </div>
                      <Each
                        array={wcReport?.Sanctions_Result}
                        render={(san, index) => {
                          return (
                            <div
                              className={`wc-report-box ${
                                payload["results"]["sanction_result"].find(
                                  (a) => a.id == san.id
                                )?.status
                                  ? ""
                                  : "hidden"
                              }`}
                            >
                              <div className="d-flex justify-content-between align-items-center">
                                <h4 className="report-sub-title mb-4">
                                  Sanctions Information #{index + 1}
                                </h4>

                                <div className="match-switch">
                                  <div className="match-switch">
                                    <Switch
                                      checked={
                                        payload["results"][
                                          "sanction_result"
                                        ].find((a) => a.id == san.id)?.status
                                      }
                                      className="custom-switch active-green"
                                      onChange={(checked) =>
                                        reportAction(
                                          { status: checked },
                                          san.id,
                                          "sanction_result"
                                        )
                                      }
                                    />
                                    <label htmlFor="">Report match</label>
                                  </div>
                                </div>
                              </div>
                              <table className="listing-table">
                                <tbody>
                                  <tr>
                                    <td>Sanctions Type:</td>
                                    <td>{checkEmpty(san?.source_type)}</td>
                                  </tr>
                                  <tr>
                                    <td>List Name:</td>
                                    <td>{checkEmpty(san?.name)}</td>
                                  </tr>
                                  <tr>
                                    <td>Country:</td>
                                    <td>
                                      {arrayToStr(san?.sanctionedCountry)}
                                    </td>
                                  </tr>
                                  <tr>
                                    <td>Source URL:</td>
                                    <td>{checkLink(san?.source_link)}</td>
                                  </tr>
                                  <tr>
                                    <td>Description:</td>
                                    <td>
                                      {checkEmpty(san?.source_description)}
                                    </td>
                                  </tr>
                                  <tr>
                                    <td>Banned Subjects:</td>
                                    <td>{checkEmpty(san?.bannedSubjects)}</td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          );
                        }}
                      />
                    </div>
                    <div className="d-flex justify-content-between align-items-center pt-3 px-4 border-top">
                      <span className="title-badge">
                        Politically Exposed Person
                      </span>
                      {wcReport?.PEP_Result?.length == 0 && (
                        <p className="mb-0">No Results</p>
                      )}
                    </div>
                    <Each
                      array={wcReport?.PEP_Result}
                      render={(pep, index) => {
                        return (
                          <div>
                            <div
                              key={index}
                              className={`wc-report-box ${
                                payload["results"]["pep_result"].find(
                                  (a) => a.id == pep.id
                                )?.status
                                  ? ""
                                  : "hidden"
                              }`}
                            >
                              <div className="d-flex justify-content-between align-items-center">
                                <h4 className="report-sub-title mb-4">
                                  Personal Information #{index + 1}
                                </h4>

                                <div className="match-switch">
                                  <Switch
                                    className="custom-switch active-green"
                                    checked={
                                      payload["results"]["pep_result"].find(
                                        (a) => a.id == pep.id
                                      )?.status
                                    }
                                    onChange={(checked) =>
                                      reportAction(
                                        { status: checked },
                                        pep?.id,
                                        "pep_result"
                                      )
                                    }
                                  />
                                  <label htmlFor="">Report match</label>
                                </div>
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
                                    <td>
                                      {arrayToStr(pep?.sams_score?.matched_id)}
                                    </td>
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
                              <h4 className="report-sub-title mb-3">
                                Role Info
                              </h4>
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
                                            {checkEmpty(
                                              des?.designation_pep_type
                                            )}
                                          </td>
                                          <td>
                                            {checkEmpty(
                                              des?.designation_start_date
                                            )}
                                          </td>
                                          <td>
                                            {checkEmpty(
                                              des?.designation_end_date
                                            )}
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
                                    Object.keys(pep["family-tree"]).length >
                                      0 &&
                                    Object.keys(pep["family-tree"]).map(
                                      (ft, i) => {
                                        return (
                                          <tr key={i}>
                                            <td>{pep["family-tree"][ft]}</td>
                                            <td className="text-capitalize">
                                              {ft}
                                            </td>
                                          </tr>
                                        );
                                      }
                                    )}
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
                                        <a
                                          href={pep?.source_link}
                                          target="_blank"
                                        >
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
                                        <a
                                          href={pep?.other_urls}
                                          target="_blank"
                                        >
                                          {pep?.other_urls}
                                        </a>
                                      ) : (
                                        "N/A"
                                      )}
                                    </td>
                                  </tr>
                                  <tr>
                                    <td>Description:</td>
                                    <td>
                                      {checkEmpty(pep?.source_description)}
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                            <div className="comment-box w-50 mx-auto my-4">
                              <textarea
                                name=""
                                id=""
                                cols={2}
                                rows={4}
                                onChange={(e) =>
                                  reportAction(
                                    { Remark: e.target.value },
                                    pep?.id,
                                    "pep_result"
                                  )
                                }
                                placeholder="No comments added..."
                              ></textarea>
                            </div>
                          </div>
                        );
                      }}
                    />
                  </div>
                  <div
                    className={`line-box-content ${
                      wcReport?.PEP_Result?.length == 0 ? "" : "mt-0"
                    }`}
                  >
                    <h3>AMS Matched</h3>
                    <p className="ams-generated">
                      {wcReport?.AMS_Result?.length} Results Generated
                    </p>
                    <p className="ams-matched">
                      {payload["results"]["ams_result"]?.length} Results Matched
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
                              payload["results"]["ams_result"].find(
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
                              <div className="d-flex justify-content-between align-items-center mt-2">
                                <div className="comment-box size-sm w-75 mt-3">
                                  <textarea
                                    name=""
                                    id=""
                                    cols={2}
                                    rows={4}
                                    value={
                                      payload["results"]["ams_result"].find(
                                        (a) => a.id == ams.id
                                      )?.Remark
                                    }
                                    onChange={(e) =>
                                      reportAction(
                                        { Remark: e.target.value },
                                        ams?.id,
                                        "ams_result"
                                      )
                                    }
                                    placeholder="No comments added..."
                                  ></textarea>
                                </div>
                                <div className="match-switch">
                                  <Switch
                                    className="custom-switch active-green"
                                    checked={
                                      payload["results"]["ams_result"].find(
                                        (a) => a.id == ams.id
                                      )?.status
                                    }
                                    onChange={(checked) =>
                                      reportAction(
                                        { status: checked },
                                        ams?.id,
                                        "ams_result"
                                      )
                                    }
                                  />
                                  <label htmlFor="">Report match</label>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      }}
                    />
                    <div className="d-flex align-items-center gap-4 my-4 review-section">
                      <h4 className="report-sub-title">
                        Review&nbsp;Insights:
                      </h4>
                      <div className="comment-box">
                        <textarea
                          name=""
                          id=""
                          cols={2}
                          rows={4}
                          value={payload["remarks"]}
                          onChange={(e) => getReview(e.target.value)}
                          placeholder="Add your review comments here..."
                        ></textarea>
                      </div>
                    </div>
                    <div className="review-section d-flex justify-content-center align-items-center gap-5 my-4">
                      <button className="cancel-btn">Cancel</button>
                      <button
                        className="submit-btn"
                        onClick={submitReport}
                        disabled={submitLoading}
                      >
                        {submitLoading && (
                          <div className="icon-spin-ani">
                            <i className="ri-loader-4-line"></i>
                          </div>
                        )}
                        Submit
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Spin>
      )}
      <ModalZ
        show={confirmReq}
        title={
          <>
            <i className="ri-file-warning-fill color-gold"></i> Request for
            approval
          </>
        }
        onOk={reqApproval}
        okBtnProps={{ text: "Yes" }}
        onCancel={() => setConfirmReq(false)}
      >
        <p>Are you sure you want to escalate this task to an Admin?</p>
      </ModalZ>
      <div className="report-header d-none" id="reportHeader">
        <img src={Logo} alt="Logo" />
        <h6>World Check Report</h6>
        <span className="track-id-badge mx-auto">
          <i className="ri-global-line"></i>
          {id}
        </span>
      </div>
    </div>
  );
}
