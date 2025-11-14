import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { api, setAuthToken, getStoredUser, setStoredUser } from '../../services/apiClient';

const tokenFromStorage =
  typeof window !== 'undefined' ? window.localStorage.getItem('voip_token') : null;

if (tokenFromStorage) {
  setAuthToken(tokenFromStorage);
}

const initialState = {
  user: getStoredUser(),
  token: tokenFromStorage,
  status: 'idle',
  error: null,
};

export const login = createAsyncThunk(
  'auth/login',
  async (credentials, thunkAPI) => {
    try {
      const data = await api.login(credentials);
      return data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message || 'Login failed');
    }
  },
);

export const register = createAsyncThunk(
  'auth/register',
  async (payload, thunkAPI) => {
    try {
      const data = await api.register(payload);
      return data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message || 'Registration failed');
    }
  },
);

export const fetchCurrentUser = createAsyncThunk(
  'auth/fetchCurrentUser',
  async (_, thunkAPI) => {
    try {
      const data = await api.getMe();
      return data.user;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message || 'Unable to fetch user');
    }
  },
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.token = null;
      state.status = 'idle';
      state.error = null;
      setAuthToken(null);
      setStoredUser(null);
    },
  },
  extraReducers: (builder) => {
    builder
      // login
      .addCase(login.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.token = action.payload.token;
        state.user = action.payload.user;
        setAuthToken(action.payload.token);
        setStoredUser(action.payload.user);
      })
      .addCase(login.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || action.error.message;
      })
      // register
      .addCase(register.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.token = action.payload.token;
        state.user = action.payload.user;
        setAuthToken(action.payload.token);
        setStoredUser(action.payload.user);
      })
      .addCase(register.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || action.error.message;
      })
      // fetchCurrentUser
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        if (action.payload) {
          state.user = action.payload;
          setStoredUser(action.payload);
        }
      });
  },
});

export const { logout } = authSlice.actions;

export const selectCurrentUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => Boolean(state.auth.token);
export const selectAuthStatus = (state) => state.auth.status;
export const selectAuthError = (state) => state.auth.error;

export default authSlice.reducer;
