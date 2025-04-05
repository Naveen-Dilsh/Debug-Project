import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { fetchApi } from "../../helper";

//Action
export const fetchNationalities = createAsyncThunk(
  "fetchNationalities",
  async () => {
    let payload = {
      method: "GET",
      url: "/task/nationalities",
    };

    let res = await fetchApi(payload).then((res) => {
      return res.data;
    });
    return res;
  }
);

const nationalitiesSlice = createSlice({
  name: "nationalities",
  initialState: {
    isLoading: false,
    data: null,
    isError: false,
  },
  extraReducers: (builder) => {
    builder.addCase(fetchNationalities.pending, (state, action) => {
      state.isLoading = true;
    });

    builder.addCase(fetchNationalities.fulfilled, (state, action) => {
      state.isLoading = false;
      state.data = action.payload;
    });

    builder.addCase(fetchNationalities.rejected, (state, action) => {
      console.log("Error", action.payload);
      state.isLoading = false;
      state.isError = true;
    });
  },
});

export default nationalitiesSlice.reducer;
