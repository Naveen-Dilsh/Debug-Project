import { configureStore } from "@reduxjs/toolkit";

import authSlice from "./auth/authSlice";
import themeSlice from "./theme/themeSlice";
import themeColorSlice from "./theme-color/themeColorSlice";

import tasksSlice from "./tasks/tasksSlice";
import profileSlice from "./profile/profileSlice";
import usersSlice from "./users/usersSlice";
import countriesSlice from "./countries/countriesSlice";
import notificationsSlice from "./notifications/notificationsSlice";
import docTypesSlice from "./doc-types/docTypesSlice";
import documentSlice from "./document/documentSlice";
import nationalitiesSlice from "./nationalities/nationalitiesSlice";

export const store = configureStore({
  reducer: {
    auth: authSlice,
    theme: themeSlice,
    themeColor: themeColorSlice,
    tasks: tasksSlice,
    profile: profileSlice,
    user: usersSlice,
    countries: countriesSlice,
    notification: notificationsSlice,
    docTypes: docTypesSlice,
    document: documentSlice,
    nationalities: nationalitiesSlice,
  },
});
