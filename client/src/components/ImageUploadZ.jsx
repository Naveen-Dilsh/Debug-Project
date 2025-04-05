import { useRef, useState, useEffect } from "react";

import { sendNotify, fileToBase64 } from "../helper";

export default function ImageUploadZ({
  className,
  image,
  onImageUpload,
  onDeleteFile,
}) {
  const imgUploadRef = useRef();

  const [imgError, setImgError] = useState(false);
  const [imgLoading, setImgLoading] = useState(false);
  const [imgData, setImgData] = useState(null);
  const [imgModal, setImgModal] = useState(false);
  const [imgEdit, setImgEdit] = useState({ zoom: 1, rotate: 0 });

  useEffect(() => {
    if (image) {
      setImgData(image);
    }
  }, [image]);

  const onImgUpload = (e) => {
    setImgError(false);
    let file = e.target.files[0];
    if (file) {
      if (file?.size > 5242880) {
        setImgError(true);
        sendNotify("error", "Image is too big!, Upload below 5MB file.");
      } else {
        let type = file?.name.substring(file?.name.lastIndexOf(".") + 1);
        var regex = new RegExp("(.*?)(png|jpg|jpeg|svg)$");
        if (regex.test(type)) {
          setImgLoading(true);
          fileToBase64(file)
            .then((data) => {
              // console.log(data);
              if (onImageUpload) {
                onImageUpload(data);
              }
              setImgData(data);
              sendNotify("success", "Image uploaded successfully.");
              setImgLoading(false);
            })
            .catch((error) => ({ error: JSON.stringify(error) }));
        } else {
          setImgError(true);
          sendNotify(
            "error",
            "Only PNG, JPG, JPEG, or SVG images are supported."
          );
        }
      }
    }
  };

  const viewImage = () => {
    setImgModal(true);
  };

  const reuploadImage = () => {
    imgUploadRef.current.click();
  };

  const deleteImage = () => {
    setImgData(null);
    if (typeof onDeleteFile != "undefined") {
      onDeleteFile(image?.name);
    }
  };

  function onImageEdit(action) {
    let settings = { ...imgEdit };
    switch (action) {
      case "zoom-in":
        if (settings["zoom"] !== 10) {
          settings["zoom"] += 0.5;
        }
        break;
      case "zoom-out":
        if (settings["zoom"] > 1) {
          settings["zoom"] -= 0.5;
        }
        break;
      case "rotate-left":
        settings["rotate"] -= 15;
        break;
      case "rotate-right":
        settings["rotate"] += 15;
        break;
    }
    setImgEdit(settings);
  }

  return (
    <div
      className={`image-upload-z ${imgData !== null ? "show-preview" : ""} ${
        className ?? ""
      }`}
    >
      <div className="image-upload-z-wrapper">
        <input
          ref={imgUploadRef}
          type="file"
          name="img"
          onChange={onImgUpload}
          accept=".png,.jpg,.jpeg,.svg"
        />
        <span className="icon">
          {imgLoading ? (
            <i className="ri-loader-2-line fa-spin"></i>
          ) : (
            <>
              {imgError ? (
                <i className="ri-close-circle-line color-red"></i>
              ) : (
                <i className="ri-upload-2-line"></i>
              )}
            </>
          )}
        </span>
        <p>
          Size: 260 x 64 px <br /> JPG and PNG formats. Max file size: 5MB
        </p>
      </div>
      <div className="image-upload-z-preview">
        <img src={imgData} alt="" />
        <div className="image-upload-z-action">
          <button onClick={viewImage}>
            <i className="ri-eye-line"></i>
          </button>
          <button onClick={reuploadImage}>
            <i className="ri-edit-line"></i>
          </button>
          <button onClick={deleteImage}>
            <i className="ri-delete-bin-7-line"></i>
          </button>
        </div>
      </div>
      <div
        className={`image-upload-z-preview-modal ${
          imgModal ? "show-modal" : ""
        }`}
      >
        <button className="close-modal-btn" onClick={() => setImgModal(false)}>
          <i className="ri-close-line"></i>
        </button>
        <img
          src={imgData}
          alt=""
          style={{
            transform: `scale(${imgEdit["zoom"]}) rotate(${imgEdit["rotate"]}deg)`,
          }}
        />
        <div className="image-edit-wrapper">
          <button onClick={() => onImageEdit("zoom-in")}>
            <i className="ri-zoom-in-line"></i>
          </button>
          <button onClick={() => onImageEdit("zoom-out")}>
            <i className="ri-zoom-out-line"></i>
          </button>
          <button onClick={() => onImageEdit("rotate-left")}>
            <i className="ri-anticlockwise-2-line"></i>
          </button>
          <button onClick={() => onImageEdit("rotate-right")}>
            <i className="ri-clockwise-line"></i>
          </button>
        </div>
      </div>
    </div>
  );
}
