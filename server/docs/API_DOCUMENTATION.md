# API Documentation - Communication Orchestration Platform

## Overview

This document describes the API endpoints for the enhanced IVR and WhatsApp messaging system.

## Base URL
```
http://localhost:3003/api
```

## Authentication
- Admin endpoints require session authentication
- Public endpoints (webhooks) do not require authentication

---

## 📞 Call Management APIs

### GET /calls
Get call records with optional filters.

**Query Parameters:**
- `startDate` (string): Filter calls from this date (YYYY-MM-DD)
- `endDate` (string): Filter calls until this date (YYYY-MM-DD)
- `outcome` (string): Filter by call outcome
- `officeStatus` (string): Filter by office status
- `direction` (string): Filter by call direction (inbound/outbound)
- `limit` (number): Maximum number of records (default: 100)
- `offset` (number): Number of records to skip (default: 0)

**Response:**
```json
{
  "success": true,
  "count": 25,
  "records": [
    {
      "id": 1,
      "callId": "CALL-ABCD1234",
      "timestamp": "2024-02-24T10:30:00Z",
      "callerNumber": "+972500000000",
      "calleeNumber": "+972500000001",
      "officeStatus": "open",
      "outcome": "answered",
      "duration": 120,
      "direction": "inbound",
      "notes": null
    }
  ]
}
```

### POST /calls/outgoing
Initiate an outgoing call.

**Request Body:**
```json
{
  "to": "+972500000000",
  "notes": "Follow-up call"
}
```

**Response:**
```json
{
  "success": true,
  "callId": "CALL-EFGH5678",
  "twilioCallSid": "CA1234567890",
  "status": "initiated"
}
```

### GET /calls/recent
Get recent calls with enhanced filtering.

**Query Parameters:**
- `limit` (number): Maximum number of calls (default: 50)
- `direction` (string): Filter by direction
- `outcome` (string): Filter by outcome
- `startDate` (string): Filter from date
- `endDate` (string): Filter until date

### GET /calls/stats
Get call statistics for a date range.

**Query Parameters:**
- `startDate` (string): Required - Start date (YYYY-MM-DD)
- `endDate` (string): Required - End date (YYYY-MM-DD)

**Response:**
```json
{
  "success": true,
  "period": { "startDate": "2024-02-24", "endDate": "2024-02-24" },
  "stats": {
    "total": 45,
    "answered": 30,
    "no_answer": 10,
    "whatsapp_sent": 5,
    "during_open": 35,
    "during_closed": 10,
    "inbound_calls": 40,
    "outbound_calls": 5,
    "avg_duration": 125.5
  }
}
```

### GET /calls/:id
Get a specific call record by ID.

### PATCH /calls/:id
Update call notes or outcome.

**Request Body:**
```json
{
  "notes": "Customer interested in premium service",
  "outcome": "answered"
}
```

---

## 📱 WhatsApp Messaging APIs

### POST /whatsapp/send
Send a WhatsApp message programmatically.

**Request Body:**
```json
{
  "to": "+972500000000",
  "message": "Hello! How can we help you today?",
  "options": {
    "mediaUrl": "https://example.com/image.jpg",
    "priority": "high"
  }
}
```

**Response:**
```json
{
  "success": true,
  "result": {
    "sid": "WH1234567890",
    "to": "+972500000000",
    "status": "queued",
    "direction": "outbound",
    "dateCreated": "2024-02-24T10:30:00Z"
  }
}
```

### POST /whatsapp/send-interactive
Send WhatsApp message with interactive buttons.

**Request Body:**
```json
{
  "to": "+972500000000",
  "message": "Please select an option:",
  "buttons": [
    { "id": "opt1", "title": "Schedule Appointment" },
    { "id": "opt2", "title": "Speak to Representative" },
    { "id": "opt3", "title": "Call Back" }
  ]
}
```

### POST /whatsapp/send-location
Send WhatsApp location.

**Request Body:**
```json
{
  "to": "+972500000000",
  "location": {
    "lat": 31.7683,
    "lon": 35.2137,
    "name": "Our Office",
    "address": "123 Main St, Jerusalem"
  }
}
```

### POST /whatsapp/send-bulk
Send bulk WhatsApp messages.

**Request Body:**
```json
{
  "recipients": [
    { "phone": "+972500000000", "message": "Special offer!" },
    { "phone": "+972500000001", "message": "Update available" }
  ],
  "options": {
    "delay": 1000,
    "batchSize": 10
  }
}
```

**Response:**
```json
{
  "success": true,
  "result": {
    "total": 2,
    "successful": 2,
    "failed": 0,
    "results": [...]
  }
}
```

