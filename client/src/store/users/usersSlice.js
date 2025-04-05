import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { fetchApi, convertQueryParams } from "../../helper";

//Action
export const fetchUser = createAsyncThunk("fetchUser", async (params) => {
  let query = convertQueryParams(params);

  let payload = {
    method: "GET",
    url: `/auth/user?${query}`,
  };

  let res = await fetchApi(payload).then((res) => {
    return res.data;
  });
  return res;
});

const userSlice = createSlice({
  name: "user",
  initialState: {
    isLoading: false,
    data: null,
    isError: false,
  },
  extraReducers: (builder) => {
    builder.addCase(fetchUser.pending, (state, action) => {
      state.isLoading = true;
    });

    builder.addCase(fetchUser.fulfilled, (state, action) => {
      state.isLoading = false;
      state.data = action.payload;
    });

    builder.addCase(fetchUser.rejected, (state, action) => {
      console.log("Error", action.payload);
      state.isLoading = false;
      state.isError = true;
    });
  },
});

export default userSlice.reducer;
