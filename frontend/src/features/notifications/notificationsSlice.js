import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { api } from '../../services/apiClient';

const initialState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchNotifications = createAsyncThunk(
  'notifications/fetch',
  async (params = {}, thunkAPI) => {
    try {
      const data = await api.getNotifications(params);
      return data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message || 'Failed to load notifications');
    }
  },
);

export const markNotificationRead = createAsyncThunk(
  'notifications/markRead',
  async (id, thunkAPI) => {
    try {
      const data = await api.markNotificationRead(id);
      return data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message || 'Failed to mark notification as read');
    }
  },
);

export const markAllNotificationsRead = createAsyncThunk(
  'notifications/markAllRead',
  async (_, thunkAPI) => {
    try {
      await api.markAllNotificationsRead();
      // Refetch notifications after marking all as read
      thunkAPI.dispatch(fetchNotifications());
      return true;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message || 'Failed to mark all notifications as read');
    }
  },
);

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload || [];
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(markNotificationRead.fulfilled, (state, action) => {
        const updated = action.payload;
        const idx = state.items.findIndex((n) => n._id === updated._id);
        if (idx >= 0) {
          state.items[idx] = updated;
        }
      })
      .addCase(markAllNotificationsRead.fulfilled, (state) => {
        // Mark all items as read in state
        state.items = state.items.map((n) => ({ ...n, read: true }));
      });
  },
});

export const selectNotifications = (state) => state.notifications.items;
export const selectUnreadCount = (state) =>
  state.notifications.items.filter((n) => !n.read).length;

export default notificationsSlice.reducer;
