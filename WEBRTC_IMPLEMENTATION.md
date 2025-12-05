# WebRTC + Call Control v2 Implementation Guide

## Overview

This implementation provides a complete WebRTC voice calling system with Telnyx Call Control v2, including:
- Real-time WebSocket communication
- Inbound/outbound call handling
- WebRTC media integration (requires @telnyx/webrtc SDK)
- Enhanced dialer UI with call controls

## Backend Implementation

### 1. WebSocket Server
- **File**: `backend/src/config/websocketServer.js`
- **Purpose**: Real-time event broadcasting for inbound calls and SMS
- **Port**: Uses the same HTTP server (no separate port needed)
- **Path**: `/ws`

### 2. Call Control v2 Endpoints
- **File**: `backend/src/controllers/voiceController.js`
- **Routes**: `backend/src/routes/voiceRoutes.js`

**Available Endpoints:**
- `POST /api/voice/calls/outbound` - Initiate outbound call
- `POST /api/voice/calls/:callControlId/answer` - Answer inbound call
- `POST /api/voice/calls/:callControlId/connect-webrtc` - Connect call to WebRTC
- `POST /api/voice/calls/:callControlId/hangup` - Hangup call
- `POST /api/voice/calls/:callControlId/dtmf` - Send DTMF tones

### 3. Webhook Handler
- **File**: `backend/src/controllers/voiceController.js`
- **Route**: `POST /webhooks/voice`
- **Features**:
  - Handles Call Control v2 events (call.initiated, call.ringing, call.answered, call.hangup)
  - Broadcasts events via WebSocket
  - Updates call logs in database

### 4. Environment Variables

Add to `backend/.env`:
```env
TELNYX_API_KEY=your_api_key
TELNYX_CONNECTION_ID=your_connection_id
TELNYX_WEBRTC_USERNAME=your_webrtc_username
TELNYX_WEBRTC_PASSWORD=your_webrtc_password
PORT=3000
BACKEND_URL=http://localhost:3000  # For webhook URLs
```

## Frontend Implementation

### 1. WebSocket Hook
- **File**: `frontend/src/hooks/useWebSocket.js`
- **Purpose**: Manages WebSocket connection and message handling
- **Usage**: Automatically connects when user is logged in

### 2. WebRTC Hook
- **File**: `frontend/src/hooks/useWebRTC.js`
- **Purpose**: Manages call state and Call Control v2 API calls
- **Note**: Full WebRTC media requires @telnyx/webrtc SDK (see below)

### 3. Components
- **IncomingCallPopup**: `frontend/src/components/voice/IncomingCallPopup.jsx`
  - Displays incoming call notification
  - Accept/Decline buttons

- **VoicePage**: `frontend/src/pages/dashboard/VoicePage.jsx`
  - Enhanced dialer with call controls
  - Call duration timer
  - Mute/unmute functionality
  - DTMF keypad during active calls

### 4. API Client Updates
- **File**: `frontend/src/services/apiClient.js`
- **New Methods**:
  - `initiateOutboundCall()`
  - `answerCall()`
  - `connectWebRTC()`
  - `hangupCall()`
  - `sendDTMF()`

## Installation Steps

### Backend Dependencies
```bash
cd backend
npm install ws
```

### Frontend Dependencies (Optional - for full WebRTC media)
```bash
cd frontend
npm install @telnyx/webrtc
```

**Note**: The current implementation works with Call Control v2 API calls. For full WebRTC media (audio/video), you need to:
1. Install `@telnyx/webrtc` package
2. Update `frontend/src/components/voice/WebRTCClient.jsx` to use the actual SDK
3. Integrate the WebRTC client with the `useWebRTC` hook

## WebRTC SDK Integration (Optional)

To enable full WebRTC media support:

1. **Install the SDK**:
   ```bash
   cd frontend
   npm install @telnyx/webrtc
   ```

2. **Update WebRTCClient.jsx**:
   ```javascript
   import { Client } from '@telnyx/webrtc';
   
   // Replace the placeholder with actual SDK usage
   const client = new Client({
     login: username,
     password: password,
   });
   ```

3. **Connect WebRTC to Call Control**:
   - When answering a call, use `connectWebRTC()` API endpoint
   - Pass the `client_state` from the WebRTC client
   - Bind remote audio stream to `<audio>` element

## Architecture Flow

```
Inbound Call Flow:
1. Telnyx → Webhook (/webhooks/voice)
2. Backend processes event → Broadcasts via WebSocket
3. Frontend receives INBOUND_CALL event
4. IncomingCallPopup displays
5. User clicks Accept → answerCall() API
6. Optionally: connectWebRTC() for media

Outbound Call Flow:
1. User enters number → makeCall()
2. Backend creates Call Control call
3. Webhook events update call state
4. WebSocket broadcasts to frontend
5. UI updates (ringing → active)
```

## Testing

1. **Start Backend**:
   ```bash
   cd backend
   npm run dev
   ```

2. **Start Frontend**:
   ```bash
   cd frontend
   npm run dev
   ```

3. **Test Inbound Calls**:
   - Call your Telnyx number
   - Should see incoming call popup
   - Accept/decline should work

4. **Test Outbound Calls**:
   - Select a number from dropdown
   - Enter destination number
   - Click Call
   - Should see call status updates

## Webhook Configuration

Configure your Telnyx webhook URL:
- **Voice Events**: `https://your-domain.com/webhooks/voice`
- **SMS Events**: `https://your-domain.com/webhooks/sms`

For local development, use a tunneling service like ngrok:
```bash
ngrok http 3000
# Use the ngrok URL for webhooks
```

## Notes

- WebSocket server is attached to the HTTP server (same port)
- Call Control v2 is used for call management
- WebRTC media is optional and requires @telnyx/webrtc SDK
- All call events are logged in the database
- Real-time updates via WebSocket for better UX

## Future Enhancements

- Full WebRTC media integration with @telnyx/webrtc
- Video calling support
- Call recording
- Call transfer
- Conference calling

