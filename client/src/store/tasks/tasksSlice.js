import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { fetchApi, convertQueryParams } from "../../helper";

//Action
export const fetchTasks = createAsyncThunk("fetchTasks", async (params) => {
  let query = convertQueryParams(params);

  let payload = {
    method: "get",
    url: `/task?${query}`,
  };

  let res = await fetchApi(payload).then((res) => {
    return res.data;
  });
  return res;
});

const tasksSlice = createSlice({
  name: "tasks",
  initialState: {
    isLoading: false,
    data: null,
    isError: false,
  },
  extraReducers: (builder) => {
    builder.addCase(fetchTasks.pending, (state, action) => {
      state.isLoading = true;
    });

    builder.addCase(fetchTasks.fulfilled, (state, action) => {
      state.isLoading = false;
      state.data = action.payload;
    });

    builder.addCase(fetchTasks.rejected, (state, action) => {
      console.log("Error", action.payload);
      state.isLoading = false;
      state.isError = true;
    });
  },
});

export default tasksSlice.reducer;
