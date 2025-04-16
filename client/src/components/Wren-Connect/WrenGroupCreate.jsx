import React from 'react';
import { createGroup } from '../../services/wrenGroupAPI';
import { DEFAULT_IMAGE } from '../../utils/utils';

const WrenGroupCreationPopup = ({
  closePopup,
  groupName,
  setGroupName,
  groupImage,
  setGroupImage,
  selectedUsers,
  setMessageData,
  setSelectedChat,
  setShowGroupCreationPopup,
  setSelectedUsers
}) => {
  const handleGroupCreation = () => {
    createGroup({
      groupName,
      groupImage,
      selectedUsers,
      setMessageData,
      setSelectedChat,
      setShowGroupCreationPopup,
      setGroupName,
      setGroupImage,
      setSelectedUsers
    });
  };

  return (
    <div className="group-popup-overlay">
      <div className="group-popup-content">
        <button className="group-close-button" onClick={closePopup}>
          <i className="ri-close-line"></i>
        </button>
        <h3 className="group-popup-title">Creating New Group</h3>
        <div className="group-icon-selection">
          <img src={groupImage || DEFAULT_IMAGE} alt="Group Icon" className="group-icon-image" />
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              if (e.target.files[0]) {
                setGroupImage(URL.createObjectURL(e.target.files[0]));
              }
            }}
            className="group-icon-input"
          />
          <span className="group-icon-placeholder">ADD GROUP ICON</span>
        </div>
        <input
          type="text"
          placeholder="Add a Group Name"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          className="group-subject-input"
        />
        <button className="group-create-button" onClick={handleGroupCreation}>
          <i className="ri-check-line"></i>
        </button>
      </div>
    </div>
  );
};

export default WrenGroupCreationPopup;