import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { api } from '../../services/apiClient';

const initialState = {
  countries: [],
  availableNumbers: [],
  myNumbers: [],
  loadingCountries: false,
  loadingAvailable: false,
  loadingMyNumbers: false,
  ordering: false,
  error: null,
};

export const fetchCountries = createAsyncThunk(
  'numbers/fetchCountries',
  async (_, thunkAPI) => {
    try {
      const data = await api.getCountries();
      return data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message || 'Failed to load countries');
    }
  },
);

export const searchNumbers = createAsyncThunk(
  'numbers/searchNumbers',
  async (countryCode, thunkAPI) => {
    try {
      const data = await api.searchNumbers({ countryCode });
      return data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message || 'Failed to search numbers');
    }
  },
);

export const fetchMyNumbers = createAsyncThunk(
  'numbers/fetchMyNumbers',
  async (_, thunkAPI) => {
    try {
      const data = await api.getMyNumbers();
      return data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message || 'Failed to load your numbers');
    }
  },
);

export const orderNumber = createAsyncThunk(
  'numbers/orderNumber',
  async (payload, thunkAPI) => {
    try {
      const data = await api.orderNumber(payload);
      return data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message || 'Failed to order number');
    }
  },
);

const numbersSlice = createSlice({
  name: 'numbers',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // countries
      .addCase(fetchCountries.pending, (state) => {
        state.loadingCountries = true;
        state.error = null;
      })
      .addCase(fetchCountries.fulfilled, (state, action) => {
        state.loadingCountries = false;
        state.countries = action.payload || [];
      })
      .addCase(fetchCountries.rejected, (state, action) => {
        state.loadingCountries = false;
        state.error = action.payload || action.error.message;
      })
      // search numbers
      .addCase(searchNumbers.pending, (state) => {
        state.loadingAvailable = true;
        state.error = null;
      })
      .addCase(searchNumbers.fulfilled, (state, action) => {
        state.loadingAvailable = false;
        state.availableNumbers = action.payload || [];
      })
      .addCase(searchNumbers.rejected, (state, action) => {
        state.loadingAvailable = false;
        state.error = action.payload || action.error.message;
      })
      // my numbers
      .addCase(fetchMyNumbers.pending, (state) => {
        state.loadingMyNumbers = true;
        state.error = null;
      })
      .addCase(fetchMyNumbers.fulfilled, (state, action) => {
        state.loadingMyNumbers = false;
        state.myNumbers = action.payload || [];
      })
      .addCase(fetchMyNumbers.rejected, (state, action) => {
        state.loadingMyNumbers = false;
        state.error = action.payload || action.error.message;
      })
      // order number
      .addCase(orderNumber.pending, (state) => {
        state.ordering = true;
        state.error = null;
      })
      .addCase(orderNumber.fulfilled, (state, action) => {
        state.ordering = false;
        // push new number into myNumbers list
        if (action.payload) {
          state.myNumbers = [action.payload, ...state.myNumbers];
        }
      })
      .addCase(orderNumber.rejected, (state, action) => {
        state.ordering = false;
        state.error = action.payload || action.error.message;
      });
  },
});

export const selectCountries = (state) => state.numbers.countries;
export const selectAvailableNumbers = (state) => state.numbers.availableNumbers;
export const selectMyNumbers = (state) => state.numbers.myNumbers;
export const selectNumbersError = (state) => state.numbers.error;

export default numbersSlice.reducer;
