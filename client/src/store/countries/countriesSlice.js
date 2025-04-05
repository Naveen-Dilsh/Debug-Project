import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { fetchApi } from "../../helper";

//Action
export const fetchCountries = createAsyncThunk("fetchCountries", async () => {
  let payload = {
    method: "GET",
    url: "/task/countries",
  };

  let res = await fetchApi(payload).then((res) => {
    return res.data;
  });
  return res;
});

const countriesSlice = createSlice({
  name: "countries",
  initialState: {
    isLoading: false,
    data: null,
    isError: false,
  },
  extraReducers: (builder) => {
    builder.addCase(fetchCountries.pending, (state, action) => {
      state.isLoading = true;
    });

    builder.addCase(fetchCountries.fulfilled, (state, action) => {
      state.isLoading = false;
      state.data = action.payload;
    });

    builder.addCase(fetchCountries.rejected, (state, action) => {
      console.log("Error", action.payload);
      state.isLoading = false;
      state.isError = true;
    });
  },
});

export default countriesSlice.reducer;
