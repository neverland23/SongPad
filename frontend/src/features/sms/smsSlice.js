import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { api } from '../../services/apiClient';

const initialState = {
  contacts: [],
  currentContact: null,
  conversation: [],
  loadingContacts: false,
  loadingConversation: false,
  sending: false,
  error: null,
};

export const fetchContacts = createAsyncThunk(
  'sms/fetchContacts',
  async (_, thunkAPI) => {
    try {
      const data = await api.getContacts();
      return data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message || 'Failed to load contacts');
    }
  },
);

export const fetchConversation = createAsyncThunk(
  'sms/fetchConversation',
  async (contact, thunkAPI) => {
    try {
      const data = await api.getConversation(contact);
      return { contact, messages: data };
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message || 'Failed to load conversation');
    }
  },
);

export const sendSms = createAsyncThunk(
  'sms/sendSms',
  async (payload, thunkAPI) => {
    try {
      const data = await api.sendSms(payload);
      return data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message || 'Failed to send SMS');
    }
  },
);

const smsSlice = createSlice({
  name: 'sms',
  initialState,
  reducers: {
    setCurrentContact(state, action) {
      state.currentContact = action.payload;
      state.conversation = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchContacts.pending, (state) => {
        state.loadingContacts = true;
        state.error = null;
      })
      .addCase(fetchContacts.fulfilled, (state, action) => {
        state.loadingContacts = false;
        state.contacts = action.payload || [];
      })
      .addCase(fetchContacts.rejected, (state, action) => {
        state.loadingContacts = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(fetchConversation.pending, (state) => {
        state.loadingConversation = true;
        state.error = null;
      })
      .addCase(fetchConversation.fulfilled, (state, action) => {
        state.loadingConversation = false;
        if (action.payload && action.payload.contact === state.currentContact) {
          state.conversation = action.payload.messages || [];
        }
      })
      .addCase(fetchConversation.rejected, (state, action) => {
        state.loadingConversation = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(sendSms.pending, (state) => {
        state.sending = true;
        state.error = null;
      })
      .addCase(sendSms.fulfilled, (state, action) => {
        state.sending = false;
        if (action.payload) {
          state.conversation = [...state.conversation, action.payload];
          if (!state.contacts.includes(action.payload.contact)) {
            state.contacts = [action.payload.contact, ...state.contacts];
          }
        }
      })
      .addCase(sendSms.rejected, (state, action) => {
        state.sending = false;
        state.error = action.payload || action.error.message;
      });
  },
});

export const { setCurrentContact } = smsSlice.actions;

export const selectContacts = (state) => state.sms.contacts;
export const selectCurrentContact = (state) => state.sms.currentContact;
export const selectConversation = (state) => state.sms.conversation;
export const selectSmsError = (state) => state.sms.error;

export default smsSlice.reducer;
