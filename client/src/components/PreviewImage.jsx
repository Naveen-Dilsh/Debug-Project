import { useState, useEffect } from "react";

export default function PreviewImage({ image, showPreview, onClose }) {
  const [imgData, setImgData] = useState(null);
  const [imgModal, setImgModal] = useState(false);
  const [imgEdit, setImgEdit] = useState({ zoom: 1, rotate: 0 });

  useEffect(() => {
    if (image) {
      setImgData(image);
    }
  }, [image]);

  useEffect(() => {
    setImgModal(showPreview ?? false);
  }, [showPreview]);

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

  function handleClose() {
    setImgModal(false);
    if (onClose !== undefined) {
      onClose();
    }
  }

  return (
    <div className="image-preview">
      <div
        className={`image-upload-z-preview-modal ${
          imgModal ? "show-modal" : ""
        }`}
      >
        <button className="close-modal-btn" onClick={handleClose}>
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
