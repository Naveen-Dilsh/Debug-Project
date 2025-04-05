import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { fetchApi, convertQueryParams } from "../../helper";

//Action
export const fetchNotifications = createAsyncThunk(
  "fetchNotifications",
  async (params) => {
    let query = convertQueryParams(params);

    let payload = {
      method: "GET",
      url: `/notification?${query}`,
    };

    let res = await fetchApi(payload).then((res) => {
      return res.data;
    });
    return res;
  }
);

const notificationsSlice = createSlice({
  name: "notification",
  initialState: {
    isLoading: false,
    data: null,
    isError: false,
  },
  extraReducers: (builder) => {
    builder.addCase(fetchNotifications.pending, (state, action) => {
      state.isLoading = true;
    });

    builder.addCase(fetchNotifications.fulfilled, (state, action) => {
      state.isLoading = false;
      state.data = action.payload;
    });

    builder.addCase(fetchNotifications.rejected, (state, action) => {
      console.log("Error", action.payload);
      state.isLoading = false;
      state.isError = true;
    });
  },
});

export default notificationsSlice.reducer;
