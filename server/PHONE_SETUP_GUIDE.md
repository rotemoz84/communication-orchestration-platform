# 📱 Phone Connection Setup Guide

## 🚀 Quick Setup

### 1. Get Twilio Credentials
1. Sign up for a [Twilio account](https://www.twilio.com/try-twilio)
2. Get your Account SID and Auth Token from the [Twilio Console](https://console.twilio.com/)
3. Purchase a phone number (or use the trial number)

### 2. Configure Your .env File
Edit the `.env` file in your server directory and add your credentials:

```bash
# Twilio Credentials (get from Twilio Console)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
TWILIO_PHONE_NUMBER=+1234567890

# Your personal phone number (where calls will be forwarded)
REP_PHONE_NUMBER=+9725xxxxxxxx

# Server settings
BASE_URL=http://localhost:3003

# Optional: Database (if you want to save call records)
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=communication_platform
```

### 3. Start the Server
```bash
cd server
npm install
npm run dev
```

### 4. Test the Connection

## 🧪 Testing Your Setup

### Test 1: Send WhatsApp Message
```bash
curl -X POST http://localhost:3003/api/whatsapp/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+9725xxxxxxxx",
    "message": "🎉 Test message from your new system!"
  }'
```

### Test 2: Make Outgoing Call
```bash
curl -X POST http://localhost:3003/api/calls/outgoing \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+9725xxxxxxxx",
    "notes": "Test call from system"
  }'
```

### Test 3: Check IVR Status
```bash
curl http://localhost:3003/api/voice/status
```

## 📞 Twilio Webhook Setup

### For Voice Calls:
1. Go to your [Twilio Phone Numbers](https://console.twilio.com/us1/develop/phone-numbers/manage)
2. Click on your phone number
3. Set "Voice & Fax" → "A CALL COMES IN" to:
   ```
   http://localhost:3003/api/voice/incoming
   ```
4. Set "Status Callback" to:
   ```
   http://localhost:3003/api/voice/status
   ```

### For WhatsApp:
1. Go to [Twilio WhatsApp Senders](https://console.twilio.com/us1/sms/whatsapp/learn)
2. Set "When a message comes in" to:
   ```
   http://localhost:3003/api/whatsapp/incoming
   ```

## 🔧 Advanced Configuration

### Enable Call Recording
```bash
IVR_CALL_RECORDING=true
```

### Enable Queue System
```bash
IVR_QUEUE_ENABLED=true
IVR_MAX_QUEUE_SIZE=10
```

### Custom Emergency Mode
```bash
# Enable emergency mode (all calls go to WhatsApp)
IVR_EMERGENCY_MODE=true
```

## 📊 Monitor Your System

### View Call Statistics
```bash
curl "http://localhost:3003/api/calls/stats?startDate=2024-02-24&endDate=2024-02-24"
```

### View Recent Calls
```bash
curl "http://localhost:3003/api/calls/recent?limit=10"
```

### Check IVR Settings
```bash
curl http://localhost:3003/api/ivr/settings
```

## 🚨 Troubleshooting

### Problem: "Twilio not configured"
**Solution:** Make sure TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN are set in .env

### Problem: Webhook not working
**Solution:** Use [ngrok](https://ngrok.com/) for local testing:
```bash
ngrok http 3003
```
Then update your BASE_URL and Twilio webhooks to use the ngrok URL.

### Problem: WhatsApp not sending
**Solution:** Make sure your WhatsApp number is approved for sending messages

## 🎯 Quick Test Script

Save this as `test.js` and run it:
```javascript
const axios = require('axios');

const BASE_URL = 'http://localhost:3003/api';

async function testSystem() {
  try {
    console.log('🧪 Testing WhatsApp...');
    const whatsapp = await axios.post(`${BASE_URL}/whatsapp/send`, {
      to: '+9725xxxxxxxx', // Replace with your number
      message: '🎉 System is working!'
    });
    console.log('✅ WhatsApp test passed:', whatsapp.data);

    console.log('🧪 Testing call status...');
    const status = await axios.get(`${BASE_URL}/voice/status`);
    console.log('✅ Status check passed:', status.data);

    console.log('🧪 Testing IVR settings...');
    const ivr = await axios.get(`${BASE_URL}/ivr/settings`);
    console.log('✅ IVR settings:', ivr.data);

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testSystem();
```

Run with: `node test.js`

## 📞 What Happens When Someone Calls?

1. **Call comes in** → Twilio sends to `/api/voice/incoming`
2. **System checks** if office is open
3. **If open:** Forwards to your REP_PHONE_NUMBER
4. **If no answer:** Plays IVR menu, offers WhatsApp option
5. **If closed:** Plays closed message, offers WhatsApp option
6. **All calls** are tracked in the database

## 🎉 You're Ready!

Once you've completed these steps:
1. Your system will receive calls
2. You can send WhatsApp messages
3. You can make outgoing calls
4. Everything is tracked and logged

Start with the basic tests, then explore the advanced features! 🚀