### POST /whatsapp/incoming
**Webhook Endpoint** - Handles incoming WhatsApp messages from Twilio.

### GET /whatsapp/bot-messages
Get all available bot messages (for admin/debugging).

### POST /whatsapp/reset-user
Reset user conversation state.

**Request Body:**
```json
{
  "phone": "+972500000000"
}
```

---

## 🎮 IVR Control APIs

### GET /ivr/settings
Get current IVR settings.

**Response:**
```json
{
  "success": true,
  "settings": {
    "officeOpen": true,
    "callForwarding": true,
    "whatsappFallback": true,
    "recordingEnabled": true,
    "customGreeting": null,
    "emergencyMode": false,
    "queueEnabled": false,
    "maxQueueSize": 10,
    "currentQueue": []
  }
}
```

### POST /ivr/settings
Update IVR settings.

**Request Body:**
```json
{
  "callForwarding": false,
  "emergencyMode": true,
  "queueEnabled": true,
  "maxQueueSize": 15
}
```

### POST /ivr/emergency
Toggle emergency mode.

**Request Body:**
```json
{
  "enabled": true
}
```

### GET /ivr/queue
Get current queue status.

**Response:**
```json
{
  "success": true,
  "queue": {
    "enabled": true,
    "maxSize": 10,
    "currentSize": 3,
    "callers": [
      {
        "callId": "CALL-1234",
        "callerNumber": "+972500000000",
        "position": 1,
        "joinedAt": "2024-02-24T10:25:00Z",
        "waitTime": 300000
      }
    ]
  }
}
```

### POST /ivr/queue/add
Add caller to queue (for testing).

**Request Body:**
```json
{
  "callerNumber": "+972500000000",
  "callId": "CALL-1234"
}
```

### POST /ivr/queue/remove
Remove caller from queue.

**Request Body:**
```json
{
  "callId": "CALL-1234"
}
```

---

## 📊 Status and Monitoring APIs

### GET /voice/status
Get current IVR status and settings.

**Response:**
```json
{
  "success": true,
  "officeOpen": true,
  "officeStatus": {
    "isOpen": true,
    "workingHours": {...},
    "timezone": "Asia/Jerusalem",
    "ivrSettings": {...},
    "queueStatus": {...}
  }
}
```

### POST /voice/status
**Webhook Endpoint** - Handles call status updates from Twilio.

---

## 🔧 Configuration

Environment variables for the enhanced features:

```bash
# IVR Settings
IVR_CALL_RECORDING=true
IVR_EMERGENCY_MODE=false
IVR_QUEUE_ENABLED=false
IVR_MAX_QUEUE_SIZE=10
IVR_CUSTOM_GREETING=
IVR_WHATSAPP_FALLBACK=true
IVR_CALL_FORWARDING=true

# WhatsApp Settings
WHATSAPP_BULK_DELAY=1000
WHATSAPP_BULK_BATCH_SIZE=10
WHATSAPP_INTERACTIVE_ENABLED=true
WHATSAPP_LOCATION_ENABLED=true
```

---

## 📝 Usage Examples

### Send a WhatsApp message with buttons
```bash
curl -X POST http://localhost:3003/api/whatsapp/send-interactive \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+972500000000",
    "message": "How can we help you?",
    "buttons": [
      {"id": "appointment", "title": "Book Appointment"},
      {"id": "info", "title": "Get Information"},
      {"id": "call", "title": "Request Call Back"}
    ]
  }'
```

### Initiate an outgoing call
```bash
curl -X POST http://localhost:3003/api/calls/outgoing \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+972500000000",
    "notes": "Follow-up on inquiry"
  }'
```

### Enable emergency mode
```bash
curl -X POST http://localhost:3003/api/ivr/emergency \
  -H "Content-Type: application/json" \
  -d '{"enabled": true}'
```

### Get call statistics
```bash
curl "http://localhost:3003/api/calls/stats?startDate=2024-02-24&endDate=2024-02-24"
```

---

## 🚨 Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message description"
}
```

Common HTTP status codes:
- `200` - Success
- `400` - Bad Request (missing/invalid parameters)
- `401` - Unauthorized (admin endpoints without session)
- `404` - Not Found
- `500` - Internal Server Error

---

## 📞 Webhook Configuration

Configure these webhooks in your Twilio console:

**Voice Webhook URL:**
```
https://your-domain.com/api/voice/incoming
```

**WhatsApp Webhook URL:**
```
https://your-domain.com/api/whatsapp/incoming
```

**Status Callback URL:**
```
https://your-domain.com/api/voice/status
```
