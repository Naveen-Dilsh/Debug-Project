import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { fetchApi, convertQueryParams } from "../../helper";

//Action
export const fetchProfile = createAsyncThunk("fetchProfile", async () => {
  let payload = {
    method: "GET",
    url: "/auth/profile",
  };

  let res = await fetchApi(payload).then((res) => {
    return res.data;
  });
  return res;
});

const profileSlice = createSlice({
  name: "profile",
  initialState: {
    isLoading: false,
    data: null,
    isError: false,
  },
  extraReducers: (builder) => {
    builder.addCase(fetchProfile.pending, (state, action) => {
      state.isLoading = true;
    });

    builder.addCase(fetchProfile.fulfilled, (state, action) => {
      state.isLoading = false;
      state.data = action.payload;
    });

    builder.addCase(fetchProfile.rejected, (state, action) => {
      console.log("Error", action.payload);
      state.isLoading = false;
      state.isError = true;
    });
  },
});

export default profileSlice.reducer;
