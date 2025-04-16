import React from 'react';
import { DEFAULT_IMAGE } from '../../utils/utils';

const WrenChatPopup = ({ 
  togglePopup, 
  isGroupChat, 
  toggleGroupChat, 
  usersData, 
  selectedUsers, 
  handleUserSelect, 
  proceedToGroupCreation 
}) => {
  return (
    <div className="popup-overlay">
      <div className="popup-content">
        <button className="close-button" onClick={togglePopup}>
          <i className="ri-close-line"></i>
        </button>
        <h3>Add to WrenConnect</h3>
        <div className={`new-group ${isGroupChat ? "selected" : ""}`} onClick={toggleGroupChat}>
          New Group Chat
        </div>
        <div className={`new-member ${!isGroupChat ? "selected" : ""}`} onClick={() => isGroupChat && toggleGroupChat()}>
          New Personal Chat
        </div>
        <div className="user-list">
          {usersData.map((user) => {
            const isSelected = selectedUsers.some((selectedUser) => selectedUser.id === user.id);
            return (
              <div key={user.id} className="user-item" onClick={() => handleUserSelect(user)}>
                <img src={user.profilePic || DEFAULT_IMAGE} alt={user.name} className="user-avatar" />
                <div className="user-information">
                  <span className="user-name">{user.name}</span>
                  <span className="user-designation">{user.designation}</span>
                </div>
                {isGroupChat && (
                  <div className="radio-button">
                    <i className={isSelected ? "ri-radio-button-fill" : "ri-radio-button-line"}></i>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {isGroupChat && selectedUsers.length > 0 && (
          <button className="action-button" onClick={proceedToGroupCreation}>
            <i className="ri-arrow-right-circle-fill"></i>
          </button>
        )}
      </div>
    </div>
  );
};

export default WrenChatPopup;