# 🔗 Telnyx Connection ID Guide

## What is a Connection ID?

A **Connection ID** is Telnyx's way of identifying how your voice calls should be handled. It's like a configuration profile that tells Telnyx:

- **Where to route incoming calls**
- **What IVR to play** 
- **Which webhooks to use**
- **Recording preferences**
- **Call forwarding rules**

## 📍 Where to Find Your Connection ID

### Step 1: Log into Telnyx Portal
1. Go to [https://portal.telnyx.com/](https://portal.telnyx.com/)
2. Log in with your credentials

### Step 2: Navigate to Connections
1. Click **"Call Control"** in the left sidebar
2. Click **"Connections"** in the dropdown
3. You'll see a list of your connections

### Step 3: Find Your Connection
Look for:
- **Connection Name** (you might have named it something descriptive)
- **Connection ID** (the actual ID you need)
- **Status** (should be "Active")

### Step 4: Copy the Connection ID
The Connection ID looks like:
```
12345678-1234-1234-1234-123456789012
```

## 🔧 How to Update Your Configuration

### Option 1: Edit .env file directly
```bash
# Open this file:
server\.env

# Find this line:
TELNYX_CONNECTION_ID=your-actual-connection-id-here

# Replace with your actual Connection ID:
TELNYX_CONNECTION_ID=12345678-1234-1234-1234-123456789012
```

### Option 2: Use PowerShell
```powershell
# Replace with your actual Connection ID
powershell -Command "(Get-Content 'server\.env') -replace 'your-actual-connection-id-here', '12345678-1234-1234-1234-123456789012'"
```

## 🎯 What to Do With Your Connection ID

### Once you have your Connection ID:

1. **Update your .env file** with the real Connection ID
2. **Restart your server** to pick up the new configuration
3. **Test outgoing calls** to make sure it works
4. **Configure webhooks** in the Connection settings:
   - Answer URL: `https://api.drozyuval.com/api/voice/incoming`
   - Status URL: `https://api.drozyuval.com/api/voice/status`

## 📋 Connection Settings to Configure

In your Telnyx Connection, you can set:

### **Webhook URLs:**
- **Answer URL:** Where incoming calls are handled
- **Status URL:** Where call status updates are sent
- **Hangup URL:** When calls end

### **Call Handling:**
- **Answer Machine Detection:** Detect if human or machine answered
- **Recording:** Enable/disable call recording
- **Timeout:** How long to ring before hanging up

### **Advanced:**
- **Caller ID:** What number to display
- **Ringback:** What callers hear while ringing
- **Failover URL:** Where to send calls if primary fails

## 🚀 Quick Start

### 1. Find Your Connection ID
```
Portal → Call Control → Connections → Copy Connection ID
```

### 2. Update Configuration
```bash
TELNYX_CONNECTION_ID=your-real-connection-id
```

### 3. Restart Server
```bash
taskkill /F /IM node.exe
npm run dev
```

### 4. Test Call
```bash
curl -X POST http://localhost:3003/api/calls/outgoing \
  -H "Content-Type: application/json" \
  -d '{"to": "+972500000000", "notes": "Test with real Connection ID"}'
```

## 🆘 Troubleshooting

### **Connection ID Not Working:**
- Make sure the Connection is **Active** in Telnyx Portal
- Check that webhooks are **accessible** from the internet
- Verify your phone number is **assigned** to the Connection

### **Webhook Issues:**
- Use a tool like [ngrok](https://ngrok.com/) for testing
- Check firewall settings
- Ensure SSL certificate is valid

### **Call Not Connecting:**
- Verify phone number format (+countrycode)
- Check Connection settings in Telnyx Portal
- Look at server logs for error messages

## 📞 Need Help?

- **Telnyx Documentation:** [https://developers.telnyx.com/](https://developers.telnyx.com/)
- **Telnyx Support:** support@telnyx.com
- **Community:** [https://community.telnyx.com/](https://community.telnyx.com/)

---

**Your Connection ID is the key to making Telnyx voice calls work!** 🔑
