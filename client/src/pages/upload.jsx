import React, { useState, useEffect, useRef } from "react";
import Webcam from "react-webcam";
import { Switch } from "antd";

import { fetchApi, sendNotify, fileToBase64, formatBytes } from "../helper";

import PreviewImage from "../components/PreviewImage";

import Icon01 from "../assets/img/guidelines-01.svg";
import Icon02 from "../assets/img/guidelines-02.svg";
import Icon03 from "../assets/img/guidelines-03.svg";
import Icon04 from "../assets/img/guidelines-04.svg";
import Icon05 from "../assets/img/guidelines-05.svg";

export default function Upload() {
  const webcamRef = useRef(null);
  const uploaderRef = useRef(null);

  const [steps, setSteps] = useState(1);

  const [userPhoto, setUserPhoto] = useState(null);
  const [documents, setDocuments] = useState({});
  const [loadingObj, setLoadingObj] = useState({});
  const [errorObj, setErrorObj] = useState({});

  const [showWebcam, setShowWebcam] = useState(false);
  const [webcamAccess, setWebcamAccess] = useState(true);

  const [loading, setLoading] = useState(false);

  const [previewImg, setPreviewImg] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  const [webcamStatus, setWebcamStatus] = useState(true);

  const videoVertical = {
    width: 400,
    height: 600,
    facingMode: "user",
  };

  const toggleWebcam = (checked) => {
    setWebcamStatus(checked);
  };

  const checkWebcam = () => {
    var facingMode = "user";
    var constraints = {
      audio: false,
      video: {
        facingMode: facingMode,
      },
    };

    window.navigator.mediaDevices
      .getUserMedia(constraints)
      .then(function success(stream) {
        setWebcamAccess(true);
        console.log("Granted");
      })
      .catch(function (e) {
        setWebcamAccess(false);
        console.log("Dental");
      });
  };

  const getWebcam = () => {
    setShowWebcam(true);
    checkWebcam();
  };

  const validator = async (data, endPoint, key) => {
    let error = { ...errorObj };
    let payload = {
      method: "post",
      url: `/task/${endPoint}`,
      data,
    };
    let result = await fetchApi(payload);
    if (result?.error) {
      error[key] = result?.error?.response?.data?.message;
      setErrorObj(error);
      return false;
    } else {
      error[key] = false;
      setErrorObj(error);
      return true;
    }
  };

  const capturePhoto = () => {
    let loading = { ...loadingObj };

    const imageSrc = webcamRef.current.getScreenshot();
    // console.log(imageSrc);
    loading["photo"] = true;
    setLoadingObj(loading);

    validator({ photo: imageSrc }, "validate-photo", "photo")
      .then((response) => {
        loading["photo"] = false;
        setLoadingObj(loading);
        if (response) {
          setUserPhoto(imageSrc);
        }
      })
      .catch((error) => ({ error: JSON.stringify(error) }));

    setShowWebcam(false);
  };

  const onFileUpload = (e, key) => {
    let files = { ...documents };
    let loading = { ...loadingObj };
    let error = { ...errorObj };
    let obj = {};
    let file = e.target.files[0];
    if (file) {
      if (file?.size < 5242880) {
        let type = file?.name.substring(file?.name.lastIndexOf(".") + 1);
        var regex = new RegExp("(.*?)(png|jpg|jpeg|svg)$");
        if (regex.test(type)) {
          // let fileUrl = URL.createObjectURL(file)
          loading[key] = true;
          setLoadingObj(loading);
          fileToBase64(file).then((data) => {
            // console.log(data);
            obj["name"] = file?.name;
            obj["size"] = file?.size;
            obj["type"] = type;
            obj["src"] = data;

            validator({ document: data }, "validate-document", key)
              .then((response) => {
                loading[key] = false;
                setLoadingObj(loading);
                obj["src"] = data;
                files[key] = obj;
                setDocuments(files);
              })
              .catch((error) => ({ error: JSON.stringify(error) }));
          });
        } else {
          error[key] =
            "Invalid file type. Allowed types are JPG, PNG, and PDF.";
          setErrorObj(error);
        }
      } else {
        error[key] = "File size too large. Maximum allowed size is 5MB.";
        setErrorObj(error);
      }
    }
  };

  const handlePreview = (key) => {
    let img = "";
    switch (key) {
      case "photo":
        img = userPhoto;
        break;
      case "doc-front":
        img = documents[key].src;
        break;
      case "doc-back":
        img = documents[key].src;
        break;
    }
    console.log(img);

    setPreviewImg(img);
    setShowPreview(true);
  };

  const handleClose = () => {
    setPreviewImg(null);
    setShowPreview(false);
  };

  const removeDocument = (key) => {
    let files = { ...documents };
    delete files[key];
    setDocuments(files);
  };

  const submitDocuments = () => {
    let error = { ...errorObj };
    setLoading(true);
    if (
      webcamStatus
        ? userPhoto
        : true && documents["doc-front"] && documents["doc-back"]
    ) {
      let payload = {
        method: "post",
        url: "/task/submit-documents",
        data: {
          docFront: documents["doc-front"]["src"],
          docBack: documents["doc-back"]["src"],
        },
      };
      if (webcamStatus) {
        payload["data"]["photo"] = userPhoto;
      }
      fetchApi(payload)
        .then((res) => {
          setLoading(false);
          resetDocuments(false);
          setSteps(1);
          if (!res.error) {
            console.log(res);
            sendNotify("success", "Document submitted successfully.");
          }
        })
        .catch((error) => ({ error: JSON.stringify(error) }));
    } else {
      if (!userPhoto && webcamStatus) {
        error["photo"] = "Please capture a photo of yourself.";
      }
      if (!documents["doc-front"]) {
        error["doc-front"] = "Please upload the front side of your document.";
      }
      if (!documents["doc-back"]) {
        error["doc-back"] = "Please upload the back side of your document.";
      }
      setErrorObj(error);
      setLoading(false);
    }
  };

  const resetDocuments = () => {
    setUserPhoto(null);
    setDocuments({});
    setLoadingObj({});
    setErrorObj({});
  };

  const handleNextBack = (key) => {
    let step = steps;
    if (key == "next") {
      step++;
    } else {
      step--;
    }
    setSteps(step);
  };

  return (
    <div className="upload-doc">
      <div className="px-4 py-4 py-md-0 px-md-5 mx-md-5">
        <div className="d-block d-md-none">
          <h6 className="steps-text">Step 1 of 3</h6>
          <div className="steps-wrapper">
            <span className={steps >= 2 ? "completed" : ""}></span>
            <span className={steps >= 3 ? "completed" : ""}></span>
            <span className={steps >= 4 ? "completed" : ""}></span>
          </div>
        </div>
        <div
          className={`${
            steps == 1 ? "d-flex" : "d-none"
          } d-md-flex justify-content-between custom-border-bottom flex-column flex-md-row py-4 py-md-5`}
        >
          <div className="mb-3 mb-md-0">
            <div className="d-flex gap-2">
              <h5>Live Photo</h5>

              <Switch
                className="custom-switch active-green"
                defaultChecked
                onChange={toggleWebcam}
              />
            </div>
            <p>Capture a clear photo of yourself to verify the Identity.</p>
            {webcamStatus && (
              <ul>
                <li>
                  <span></span>
                  <h6>Guidelines:</h6>
                </li>
                <li>
                  <span>
                    <img src={Icon01} alt="" />
                  </span>
                  Use balanced lighting to avoid shadows and ensure clear facial
                  details.
                </li>
                <li>
                  <span>
                    <img className="small" src={Icon02} alt="" />
                  </span>
                  Center the face in the frame, ensuring the forehead, chin, and
                  ears are fully visible.
                </li>
                <li>
                  <span>
                    <img src={Icon03} alt="" />
                  </span>
                  Maintain a neutral expression with eyes open and mouth closed.
                </li>
                <li>
                  <span>
                    <img src={Icon04} alt="" />
                  </span>
                  Position the camera at eye level and maintain proper distance
                  for clarity.
                </li>
                <li>
                  <span>
                    <img src={Icon05} alt="" />
                  </span>
                  Remove any obstructions like glasses, hats, or hair covering
                  key features.
                </li>
              </ul>
            )}
          </div>
          {webcamStatus && (
            <div>
              <div
                className={`uploader photo-upload ${
                  errorObj["photo"] ? "upload-error" : ""
                } ${loadingObj["photo"] ? "upload-loading" : ""}`}
              >
                {userPhoto ? (
                  <div>
                    <img
                      className="user-photo"
                      src={userPhoto}
                      onClick={() => handlePreview("photo")}
                      title="Click to preview"
                      alt=""
                    />
                    <button className="recapture-btn" onClick={getWebcam}>
                      <i className="ri-crosshair-2-line"></i>
                    </button>
                  </div>
                ) : (
                  <div className="upload-wrapper ms-auto" onClick={getWebcam}>
                    <div>
                      <div className="upload-icon">
                        <i
                          className={`d-block d-md-none ${
                            loadingObj["photo"]
                              ? "ri-loader-2-line icon-spin-ani"
                              : "ri-camera-line"
                          }`}
                        ></i>
                        <i
                          className={`d-none d-md-block ${
                            loadingObj["photo"]
                              ? "ri-loader-2-line icon-spin-ani"
                              : "ri-crosshair-2-line"
                          }`}
                        ></i>
                      </div>
                      <h6 className="d-block d-md-none">Tap To Take A Photo</h6>
                      <p>
                        Previously taken photos or uploads are not supported in
                        this step.
                      </p>
                    </div>
                  </div>
                )}
              </div>
              {errorObj["photo"] && (
                <p className="error-text">{errorObj["photo"]}</p>
              )}
            </div>
          )}
        </div>
        <div
          className={`${
            steps == 2 ? "d-flex" : "d-none"
          } d-md-flex justify-content-between custom-border-bottom flex-column flex-md-row py-4 py-md-5`}
        >
          <div className="mb-3 mb-md-0">
            <h5>Document Front</h5>
            <p>
              Upload a clear image of the front side of your document. <br />
              (For Passports, upload the Bio Page)
            </p>
          </div>
          <div>
            <div
              className={`uploader doc-upload ${
                errorObj["doc-front"] ? "upload-error" : ""
              } ${loadingObj["doc-front"] ? "upload-loading" : ""}`}
            >
              {documents["doc-front"] ? (
                <div className="uploaded-file">
                  <span className="file-icon">
                    <i className="ri-file-3-fill"></i>
                  </span>
                  <div className="w-100">
                    <h6 onClick={() => handlePreview("doc-front")}>
                      {documents["doc-front"]?.name}
                    </h6>
                    <p>{formatBytes(documents["doc-front"]?.size, 2)}</p>
                  </div>
                  <div
                    className="remove-btn"
                    onClick={() => removeDocument("doc-front")}
                  >
                    <i className="ri-close-line"></i>
                  </div>
                </div>
              ) : (
                <div className="upload-wrapper py-5 ms-auto">
                  <input
                    type="file"
                    accept="image/*"
                    name="doc-front"
                    ref={uploaderRef}
                    onChange={(e) => onFileUpload(e, "doc-front")}
                    draggable
                  />
                  <div>
                    <div className="upload-icon">
                      <i
                        className={
                          loadingObj["doc-front"]
                            ? "ri-loader-2-line icon-spin-ani"
                            : "ri-upload-2-line"
                        }
                      ></i>
                    </div>
                    <p>JPG and PNG formats. Max file size: 5MB</p>
                  </div>
                </div>
              )}
            </div>
            {errorObj["doc-front"] && (
              <p className="error-text">{errorObj["doc-front"]}</p>
            )}
          </div>
        </div>
        <div
          className={`${
            steps >= 3 ? "d-flex" : "d-none"
          } d-md-flex justify-content-between custom-border-bottom flex-column flex-md-row py-4 py-md-5`}
        >
          <div className="mb-3 mb-md-0">
            <h5>Document Back</h5>
            <p>
              Upload a clear image of the back side of your document. <br />
              (For Passports, upload the Overleaf Page)
            </p>
          </div>
          <div>
            <div
              className={`uploader doc-upload ${
                errorObj["doc-back"] ? "upload-error" : ""
              } ${loadingObj["doc-back"] ? "upload-loading" : ""}`}
            >
              {documents["doc-back"] ? (
                <div className="uploaded-file">
                  <span className="file-icon">
                    <i className="ri-file-3-fill"></i>
                  </span>
                  <div className="w-100">
                    <h6 onClick={() => handlePreview("doc-back")}>
                      {documents["doc-back"]?.name}
                    </h6>
                    <p>{formatBytes(documents["doc-back"]?.size, 2)}</p>
                  </div>
                  <div
                    className="remove-btn"
                    onClick={() => removeDocument("doc-back")}
                  >
                    <i className="ri-close-line"></i>
                  </div>
                </div>
              ) : (
                <div className="upload-wrapper py-5 ms-auto">
                  <input
                    type="file"
                    accept="image/*"
                    name="doc-back"
                    ref={uploaderRef}
                    onChange={(e) => onFileUpload(e, "doc-back")}
                    draggable
                  />
                  <div>
                    <div className="upload-icon">
                      <i
                        className={
                          loadingObj["doc-back"]
                            ? "ri-loader-2-line icon-spin-ani"
                            : "ri-upload-2-line"
                        }
                      ></i>
                    </div>
                    <p>JPG and PNG formats. Max file size: 5MB</p>
                  </div>
                </div>
              )}
            </div>
            {errorObj["doc-back"] && (
              <p className="error-text">{errorObj["doc-back"]}</p>
            )}
          </div>
        </div>
        <div className="d-none d-md-block">
          <div className="d-flex justify-content-between align-item-center py-5">
            <button className="secondary-btn" onClick={resetDocuments}>
              Reset
            </button>
            <button
              className="primary-btn"
              onClick={submitDocuments}
              disabled={loading}
            >
              <i
                className={
                  loading ? "ri-loader-2-line icon-spin-ani" : "d-none"
                }
              ></i>
              Submit
            </button>
          </div>
        </div>
        <div className="d-block d-md-none mt-4">
          <button
            className="secondary-btn justify-content-center py-3 w-100 mb-3"
            onClick={() => handleNextBack("back")}
          >
            Back
          </button>
          <button
            className="primary-btn justify-content-center py-3 w-100"
            onClick={
              steps == 3 ? submitDocuments : () => handleNextBack("next")
            }
            disabled={
              (steps == 1 && !userPhoto) ||
              (steps == 2 && !documents["doc-front"]) ||
              (steps == 3 && !documents["doc-back"]) ||
              loading
            }
          >
            <i
              className={loading ? "ri-loader-2-line icon-spin-ani" : "d-none"}
            ></i>
            {steps == 3 ? "Submit" : "Next"}
          </button>
        </div>
      </div>
      <div className={`webcam-wrapper ${showWebcam ? "show" : ""}`}>
        <div className="webcam-card">
          <button className="close-btn" onClick={() => setShowWebcam(false)}>
            <i className="ri-close-line"></i>
          </button>
          {webcamAccess ? (
            <div className="webcam-stream">
              <p className="note-text">Position your face in the frame</p>
              <div className="safe-line-wrapper">
                <span className="safe-line"></span>
                <span className="safe-line"></span>
                <span className="safe-line"></span>
                <span className="safe-line"></span>
              </div>
              {showWebcam && (
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  mirrored={true}
                  screenshotQuality={1}
                  imageSmoothing={true}
                  videoConstraints={videoVertical}
                  screenshotFormat="image/jpeg"
                />
              )}
              <button className="take-photo-btn" onClick={capturePhoto}>
                <i className="ri-fullscreen-line"></i>
              </button>
            </div>
          ) : (
            <div className="webcam-denied">
              <span>
                <i className="ri-eye-close-line"></i>
              </span>
              <h6>Access to the webcam was denied.</h6>
              <p>Please allow camera access in your browser settings.</p>
              <button onClick={checkWebcam}>Try Again</button>
            </div>
          )}
        </div>
      </div>
      <PreviewImage
        image={previewImg}
        showPreview={showPreview}
        onClose={handleClose}
      />
    </div>
  );
}
