// Import default image
import Default from "../assets/img/default_dp.png";

// Export constants
export const DEFAULT_IMAGE = Default;

// API endpoints
export const API_ENDPOINTS = {
  USERS: "/auth/user",
  GROUPS: "/chat/groups",
  GROUP_MESSAGES: "/chat/getgroup/messages",
  CREATE_GROUP: "/chat/initgroup",
  UPLOAD_GROUP_ICON: "/chat/uploadGroupIcon",
};

// Local storage keys
export const STORAGE_KEYS = {
  CURRENT_USER: process.env.REACT_APP_CURRENT_USER,
  CURRENT_USER_ID: "CURRUNT_USER_ID",
  LAST_READ_TIMESTAMPS: "lastReadTimestamps",
};

// User types
export const USER_TYPES = {
  ANALYST: "analyst",
  CLIENT: "client",
  GROUP: "groups",
};

// Message types
export const MESSAGE_TYPES = {
  TEXT: "text",
  IMAGE: "image",
  FILE: "file",
  AUDIO: "audio",
};