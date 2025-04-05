import React, { useEffect, useState } from "react";
import SingleGroupChat from "./SingleGroupChat";

const ChatBoxContainer = ({ title, messageData, type, onChatSelect, searchTerm }) => {
  // Add state to track current user
  const [hasUser, setHasUser] = useState(false);
  
  // Check if current user exists when component mounts
  useEffect(() => {
    try {
      const userData = localStorage.getItem(process.env.REACT_APP_CURRENT_USER);
      if (userData) {
        const parsedUser = JSON.parse(userData);
        // Check if the user object has expected properties
        if (parsedUser && parsedUser.firstName && parsedUser.lastName) {
          setHasUser(true);
          console.log("Current user exists:", parsedUser);
        } else {
          console.log("Current user data is incomplete or missing");
          setHasUser(false);
        }
      } else {
        console.log("No user data found in localStorage");
        setHasUser(false);
      }
    } catch (error) {
      console.error("Error checking current user:", error);
      setHasUser(false);
    }
  }, []);

  function getMessageText(message) {
    try {
      const currentUser = JSON.parse(
        localStorage.getItem(process.env.REACT_APP_CURRENT_USER)
      );
      
      if (
        currentUser &&
        message ===
        "Welcome to the group!\ncreated by " +
          currentUser.firstName +
          " " +
          currentUser.lastName
      ) {
        return "Welcome to the group! Created by you";
      } else {
        return message;
      }
    } catch (error) {
      console.error("Error parsing user in getMessageText:", error);
      return message;
    }
  }

  // Filter chats by type and search term
  const filteredChats = messageData
    .filter((chat) => chat.type === type)
    .filter((chat) =>
      chat.groupName.toLowerCase().includes(searchTerm.toLowerCase())
    );

  if (filteredChats.length === 0) {
    return null;
  }

  return (
    <div className="group-list">
      <h2 className="card-title">{title}</h2>
      {/* Optionally display user status */}
      {hasUser ? (
        <p className="user-status text-success">User is logged in</p>
      ) : (
        <p className="user-status text-danger">No user data available</p>
      )}
      {filteredChats.map((chat, index) => (
        <div key={index} onClick={() => onChatSelect(chat)}>
          <SingleGroupChat
            chatId={chat.id}
            imageURL={chat.imageURL}
            groupName={chat.groupName}
            lastMessage={getMessageText(chat.lastMessage) || ""}
            dateTime={chat.dateTime || ""}
            unreadMessages={chat.unreadMessages || 0}
          />
        </div>
      ))}
    </div>
  );
};

export default ChatBoxContainer;