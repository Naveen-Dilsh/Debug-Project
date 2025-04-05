import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { fetchApi } from "../../helper";

//Action
export const fetchDocTypes = createAsyncThunk(
  "fetchDocTypes",
  async (params) => {
    let payload = {
      method: "GET",
      url: `/task/doc-types/${params}`,
    };

    let res = await fetchApi(payload).then((res) => {
      return res.data;
    });
    return res;
  }
);

const docTypesSlice = createSlice({
  name: "docTypes",
  initialState: {
    isLoading: false,
    data: null,
    isError: false,
  },
  extraReducers: (builder) => {
    builder.addCase(fetchDocTypes.pending, (state, action) => {
      state.isLoading = true;
    });

    builder.addCase(fetchDocTypes.fulfilled, (state, action) => {
      state.isLoading = false;
      state.data = action.payload;
    });

    builder.addCase(fetchDocTypes.rejected, (state, action) => {
      console.log("Error", action.payload);
      state.isLoading = false;
      state.isError = true;
    });
  },
});

export default docTypesSlice.reducer;
