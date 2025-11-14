import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import numbersReducer from '../features/numbers/numbersSlice';
import voiceReducer from '../features/voice/voiceSlice';
import smsReducer from '../features/sms/smsSlice';
import notificationsReducer from '../features/notifications/notificationsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    numbers: numbersReducer,
    voice: voiceReducer,
    sms: smsReducer,
    notifications: notificationsReducer,
  },
});

export default store;
