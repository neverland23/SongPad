import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { api } from '../../services/apiClient';

const initialState = {
  logs: [],
  loadingLogs: false,
  calling: false,
  error: null,
};

export const fetchCallLogs = createAsyncThunk(
  'voice/fetchCallLogs',
  async (_, thunkAPI) => {
    try {
      const data = await api.getCallLogs();
      return data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message || 'Failed to load call logs');
    }
  },
);

export const initiateCall = createAsyncThunk(
  'voice/initiateCall',
  async (payload, thunkAPI) => {
    try {
      const data = await api.initiateCall(payload);
      return data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message || 'Failed to initiate call');
    }
  },
);

const voiceSlice = createSlice({
  name: 'voice',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCallLogs.pending, (state) => {
        state.loadingLogs = true;
        state.error = null;
      })
      .addCase(fetchCallLogs.fulfilled, (state, action) => {
        state.loadingLogs = false;
        state.logs = action.payload || [];
      })
      .addCase(fetchCallLogs.rejected, (state, action) => {
        state.loadingLogs = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(initiateCall.pending, (state) => {
        state.calling = true;
        state.error = null;
      })
      .addCase(initiateCall.fulfilled, (state, action) => {
        state.calling = false;
        if (action.payload) {
          state.logs = [action.payload, ...state.logs];
        }
      })
      .addCase(initiateCall.rejected, (state, action) => {
        state.calling = false;
        state.error = action.payload || action.error.message;
      });
  },
});

export const selectCallLogs = (state) => state.voice.logs;
export const selectVoiceError = (state) => state.voice.error;

export default voiceSlice.reducer;
