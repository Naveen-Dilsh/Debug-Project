import { useState, useEffect, useRef } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import Draggable from "react-draggable";
import { Checkbox, Spin } from "antd";

import { Each, fetchApi } from "../helper";

import TimerZ from "../components/TimerZ";

import DocFront from "../assets/img/id-front.jpg";
import DocBack from "../assets/img/id-back.jpg";

import Icon1 from "../assets/img/fa-icon-1.svg";
import Icon2 from "../assets/img/fa-icon-2.svg";
import Icon3 from "../assets/img/fa-icon-3.svg";
import Icon4 from "../assets/img/fa-icon-4.svg";
import Icon5 from "../assets/img/fa-icon-5.svg";
import Icon6 from "../assets/img/fa-icon-6.svg";

import { fetchDocument } from "../store/document/documentSlice";

function useKeypress(key, action) {
  useEffect(() => {
    function onKeyup(e) {
      if (e.key === key) action();
    }
    window.addEventListener("keyup", onKeyup);
    return () => window.removeEventListener("keyup", onKeyup);
  }, []);
}

export default function FraudAssessment() {
  let { id } = useParams();

  const dispatch = useDispatch();

  const docRef = useRef([]);

  const navigate = useNavigate();

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imgStyle, setImgStyle] = useState({
    sample: { rotate: 0, zoom: 1, flip: false, position: null },
    live: { rotate: 0, zoom: 1, flip: false, position: null },
  });
  const [selectedImg, setSelectedImg] = useState(null);
  const [timeSpent, setTimeSpent] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [checked, setChecked] = useState({ cq: [], odp: [] });
  const [flagged, setFlagged] = useState([]);
  const [disabled, setDisabled] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sampleOpen, setSampleOpen] = useState(false);
  const [sampleSelected, setSampleSelected] = useState(0);
  const [fullScreen, setFullScreen] = useState(false);

  let { userDetails } = useSelector((state) => state.auth);
  let sampleDocs = useSelector((state) => state.document);

  useEffect(() => {
    if (id) {
      getTask();
    } else {
      setTask(null);
    }
  }, [id]);

  useEffect(() => {
    let flagged = task?.fraudAssessment?.flagged ?? [];

    setChecked(task?.fraudAssessment?.checked ?? { cq: [], odp: [] });
    setFlagged(flagged);

    if (task?.fraudAssessment?.checked?.cq?.length > 0) {
      setDisabled("flag");
    }
    if (
      flagged?.some((word) =>
        [
          "Picture Face Integrity",
          "Shape & Template",
          "Security Features",
          "Fonts",
          "Digital Tampering",
        ].includes(word)
      )
    ) {
      setDisabled("CQ");
    }
  }, [task]);

  function getTask() {
    setLoading(true);
    let payload = {
      method: "GET",
      url: `/task?role=${userDetails?.role == "admin" ? "AD" : "AN"}&id=${id}`,
    };
    fetchApi(payload)
      .then((res) => {
        let data = res?.data;
        setLoading(false);
        setTask(data);
        // console.log(data);
        // Driving Licence
        getSampleDoc(data?.issuingCountry, data?.documentType);
      })
      .catch((err) => console.log(err));
  }

  function getSampleDoc(country, doc_type) {
    let payload = { country: "LKA", doc_type };
    dispatch(fetchDocument(payload));
  }

  function onImageEdit(action) {
    let style = { ...imgStyle };

    if (selectedImg) {
      switch (action) {
        case "reset":
          style[selectedImg]["rotate"] = 0;
          style[selectedImg]["zoom"] = 1;
          style[selectedImg]["position"] = { x: 0, y: 0 };
          break;
        case "rotate-left":
          style[selectedImg]["rotate"] -= 45;
          break;
        case "rotate-right":
          style[selectedImg]["rotate"] += 45;
          break;
        case "zoom-in":
          if (style[selectedImg]["zoom"] < fullScreen ? 900 : 10) {
            style[selectedImg]["zoom"] += fullScreen ? 80 : 0.5;
          }
          break;
        case "zoom-out":
          if (style[selectedImg]["zoom"] > 1) {
            style[selectedImg]["zoom"] -= fullScreen ? 80 : 0.5;
          }
          break;
        case "flip":
          style[selectedImg]["flip"] = !style[selectedImg]["flip"];
          break;
      }
    }

    setImgStyle(style);
  }

  function getPosition(e, ui, key) {
    let style = { ...imgStyle };

    let { lastX, lastY } = ui;

    style[key]["position"] = {
      x: lastX,
      y: lastY,
    };

    setImgStyle(style);
  }

  function flipDocuments() {
    let style = { ...imgStyle };

    style["sample"]["flip"] = !style["sample"]["flip"];
    style["live"]["flip"] = !style["live"]["flip"];

    setImgStyle(style);
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

  const onScroll = (e) => {
    if (e.deltaY < 0) {
      onImageEdit("zoom-in");
    } else {
      onImageEdit("zoom-out");
    }
  };

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

  const cqOptions = [
    {
      label: "Obscured Data Points",
      value: "Obscured Data Points",
    },
    {
      label: "Obscured Security Features",
      value: "Obscured Security Features",
    },
    {
      label: "Abnormal Doc Features",
      value: "Abnormal Doc Features",
    },
    {
      label: "Digital Text Overlay",
      value: "Digital Text Overlay",
    },
    {
      label: "Corner Physically Removed",
      value: "Corner Physically Removed",
    },
    {
      label: "Punctured",
      value: "Punctured",
    },
    {
      label: "Digital Version",
      value: "Digital Version",
    },
    {
      label: "Missing Back",
      value: "Missing Back",
    },
    {
      label: "Expired Document",
      value: "Expired Document",
    },
  ];

  const odpOptions = [
    {
      label: "Photo of a Screen",
      value: "Photo of a Screen",
    },
    {
      label: "Screenshot",
      value: "Screenshot",
    },
    {
      label: "Document printed on paper",
      value: "Document printed on paper",
    },
    {
      label: "Scan",
      value: "Scan",
    },
  ];

  const onChange = (values) => {
    let obj = { ...checked };
    if (activeTab == 0) {
      if (values?.length > 0) {
        setDisabled("flag");
      } else {
        setDisabled("");
      }
      obj["cq"] = values;
    } else {
      obj["odp"] = values;
    }
    setChecked(obj);
  };

  let flagOptions = [
    {
      name: "Face Detection",
      icon: Icon1,
    },
    {
      name: "Picture Face Integrity",
      icon: Icon2,
    },
    {
      name: "Shape & Template",
      icon: Icon3,
    },
    {
      name: "Security Features",
      icon: Icon4,
    },
    {
      name: "Fonts",
      icon: Icon5,
    },
    {
      name: "Digital Tampering",
      icon: Icon6,
    },
  ];

  const getFlag = (value) => {
    let arr = [...flagged];

    let index = arr.findIndex((item) => item == value);
    if (index == -1) {
      arr.push(value);
    } else {
      arr.splice(index, 1);
    }

    if (value !== "Face Detection") {
      let temp = [...arr];
      let find = temp.findIndex((i) => i == "Face Detection");
      if (find !== -1) {
        temp.splice(find, 1);
      }
      if (temp?.length == 0) {
        setDisabled("");
      } else {
        setDisabled("CQ");
      }
    }

    setFlagged(arr);
  };

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
  //     // console.log(time, "time at fa");
  //     updateTasks({ timeSpent: JSON.parse(time) }, { showNotify: false });
  //     // console.log("back called!");
  //     hasExecuted.current = true;
  //     // localStorage.removeItem("time-token");
  //     window.removeEventListener("popstate", handleBack);
  //   }
  // }

  // window.addEventListener("popstate", handleBack);

  function onSubmit() {
    setSubmitting(true);
    let data = {
      fraudAssessment: { checked, flagged },
      timeSpent,
    };
    updateTasks(data)
      .then((res) => {
        setSubmitting(false);
        navigate(`/app/final-report/${id}`);
      })
      .catch((err) => console.log(err));
  }

  useKeypress("Escape", () => setFullScreen(false));

  function toggleFullScreen() {
    let style = { ...imgStyle };

    style["sample"]["rotate"] = 0;
    style["sample"]["zoom"] = 1;
    style["sample"]["position"] = null;

    style["live"]["rotate"] = 0;
    style["live"]["zoom"] = 1;
    style["live"]["position"] = null;

    setImgStyle(style);
    setFullScreen(!fullScreen);
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
          <h2 className="page-content-title mb-4">
            Task Type : <span>FRAUD ASSESSMENT</span>
          </h2>
          <div className="row">
            <div className="col-md-7">
              <div
                className={`draggable-wrapper fraud-assessment ${
                  fullScreen ? "full-screen" : ""
                }`}
              >
                <div className="document-action-btns">
                  <button onClick={toggleFullScreen}>
                    <i
                      className={
                        fullScreen
                          ? "ri-fullscreen-exit-line"
                          : "ri-fullscreen-line"
                      }
                    ></i>
                  </button>
                  <button onClick={flipDocuments}>
                    <i className="ri-refund-line"></i>
                  </button>
                </div>
                <div className="document-details">
                  <div className="d-flex gap-2 flex-column">
                    <button>
                      <i className="ri-information-line"></i>
                    </button>
                    <button onClick={() => setSampleOpen(true)}>
                      <i className="ri-folder-6-line"></i>
                    </button>
                  </div>
                  <ul>
                    <li>
                      Issuing Country: <span>{task?.issuingCountry}</span>
                    </li>
                    <li>
                      Document Type: <span>{task?.documentType}</span>
                    </li>
                    <li>
                      Issuing State / Region:{" "}
                      <span>{task?.region ?? "N/A"}</span>
                    </li>
                  </ul>
                </div>
                <div className={`document-samples ${sampleOpen ? "open" : ""}`}>
                  <div className="d-flex justify-content-between align-items-center">
                    <h4>Samples</h4>
                    <button
                      className="close-btn"
                      onClick={() => setSampleOpen(false)}
                    >
                      <i className="ri-close-circle-line"></i>
                    </button>
                  </div>
                  {sampleDocs["data"]?.length > 0 ? (
                    <Each
                      array={sampleDocs["data"]}
                      render={(doc, index) => {
                        return (
                          <div
                            className={`document-sample ${
                              sampleSelected == index ? "selected" : ""
                            }`}
                          >
                            <img
                              src={doc?.image_front}
                              alt=""
                              onClick={() => setSampleSelected(index)}
                            />
                            <label>{doc?.version}</label>
                          </div>
                        );
                      }}
                    />
                  ) : (
                    <h6>No sample documents available</h6>
                  )}
                </div>
                <div className="document-wrapper">
                  {fullScreen ? (
                    <div className="d-flex gap-3">
                      <Draggable
                        position={imgStyle?.sample?.position}
                        onDrag={(e, ui) => getPosition(e, ui, "sample")}
                      >
                        <div
                          className={`draggable-box document-img ${
                            selectedImg == "sample" ? "selected" : ""
                          } ${imgStyle?.sample.flip ? "flip" : ""}`}
                          onClick={() => setSelectedImg("sample")}
                          ref={(el) => (docRef.current["sample"] = el)}
                          onWheelCapture={onScroll}
                        >
                          <span className="custom-label mb-2">Sample</span>
                          <div
                            className="flip-wrapper"
                            style={{
                              width: 550 + imgStyle?.sample.zoom,
                              rotate: `${imgStyle?.sample.rotate}deg`,
                            }}
                          >
                            <img
                              className="draggable-img front"
                              src={
                                sampleDocs?.["data"]?.[sampleSelected]
                                  ?.image_front
                              }
                              alt=""
                            />
                            <img
                              className="draggable-img back"
                              src={
                                sampleDocs?.["data"]?.[sampleSelected]
                                  ?.image_back
                              }
                              alt=""
                            />
                          </div>
                        </div>
                      </Draggable>
                      <Draggable
                        position={imgStyle?.live?.position}
                        onDrag={(e, ui) => getPosition(e, ui, "live")}
                      >
                        <div
                          className={`draggable-box document-img ${
                            selectedImg == "live" ? "selected" : ""
                          } ${imgStyle?.live.flip ? "flip" : ""}`}
                          onClick={() => setSelectedImg("live")}
                          ref={(el) => (docRef.current["live"] = el)}
                          onWheelCapture={onScroll}
                        >
                          <span className="custom-label mb-2">Live</span>
                          <div
                            className="flip-wrapper"
                            style={{
                              width: 550 + imgStyle?.live.zoom,
                              rotate: `${imgStyle?.live.rotate}deg`,
                            }}
                          >
                            <img
                              className="draggable-img front"
                              src={task?.docFront}
                              alt=""
                            />
                            <img
                              className="draggable-img back"
                              src={task?.docBack}
                              alt=""
                            />
                          </div>
                        </div>
                      </Draggable>
                    </div>
                  ) : (
                    <div className="d-flex gap-3">
                      <div
                        className={`draggable-box document-img ${
                          imgStyle?.sample.flip ? "flip" : ""
                        }`}
                        onClick={() => setSelectedImg("sample")}
                        ref={(el) => (docRef.current["sample"] = el)}
                        onWheelCapture={onScroll}
                      >
                        <span className="custom-label mb-2">Sample</span>
                        <div
                          className={`zoom-wrapper ${
                            selectedImg == "sample" ? "selected-border" : ""
                          }`}
                        >
                          <Draggable
                            onStart={() => selectedImg == "sample"}
                            position={imgStyle?.sample?.position}
                            onDrag={(e, ui) => getPosition(e, ui, "sample")}
                            bounds={{
                              top: -200,
                              left: -400,
                              right: 400,
                              bottom: 200,
                            }}
                          >
                            <div className="">
                              <div
                                className="flip-wrapper"
                                style={{
                                  width: 280,
                                  rotate: `${imgStyle?.sample.rotate}deg`,
                                  scale: `${imgStyle?.sample.zoom}`,
                                }}
                              >
                                <img
                                  className="draggable-img front"
                                  src={
                                    sampleDocs?.["data"]?.[sampleSelected]
                                      ?.image_front
                                  }
                                  alt=""
                                />
                                <img
                                  className="draggable-img back"
                                  src={
                                    sampleDocs?.["data"]?.[sampleSelected]
                                      ?.image_back
                                  }
                                  alt=""
                                />
                              </div>
                            </div>
                          </Draggable>
                        </div>
                      </div>
                      <div
                        className={`draggable-box document-img ${
                          imgStyle?.live.flip ? "flip" : ""
                        }`}
                        onClick={() => setSelectedImg("live")}
                        ref={(el) => (docRef.current["live"] = el)}
                        onWheelCapture={onScroll}
                      >
                        <span className="custom-label mb-2">Live</span>
                        <div
                          className={`zoom-wrapper ${
                            selectedImg == "live" ? "selected-border" : ""
                          }`}
                        >
                          <Draggable
                            onStart={() => selectedImg == "live"}
                            position={imgStyle?.live?.position}
                            onDrag={(e, ui) => getPosition(e, ui, "live")}
                            bounds={{
                              top: -200,
                              left: -400,
                              right: 400,
                              bottom: 200,
                            }}
                          >
                            <div className="">
                              <div
                                className="flip-wrapper"
                                style={{
                                  width: 280,
                                  rotate: `${imgStyle?.live.rotate}deg`,
                                  scale: `${imgStyle?.live.zoom}`,
                                }}
                              >
                                <img
                                  className="draggable-img front"
                                  src={task?.docFront}
                                  alt=""
                                />
                                <img
                                  className="draggable-img back"
                                  src={task?.docBack}
                                  alt=""
                                />
                              </div>
                            </div>
                          </Draggable>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="image-tools">
                  <button
                    onClick={() => onImageEdit("rotate-left")}
                    title="Rotate Left"
                  >
                    <i className="ri-anticlockwise-2-line"></i>
                  </button>
                  <button
                    onClick={() => onImageEdit("rotate-right")}
                    title="Rotate Right"
                  >
                    <i className="ri-clockwise-line"></i>
                  </button>
                  <button onClick={() => onImageEdit("flip")} title="Flip">
                    <i className="ri-shadow-line"></i>
                  </button>
                  <button onClick={() => onImageEdit("reset")} title="Reset">
                    <i className="ri-refresh-line"></i>
                  </button>
                  <button
                    onClick={() => onImageEdit("zoom-in")}
                    title="Zoom In"
                  >
                    <i className="ri-zoom-in-line"></i>
                  </button>
                  <button
                    onClick={() => onImageEdit("zoom-out")}
                    title="Zoom Out"
                  >
                    <i className="ri-zoom-out-line"></i>
                  </button>
                </div>
              </div>
            </div>
            <div className="col-md-5">
              <div className="custom-tap">
                <button
                  className={activeTab == 0 ? "active" : ""}
                  onClick={() => setActiveTab(0)}
                >
                  Conclusive Quality
                  {checked?.cq?.length > 0 && (
                    <span className="check-flag">
                      <i className="ri-flag-line"></i>
                    </span>
                  )}
                </button>
                <button
                  className={activeTab == 1 ? "active" : ""}
                  onClick={() => setActiveTab(1)}
                >
                  Original Document Present
                  {checked?.odp?.length > 0 && (
                    <span className="check-flag">
                      <i className="ri-flag-line"></i>
                    </span>
                  )}
                </button>
              </div>
              <Checkbox.Group
                className="custom-checkbox rounded-checkbox mt-3 mb-5 fa-check-list"
                value={checked?.[activeTab == 0 ? "cq" : "odp"]}
                options={activeTab == 0 ? cqOptions : odpOptions}
                disabled={activeTab == 0 ? disabled == "CQ" : false}
                onChange={onChange}
              />
              <h4 className="secondary-title">
                FLAG IF RELEVANT:{" "}
                {flagged?.length > 0 && (
                  <span className="check-flag">
                    <i className="ri-flag-line"></i>
                  </span>
                )}
              </h4>
              <div className="image-selector mt-2">
                <Each
                  array={flagOptions}
                  render={(flag) => {
                    return (
                      <div
                        className={`image-selector-items ${
                          flagged?.length > 0 &&
                          flagged?.find((item) => item == flag.name)
                            ? "active"
                            : ""
                        } ${
                          disabled == "flag" && flag.name !== "Face Detection"
                            ? "disabled"
                            : ""
                        }`}
                        onClick={() =>
                          disabled == "flag" && flag.name !== "Face Detection"
                            ? null
                            : getFlag(flag.name)
                        }
                      >
                        <span>
                          <img src={flag.icon} alt="" />
                        </span>
                        <label>{flag.name}</label>
                      </div>
                    );
                  }}
                />
              </div>
              <button
                className="primary-btn px-5 mt-5 ms-auto"
                disabled={submitting}
                onClick={onSubmit}
              >
                {submitting && (
                  <i className="ri-loader-4-line icon-spin-ani"></i>
                )}
                Submit
              </button>
            </div>
          </div>
        </div>
      </Spin>
    </div>
  );
}
