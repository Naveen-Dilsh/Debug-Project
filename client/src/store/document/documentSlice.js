import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { fetchApi, convertQueryParams } from "../../helper";

//Action
export const fetchDocument = createAsyncThunk(
  "fetchDocument",
  async (params) => {
    let query = convertQueryParams(params);

    let payload = {
      method: "GET",
      url: `/document?${query}`,
    };

    let res = await fetchApi(payload).then((res) => {
      return res.data;
    });
    return res;
  }
);

const documentSlice = createSlice({
  name: "document",
  initialState: {
    isLoading: false,
    data: null,
    isError: false,
  },
  extraReducers: (builder) => {
    builder.addCase(fetchDocument.pending, (state, action) => {
      state.isLoading = true;
    });

    builder.addCase(fetchDocument.fulfilled, (state, action) => {
      state.isLoading = false;
      state.data = action.payload;
    });

    builder.addCase(fetchDocument.rejected, (state, action) => {
      console.log("Error", action.payload);
      state.isLoading = false;
      state.isError = true;
    });
  },
});

export default documentSlice.reducer;
