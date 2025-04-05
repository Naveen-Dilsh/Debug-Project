import { useState, useEffect, useRef } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import Draggable from "react-draggable";
import { Popover, Select, DatePicker, Timeline, Modal, Spin } from "antd";
import dayjs from "dayjs";
import moment from "moment";

import {
  Each,
  sendNotify,
  fileToBase64,
  fetchApi,
  removeEmpty,
  socket,
  getTempProfile,
} from "../helper";

import LoaderZ from "../components/LoaderZ";
import ModalZ from "../components/ModalZ";
import TimerZ from "../components/TimerZ";
import ImageUploadZ from "../components/ImageUploadZ";
import UploadZ from "../components/UploadZ";
import Attachment from "../components/Attachment";

import { fetchCountries } from "../store/countries/countriesSlice";
import { fetchDocTypes } from "../store/doc-types/docTypesSlice";
import { fetchNationalities } from "../store/nationalities/nationalitiesSlice";

const { confirm } = Modal;

function useKeypress(key, action) {
  useEffect(() => {
    function onKeyup(e) {
      if (e.key === key) action();
    }
    window.addEventListener("keyup", onKeyup);
    return () => window.removeEventListener("keyup", onKeyup);
  }, []);
}

export default function Task() {
  let { id } = useParams();

  const dispatch = useDispatch();

  const navigate = useNavigate();

  let { userDetails } = useSelector((state) => state.auth);
  let countries = useSelector((state) => state.countries);
  let docTypes = useSelector((state) => state.docTypes);
  let nationalities = useSelector((state) => state.nationalities);

  const docRef = useRef([]);

  const [imgStyle, setImgStyle] = useState({
    photo: { rotate: 0, zoom: 1 },
    document: { rotate: 0, zoom: 1 },
  });
  const [docFlip, setDocFlip] = useState(false);
  const [selectedImg, setSelectedImg] = useState(null);
  const [fullScreen, setFullScreen] = useState(false);
  const [viewHistory, setViewHistory] = useState(false);
  const [message, setMessage] = useState("");
  const [attachment, setAttachment] = useState([]);
  const [attachLoading, setAttachLoading] = useState(false);
  const [task, setTask] = useState(null);
  const [payload, setPayload] = useState({});
  const [documents, setDocuments] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assigned, setAssigned] = useState(false);
  const [region, setRegion] = useState([]);
  const [flags, setFlags] = useState([]);
  const [timeSpent, setTimeSpent] = useState(null);
  const [confirmReq, setConfirmReq] = useState(false);
  const [reqApproveDis, setReqApproveDis] = useState(true);
  const [newFields, setNewFields] = useState([]);

  useEffect(() => {
    if (id) {
      getTask();
    } else {
      setTask(null);
    }
  }, [id]);

  useEffect(() => {
    socket.on(`task-${id}`, (task) => {
      if (task?.update) {
        getTask();
      }
    });
    return () => {
      socket.off(`task-${id}`);
    };
  }, []);

  useEffect(() => {
    let doc = [
      {
        key: "photo",
        name: "Live Photo",
        image: task?.photo,
      },
      {
        key: "idFront",
        name: "Document Front",
        image: task?.docFront,
      },
      {
        key: "idBack",
        name: "Document Back",
        image: task?.docBack,
      },
    ];
    setDocuments(doc);

    let obj = {
      faceMatch: task?.faceMatch,
      issuingCountry: task?.issuingCountry,
      region: task?.region,
      nationality: task?.nationality,
      firstName: task?.firstName,
      lastName: task?.lastName,
      gender: task?.gender,
      documentType: task?.documentType,
      documentNo: task?.documentNo,
      personalNo: task?.personalNo,
      dateOfBirth: task?.dateOfBirth,
      placeOfBirth: task?.placeOfBirth,
      dateOfIssue: task?.dateOfIssue,
      dateOfExpiry: task?.dateOfExpiry,
      iqFail: task?.iqFail,
    };
    setPayload(obj);
    setFlags(task?.flags ?? []);

    let his = [];

    task?.history?.map((h, index) => {
      let act = {
        children: (
          <div className="activity-points">
            <p>{moment.unix(h?.createdAt).format("MMM DD, YYYY")}</p>
            <p>{moment.unix(h?.createdAt).format("LT")}</p>
            <h6>
              {h?.content}
              {h?.description && (
                <ul className="line-list">
                  {h?.description?.map((des, i) => {
                    return <li key={i}>{des}</li>;
                  })}
                </ul>
              )}
              {h?.comment && (
                <div>
                  <div className="comment-box mt-2">
                    {h?.comment}
                    <span className="user-profile">
                      <div className="profile-image">
                        {h?.updatedBy?.profileImg ? (
                          <img src={h?.updatedBy?.profileImg} alt="" />
                        ) : (
                          <h4
                            className="temp-profile"
                            // style={{ backgroundColor: "#000" }}
                          >
                            {getTempProfile(h?.updatedBy)}
                          </h4>
                        )}
                      </div>
                      <label htmlFor="">
                        {`${h?.updatedBy?.firstName} ${h?.updatedBy?.lastName}`}
                      </label>
                    </span>
                  </div>
                  {h?.attachment?.length > 0 && (
                    <div className="row mt-1 g-2">
                      <Each
                        array={h?.attachment}
                        render={(attach) => {
                          return (
                            <div className="col-md-6">
                              <Attachment file={attach} />
                            </div>
                          );
                        }}
                      />
                    </div>
                  )}
                </div>
              )}
            </h6>
          </div>
        ),
      };
      his.push(act);
    });

    setHistory(his);
    let time =
      userDetails?.role == "admin"
        ? task?.adminTimeSpent
        : task?.analystTimeSpent;
    setTimeSpent(time);
    let fields = task?.customFields;
    if (fields) {
      let arr = [];
      Object.keys(fields).forEach((k) =>
        arr.push({ label: k, value: fields[k] })
      );
      setNewFields(arr);
    }
  }, [task]);

  useEffect(() => {
    if (!countries?.data) {
      dispatch(fetchCountries());
    }
    if (!nationalities?.data) {
      dispatch(fetchNationalities());
    }
  }, []);

  useEffect(() => {
    if (payload["issuingCountry"]) {
      let find = countries?.data?.find(
        (c) => c.value == payload["issuingCountry"]
      );
      setRegion(find?.region ?? []);
      dispatch(fetchDocTypes(payload["issuingCountry"]));
    }
  }, [payload["issuingCountry"], countries.data]);

  useKeypress("Escape", () => setFullScreen(false));

  function getTask() {
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

        let role = userDetails?.role;
        if (data[role]) {
          if (data[role] != userDetails?.id) {
            setAssigned(true);
          }
        } else {
          updateTasks({ [role]: userDetails?.id }, { options: data?.status });
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

  function onImageEdit(action) {
    let style = { ...imgStyle };

    if (selectedImg) {
      switch (action) {
        case "rotate-left":
          style[selectedImg]["rotate"] -= 45;
          break;
        case "rotate-right":
          style[selectedImg]["rotate"] += 45;
          break;
        case "zoom-in":
          if (style[selectedImg]["zoom"] < fullScreen ? 900 : 10) {
            style[selectedImg]["zoom"] += fullScreen ? 20 : 0.5;
          }
          break;
        case "zoom-out":
          if (style[selectedImg]["zoom"] > 1) {
            style[selectedImg]["zoom"] -= fullScreen ? 20 : 0.5;
          }
          break;
      }
    }

    setImgStyle(style);
  }

  function toggleFullScreen() {
    setImgStyle({
      photo: { rotate: 0, zoom: 1 },
      document: { rotate: 0, zoom: 1 },
    });
    setFullScreen(!fullScreen);
  }

  const onScroll = (e) => {
    if (e.deltaY < 0) {
      onImageEdit("zoom-in");
    } else {
      onImageEdit("zoom-out");
    }
  };

  const onImageUpload = (e) => {
    let file = e.target.files[0];
    let doc = {};
    if (file) {
      if (file?.size > 5242880) {
        sendNotify("error", "File is too big!, Upload below 5MB file.");
      } else {
        let type = file?.name.substring(file?.name.lastIndexOf(".") + 1);
        var imageType = new RegExp("(.*?)(png|jpg|jpeg|svg)$");
        var fileType = new RegExp("(.*?)(pdf|docx|doc|xls|xlsx|csv)$");
        if (imageType.test(type) || fileType.test(type)) {
          setAttachLoading(true);
          fileToBase64(file)
            .then((data) => {
              console.log(data);
              doc["url"] = URL.createObjectURL(file);
              doc["name"] = file?.name;
              doc["size"] = file?.size;
              doc["type"] = type;
              doc["isImg"] = imageType.test(type);
              doc["base64"] = data;

              let arr = [...attachment];
              arr.push(doc);
              setAttachment(arr);
              sendNotify("success", "Attachment uploaded successfully.");
              setAttachLoading(false);
            })
            .catch((error) => ({ error: JSON.stringify(error) }));
        } else {
          sendNotify("error", "File format not supported.");
        }
      }
    }
  };

  const onDeleteFile = (name) => {
    let arr = [...attachment];
    let index = arr.findIndex((a) => a.name == name);
    arr.splice(index, 1);
    setAttachment(arr);
  };

  function changeAnalyst() {
    updateTasks({ sendToAnalyst: true, timeSpent });
    backToList();
  }

  function changeClient() {
    updateTasks({ sendToClient: true, timeSpent });
    backToList();
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

  const getInputValue = (value, label) => {
    // console.log(value, label);
    let obj = { ...payload };
    if (label == "issuingCountry") {
      obj["region"] = "N/A";
      obj["documentType"] = "N/A";
    }
    if (label == "faceMatch") {
      if (!value) {
        setReqApproveDis(false);
      } else {
        setReqApproveDis(true);
      }
    }
    if (["issuingCountry", "region", "documentType"].includes(label)) {
      if (value == "unsupported") {
        setReqApproveDis(false);
      } else {
        setReqApproveDis(true);
      }
    }
    if ("iqFail" === label) {
      if (value) {
        setReqApproveDis(false);
      } else {
        setReqApproveDis(true);
      }
    }
    obj[label] = value;
    setPayload(obj);
  };

  const backToList = () => {
    // `/app/${userDetails?.role == "admin" ? "admin-tasks" : "analyst-tasks"}`;
    navigate(-1);
  };

  const toggleFlag = (key) => {
    let arr = [...flags];
    let index = arr.findIndex((f) => f == key);
    if (index != -1) {
      arr.splice(index, 1);
    } else {
      arr.push(key);
    }
    setFlags(arr);
  };

  function getFile(file, index) {
    let arr = [...file];
    arr[index] = file;
    setAttachment(arr);
  }

  function sendComment() {
    if (message) {
      updateTasks({ comment: message, attachment, timeSpent });
      setMessage("");
      setAttachment([]);
    }
  }

  function getTime(value) {
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
  //     console.log(JSON.parse(time), "time at task");
  //     updateTasks({ timeSpent: JSON.parse(time) });
  //     hasExecuted.current = true;
  //     // localStorage.removeItem("time-token");
  //     window.removeEventListener("popstate", handleBack);
  //   }
  // }

  // window.addEventListener("popstate", handleBack);

  const getData = (value, index, key) => {
    setNewFields((prevFields) =>
      prevFields.map((field, idx) =>
        idx === index ? { ...field, [key]: value } : field
      )
    );
  };

  const addInput = () => {
    let arr = [...newFields];
    console.log(arr);

    let newInput = {
      label: "Enter label name",
      value: "",
    };
    arr.push(newInput);
    setNewFields(arr);
  };

  const removeInput = (index) => {
    let arr = [...newFields];
    arr.splice(index, 1);
    console.log(arr);
    setNewFields(arr);
  };

  function submit() {
    let obj = { ...payload };
    let data = removeEmpty(obj);
    setLoading(true);

    let arr = [...newFields];

    let customFields = {};
    arr.map((field) => {
      customFields[field["label"]] = field["value"];
    });

    updateTasks({
      changes: true,
      ...data,
      flags,
      timeSpent,
      customFields,
    }).then((res) => {
      setLoading(false);
      if (res?.status == 200) {
        navigate(`/app/world-check/${id}`);
      }
    });
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
        <LoaderZ loading={loading}>
          <div className="page-content">
            <div className="row">
              <div className="col-md-8">
                <div
                  className="sticky-document"
                  style={{ zIndex: fullScreen ? 999 : 9 }}
                >
                  <div
                    className={`draggable-wrapper ${
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
                    </div>
                    <div className="d-flex justify-content-center align-items-center w-100">
                      <div className="document-wrapper">
                        {fullScreen ? (
                          <div>
                            <Draggable>
                              <div
                                className={`draggable-box photo ${
                                  selectedImg == "photo" ? "selected" : ""
                                }`}
                                onClick={() => setSelectedImg("photo")}
                                ref={(el) => (docRef.current["photo"] = el)}
                                onWheelCapture={onScroll}
                              >
                                <span className="custom-label mb-2">
                                  {documents?.[0]?.name}
                                </span>
                                <img
                                  className="draggable-img"
                                  src={documents?.[0]?.image}
                                  style={{
                                    width: 250 + imgStyle?.photo.zoom,
                                    rotate: `${imgStyle?.photo.rotate}deg`,
                                  }}
                                  alt=""
                                />
                              </div>
                            </Draggable>
                            <Draggable>
                              <div
                                className={`draggable-box document-img ${
                                  selectedImg == "document" ? "selected" : ""
                                } ${docFlip ? "flip" : ""}`}
                                onClick={() => setSelectedImg("document")}
                                ref={(el) => (docRef.current["document"] = el)}
                                onWheelCapture={onScroll}
                              >
                                <span className="custom-label mb-2">
                                  {documents?.[docFlip ? 2 : 1]?.name}
                                </span>
                                <div
                                  className="flip-wrapper"
                                  style={{
                                    width: 480 + imgStyle?.document.zoom,
                                    rotate: `${imgStyle?.document.rotate}deg`,
                                  }}
                                >
                                  <img
                                    className="draggable-img front"
                                    src={documents?.[1]?.image}
                                    alt=""
                                  />
                                  <img
                                    className="draggable-img back"
                                    src={documents?.[2]?.image}
                                    alt=""
                                  />
                                </div>
                              </div>
                            </Draggable>
                          </div>
                        ) : (
                          <div>
                            {documents?.[0]?.image && (
                              <div
                                className={`draggable-box photo`}
                                onClick={() => setSelectedImg("photo")}
                                ref={(el) => (docRef.current["photo"] = el)}
                                onWheelCapture={onScroll}
                              >
                                <span className="custom-label mb-2">
                                  {documents?.[0]?.name}
                                </span>
                                <div
                                  className={`zoom-wrapper ${
                                    selectedImg == "photo"
                                      ? "selected-border"
                                      : ""
                                  }`}
                                >
                                  <Draggable
                                    onStart={() => selectedImg == "photo"}
                                    bounds={{
                                      top: -200,
                                      left: -200,
                                      right: 200,
                                      bottom: 200,
                                    }}
                                  >
                                    <div className="photo-wrapper">
                                      <img
                                        className="draggable-img"
                                        src={documents?.[0]?.image}
                                        style={{
                                          width: 250,
                                          rotate: `${imgStyle?.photo.rotate}deg`,
                                          scale: `${imgStyle?.photo.zoom}`,
                                        }}
                                        alt=""
                                      />
                                    </div>
                                  </Draggable>
                                </div>
                              </div>
                            )}
                            <div
                              className={`draggable-box document-img ${
                                docFlip ? "flip" : ""
                              } ${documents?.[0]?.image ? "" : "center-align"}`}
                              onClick={() => setSelectedImg("document")}
                              ref={(el) => (docRef.current["document"] = el)}
                              onWheelCapture={onScroll}
                            >
                              <span className="custom-label mb-2">
                                {documents?.[docFlip ? 2 : 1]?.name}
                              </span>
                              <div
                                className={`zoom-wrapper ${
                                  selectedImg == "document"
                                    ? "selected-border"
                                    : ""
                                }`}
                              >
                                <Draggable
                                  onStart={() => selectedImg == "document"}
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
                                        width: 480,
                                        rotate: `${imgStyle?.document.rotate}deg`,
                                        scale: `${imgStyle?.document.zoom}`,
                                      }}
                                    >
                                      <img
                                        className="draggable-img front"
                                        src={documents?.[1]?.image}
                                        alt=""
                                      />
                                      <img
                                        className="draggable-img back"
                                        src={documents?.[2]?.image}
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
                    </div>
                    <div className="image-tools">
                      <button onClick={() => onImageEdit("rotate-left")}>
                        <i className="ri-anticlockwise-2-line"></i>
                      </button>
                      <button onClick={() => onImageEdit("rotate-right")}>
                        <i className="ri-clockwise-line"></i>
                      </button>
                      <button
                        onClick={() => setDocFlip(!docFlip)}
                        disabled={selectedImg != "document"}
                      >
                        <i className="ri-shadow-line"></i>
                      </button>
                      <button onClick={() => onImageEdit("zoom-in")}>
                        <i className="ri-zoom-in-line"></i>
                      </button>
                      <button onClick={() => onImageEdit("zoom-out")}>
                        <i className="ri-zoom-out-line"></i>
                      </button>
                    </div>
                  </div>
                  <div className="mt-4">
                    <h6 className="form-title mb-1">Activity</h6>
                    <p className="description mb-2">
                      Record of all edits, actions, and comments related to this
                      task.
                    </p>

                    <p className="description mb-1">Activity History</p>
                    <div
                      className="arrow-square-wrapper"
                      onClick={() => setViewHistory(!viewHistory)}
                    >
                      <div className="arrow-square">
                        <i
                          className={`ri-arrow-${
                            viewHistory ? "up" : "down"
                          }-s-line`}
                        ></i>
                      </div>
                    </div>
                    <div
                      className={`toggle-content ${
                        viewHistory ? "d-black" : "d-none"
                      }`}
                    >
                      <Timeline
                        className="custom-timeline mt-3 ms-2"
                        items={history}
                      />
                      <div className="message-box-wrapper">
                        <textarea
                          className="message-box"
                          rows={5}
                          name=""
                          id=""
                          placeholder="Write message..."
                          disabled={task?.status == "C"}
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          maxLength={150}
                        ></textarea>
                        <div className="message-action">
                          <label htmlFor="">
                            {message
                              ? `${150 - message.length} characters remaining`
                              : "Maximum 150 characters"}
                          </label>
                          <label
                            htmlFor="attach"
                            className={`attachment-btn ${
                              attachLoading ? "icon-spin-ani" : ""
                            }`}
                          >
                            <i
                              className={
                                attachLoading
                                  ? "ri-loader-2-line"
                                  : "ri-attachment-2"
                              }
                            ></i>
                            <input
                              type="file"
                              name="attach"
                              id="attach"
                              disabled={task?.status == "C"}
                              onChange={onImageUpload}
                              hidden
                            />
                          </label>
                          <button
                            className="primary-btn"
                            disabled={!message.length}
                            onClick={sendComment}
                          >
                            Comment
                          </button>
                        </div>
                      </div>
                      <div className="row mt-2">
                        <Each
                          array={attachment}
                          render={(file, i) => {
                            return (
                              <div key={i} className="col-md-4">
                                {file?.isImg ? (
                                  <ImageUploadZ
                                    image={file?.base64}
                                    className="w-100"
                                    onDeleteFile={onDeleteFile}
                                  />
                                ) : (
                                  <UploadZ
                                    file={file}
                                    fileName={file?.name}
                                    onStoreFile={(attach) => getFile(attach, i)}
                                    onDeleteFile={onDeleteFile}
                                  />
                                )}
                              </div>
                            );
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div
                  className={`custom-form ${
                    task?.status == "C" ? "form-disabled" : ""
                  }`}
                >
                  {documents?.[0]?.image && (
                    <>
                      {" "}
                      <div className="mb-4">
                        <label htmlFor="">Face Match</label>
                        <div className="d-flex align-items-center gap-3">
                          <Select
                            value={payload?.faceMatch}
                            loading={false}
                            className="custom-select w-100"
                            onChange={(value) =>
                              getInputValue(value, "faceMatch")
                            }
                            placeholder="Select face match status"
                            options={[
                              {
                                value: true,
                                label: "Match",
                              },
                              {
                                value: false,
                                label: "Not Match",
                              },
                            ]}
                          />
                          <button className="flag-btn hidden"></button>
                        </div>
                      </div>
                      <hr />
                    </>
                  )}
                  <div className="mb-4">
                    <label htmlFor="">Issuing Country</label>
                    <div className="d-flex align-items-center gap-3">
                      <Select
                        showSearch
                        allowClear
                        optionFilterProp="label"
                        value={payload?.issuingCountry}
                        loading={countries?.isLoading}
                        className="custom-select w-100"
                        onChange={(value) =>
                          getInputValue(value, "issuingCountry")
                        }
                        disabled={flags?.includes("issuingCountry")}
                        placeholder={
                          flags?.includes("issuingCountry")
                            ? "Text is not clear"
                            : "Select issuing country"
                        }
                        options={countries?.data}
                      />
                      <Popover content="Flag if the text is not clear">
                        <button
                          className={`flag-btn ${
                            flags?.includes("issuingCountry") ? "active" : ""
                          }`}
                          onClick={() => toggleFlag("issuingCountry")}
                        >
                          <i className="ri-flag-line"></i>
                        </button>
                      </Popover>
                    </div>
                  </div>
                  <div className="mb-4">
                    <label htmlFor="">State/Region</label>
                    <div className="d-flex align-items-center gap-3">
                      <Select
                        showSearch
                        allowClear
                        optionFilterProp="label"
                        value={payload?.region}
                        className="custom-select w-100"
                        disabled={
                          flags?.includes("region") || region.length == 0
                        }
                        placeholder={
                          flags?.includes("region")
                            ? "Text is not clear"
                            : "Select state/region"
                        }
                        onChange={(value) => getInputValue(value, "region")}
                        options={region}
                      />
                      <Popover content="Flag if the text is not clear">
                        <button
                          className={`flag-btn ${
                            flags?.includes("region") ? "active" : ""
                          } ${region?.length == 0 ? "hidden" : ""}`}
                          onClick={() => toggleFlag("region")}
                        >
                          <i className="ri-flag-line"></i>
                        </button>
                      </Popover>
                    </div>
                  </div>
                  <div className="mb-4">
                    <label htmlFor="">Type of Document</label>
                    <div className="d-flex align-items-center gap-3">
                      <Select
                        value={payload?.documentType}
                        loading={docTypes.isLoading}
                        className="custom-select w-100"
                        onChange={(value) =>
                          getInputValue(value, "documentType")
                        }
                        disabled={
                          flags?.includes("documentType") || !docTypes.data
                        }
                        placeholder={
                          flags?.includes("documentType")
                            ? "Text is not clear"
                            : "Select document type"
                        }
                        options={docTypes?.data}
                      />
                      <Popover content="Flag if the text is not clear">
                        <button
                          className={`flag-btn ${
                            flags?.includes("documentType") ? "active" : ""
                          } ${docTypes?.data?.length == 1 ? "hidden" : ""}`}
                          onClick={() => toggleFlag("documentType")}
                        >
                          <i className="ri-flag-line"></i>
                        </button>
                      </Popover>
                    </div>
                  </div>
                  <div className="mb-4">
                    <label htmlFor="">First Name</label>
                    <div className="d-flex align-items-center gap-3">
                      <input
                        type="text"
                        value={payload?.firstName ?? ""}
                        disabled={flags?.includes("firstName")}
                        autoComplete="none"
                        placeholder={
                          flags?.includes("firstName")
                            ? "Text is not clear"
                            : "Enter first name"
                        }
                        onChange={(e) =>
                          getInputValue(
                            e.target.value.toUpperCase(),
                            "firstName"
                          )
                        }
                      />
                      <Popover content="Flag if the text is not clear">
                        <button
                          className={`flag-btn ${
                            flags?.includes("firstName") ? "active" : ""
                          }`}
                          onClick={() => toggleFlag("firstName")}
                        >
                          <i className="ri-flag-line"></i>
                        </button>
                      </Popover>
                    </div>
                  </div>
                  <div className="mb-4">
                    <label htmlFor="">Last Name</label>
                    <div className="d-flex align-items-center gap-3">
                      <input
                        type="text"
                        value={payload?.lastName ?? ""}
                        disabled={flags?.includes("lastName")}
                        autoComplete="none"
                        placeholder={
                          flags?.includes("lastName")
                            ? "Text is not clear"
                            : "Enter last name"
                        }
                        onChange={(e) =>
                          getInputValue(
                            e.target.value.toUpperCase(),
                            "lastName"
                          )
                        }
                      />
                      <Popover content="Flag if the text is not clear">
                        <button
                          className={`flag-btn ${
                            flags?.includes("lastName") ? "active" : ""
                          }`}
                          onClick={() => toggleFlag("lastName")}
                        >
                          <i className="ri-flag-line"></i>
                        </button>
                      </Popover>
                    </div>
                  </div>
                  <div className="mb-4">
                    <label htmlFor="">Date of Birth</label>
                    <div className="d-flex align-items-center gap-3">
                      <DatePicker
                        className="custom-datepicker w-100"
                        format={{
                          format: "YYYY-MM-DD",
                          type: "mask",
                        }}
                        onChange={(date, dateString) =>
                          getInputValue(dateString, "dateOfBirth")
                        }
                        value={
                          payload?.dateOfBirth
                            ? dayjs(payload?.dateOfBirth)
                            : null
                        }
                        disabled={flags?.includes("dateOfBirth")}
                        placeholder={
                          flags?.includes("dateOfBirth")
                            ? "Text is not clear"
                            : "YYYY-MM-DD"
                        }
                      />
                      <Popover content="Flag if the text is not clear">
                        <button
                          className={`flag-btn ${
                            flags?.includes("dateOfBirth") ? "active" : ""
                          }`}
                          onClick={() => toggleFlag("dateOfBirth")}
                        >
                          <i className="ri-flag-line"></i>
                        </button>
                      </Popover>
                    </div>
                  </div>
                  <div className="mb-4">
                    <label htmlFor="">Place of Birth</label>
                    <div className="d-flex align-items-center gap-3">
                      <input
                        type="text"
                        value={payload?.placeOfBirth ?? ""}
                        disabled={flags?.includes("placeOfBirth")}
                        autoComplete="none"
                        placeholder={
                          flags?.includes("placeOfBirth")
                            ? "Text is not clear"
                            : "Enter place of birth"
                        }
                        onChange={(e) =>
                          getInputValue(
                            e.target.value.toUpperCase(),
                            "placeOfBirth"
                          )
                        }
                      />
                      <Popover content="Flag if the text is not clear">
                        <button
                          className={`flag-btn ${
                            flags?.includes("placeOfBirth") ? "active" : ""
                          }`}
                          onClick={() => toggleFlag("placeOfBirth")}
                        >
                          <i className="ri-flag-line"></i>
                        </button>
                      </Popover>
                    </div>
                  </div>
                  <div className="mb-4">
                    <label htmlFor="">Gender</label>
                    <div className="d-flex align-items-center gap-3">
                      <Select
                        allowClear
                        value={payload?.gender}
                        className="custom-select w-100"
                        onChange={(value) => getInputValue(value, "gender")}
                        placeholder={
                          flags?.includes("gender")
                            ? "Text is not clear"
                            : "Select gender"
                        }
                        options={[
                          {
                            value: "Male",
                            label: "Male",
                          },
                          {
                            value: "Female",
                            label: "Female",
                          },
                        ]}
                      />
                      <Popover content="Flag if the text is not clear">
                        <button
                          className={`flag-btn ${
                            flags?.includes("gender") ? "active" : ""
                          }`}
                          onClick={() => toggleFlag("gender")}
                        >
                          <i className="ri-flag-line"></i>
                        </button>
                      </Popover>
                    </div>
                  </div>
                  <div className="mb-4">
                    <label htmlFor="">Nationality</label>
                    <div className="d-flex align-items-center gap-3">
                      <Select
                        showSearch
                        allowClear
                        optionFilterProp="label"
                        value={payload?.nationality}
                        loading={nationalities?.isLoading}
                        className="custom-select w-100"
                        onChange={(value) =>
                          getInputValue(value, "nationality")
                        }
                        placeholder={
                          flags?.includes("nationality")
                            ? "Text is not clear"
                            : "Select nationality"
                        }
                        options={nationalities?.data}
                      />
                      <Popover content="Flag if the text is not clear">
                        <button
                          className={`flag-btn ${
                            flags?.includes("nationality") ? "active" : ""
                          }`}
                          onClick={() => toggleFlag("nationality")}
                        >
                          <i className="ri-flag-line"></i>
                        </button>
                      </Popover>
                    </div>
                  </div>
                  <div className="mb-4">
                    <label htmlFor="">Issue Date</label>
                    <div className="d-flex align-items-center gap-3">
                      <DatePicker
                        className="custom-datepicker w-100"
                        format={{
                          format: "YYYY-MM-DD",
                          type: "mask",
                        }}
                        onChange={(date, dateString) =>
                          getInputValue(dateString, "dateOfIssue")
                        }
                        value={
                          payload?.dateOfIssue
                            ? dayjs(payload?.dateOfIssue)
                            : null
                        }
                        disabled={flags?.includes("dateOfIssue")}
                        placeholder={
                          flags?.includes("dateOfIssue")
                            ? "Text is not clear"
                            : "YYYY-MM-DD"
                        }
                      />
                      <Popover content="Flag if the text is not clear">
                        <button
                          className={`flag-btn ${
                            flags?.includes("dateOfIssue") ? "active" : ""
                          }`}
                          onClick={() => toggleFlag("dateOfIssue")}
                        >
                          <i className="ri-flag-line"></i>
                        </button>
                      </Popover>
                    </div>
                  </div>
                  <div className="mb-4">
                    <label htmlFor="">Expiry Date</label>
                    <div className="d-flex align-items-center gap-3">
                      <DatePicker
                        className="custom-datepicker w-100"
                        format={{
                          format: "YYYY-MM-DD",
                          type: "mask",
                        }}
                        onChange={(date, dateString) =>
                          getInputValue(dateString, "dateOfExpiry")
                        }
                        value={
                          payload?.dateOfExpiry
                            ? dayjs(payload?.dateOfExpiry)
                            : null
                        }
                        disabled={flags?.includes("dateOfExpiry")}
                        placeholder={
                          flags?.includes("dateOfExpiry")
                            ? "Text is not clear"
                            : "YYYY-MM-DD"
                        }
                      />
                      <Popover content="Flag if the text is not clear">
                        <button
                          className={`flag-btn ${
                            flags?.includes("dateOfExpiry") ? "active" : ""
                          }`}
                          onClick={() => toggleFlag("dateOfExpiry")}
                        >
                          <i className="ri-flag-line"></i>
                        </button>
                      </Popover>
                    </div>
                  </div>
                  <div className="mb-4">
                    <label htmlFor="">Document Number</label>
                    <div className="d-flex align-items-center gap-3">
                      <input
                        type="text"
                        value={payload?.documentNo ?? ""}
                        disabled={flags?.includes("documentNo")}
                        autoComplete="none"
                        placeholder={
                          flags?.includes("documentNo")
                            ? "Text is not clear"
                            : "Enter document number"
                        }
                        onChange={(e) =>
                          getInputValue(
                            e.target.value.toUpperCase(),
                            "documentNo"
                          )
                        }
                      />
                      <Popover content="Flag if the text is not clear">
                        <button
                          className={`flag-btn ${
                            flags?.includes("documentNo") ? "active" : ""
                          }`}
                          onClick={() => toggleFlag("documentNo")}
                        >
                          <i className="ri-flag-line"></i>
                        </button>
                      </Popover>
                    </div>
                  </div>
                  <div className="mb-4">
                    <label htmlFor="">Personal Number</label>
                    <div className="d-flex align-items-center gap-3">
                      <input
                        type="text"
                        value={payload?.personalNo ?? ""}
                        disabled={flags?.includes("personalNo")}
                        autoComplete="none"
                        placeholder={
                          flags?.includes("personalNo")
                            ? "Text is not clear"
                            : "Enter personal number"
                        }
                        onChange={(e) =>
                          getInputValue(
                            e.target.value.toUpperCase(),
                            "personalNo"
                          )
                        }
                      />
                      <Popover content="Flag if the text is not clear">
                        <button
                          className={`flag-btn ${
                            flags?.includes("personalNo") ? "active" : ""
                          }`}
                          onClick={() => toggleFlag("personalNo")}
                        >
                          <i className="ri-flag-line"></i>
                        </button>
                      </Popover>
                    </div>
                  </div>
                  {newFields?.length > 0 &&
                    newFields.map((newField, index) => {
                      return (
                        <div className="mb-4" key={index}>
                          <label
                            key={index}
                            contentEditable
                            suppressContentEditableWarning={true}
                            onBlur={(e) =>
                              getData(e.target.innerText, index, "label")
                            }
                          >
                            {newField.label}
                          </label>
                          <div className="d-flex align-items-center gap-3">
                            <input
                              type="text"
                              placeholder="Enter data"
                              value={newField.value}
                              onChange={(e) =>
                                getData(e.target.value, index, "value")
                              }
                            />
                            <button
                              className={`flag-btn`}
                              onClick={() => removeInput(index)}
                            >
                              <i className="ri-delete-bin-6-line"></i>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  <button className="cancel-btn" onClick={addInput}>
                    Add Input
                  </button>
                  <div className="my-4">
                    <label htmlFor="">Fail Image Quality</label>
                    <div className="d-flex align-items-center gap-3">
                      <Select
                        allowClear
                        value={payload?.iqFail}
                        placeholder="Select Reason"
                        className="custom-select w-100"
                        onChange={(value) => getInputValue(value, "iqFail")}
                        options={[
                          {
                            value: "Blurred Data Points to Extract",
                            label: "Blurred Data Points to Extract",
                          },
                          {
                            value: "Glare on Data Points to Extract",
                            label: "Glare on Data Points to Extract",
                          },
                          {
                            value: "Dark Data Points to Extract",
                            label: "Dark Data Points to Extract",
                          },
                          {
                            value: "Covered Data Points to Extract",
                            label: "Covered Data Points to Extract",
                          },
                          {
                            value: "Cut off Data Points to Extract",
                            label: "Cut off Data Points to Extract",
                          },
                          {
                            value: "Damage on Data Points to Extract",
                            label: "Damage on Data Points to Extract",
                          },
                          {
                            value: "Other Issue with Data Points to Extract",
                            label: "Other Issue with Data Points to Extract",
                          },
                          {
                            value: "Missing Front",
                            label: "Missing Front",
                          },
                          {
                            value: "No Document in Image",
                            label: "No Document in Image",
                          },
                          {
                            value: "Two Documents Uploaded",
                            label: "Two Documents Uploaded",
                          },
                        ]}
                      />
                      <button className="flag-btn hidden"></button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <hr />
            <div className="d-flex justify-content-end gap-3">
              {userDetails?.role == "admin" ? (
                <>
                  <Popover content="Send to Analyst">
                    <button
                      className="primary-btn btn-red"
                      onClick={reject}
                      disabled={task?.status == "C"}
                    >
                      <i className="ri-close-circle-line"></i> Reject
                    </button>
                  </Popover>
                  <Popover content="Contact Client">
                    <button
                      className="primary-btn"
                      onClick={approved}
                      disabled={task?.status == "C"}
                    >
                      <i className="ri-checkbox-circle-line"></i> Approve
                    </button>
                  </Popover>
                </>
              ) : (
                <>
                  <button
                    className="secondary-btn"
                    onClick={() => setConfirmReq(true)}
                    disabled={task?.status == "C" || reqApproveDis}
                  >
                    Request Approval
                  </button>
                  <button
                    className="primary-btn"
                    onClick={submit}
                    disabled={task?.status == "C" || !reqApproveDis}
                  >
                    <i className="ri-checkbox-circle-line"></i> Submit
                  </button>
                </>
              )}
            </div>
          </div>
        </LoaderZ>
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
    </div>
  );
}
