# 🔄 Telnyx Migration Guide

## Overview
This guide helps you migrate from Twilio to Telnyx for voice and messaging services.

## 🚀 Quick Migration Steps

### 1. Install Telnyx SDK
```bash
npm install telnyx
```

### 2. Get Telnyx Credentials

1. **Sign up for Telnyx**: [telnyx.com](https://telnyx.com/)
2. **Get your API Key**: Go to Portal → API Keys
3. **Purchase a Phone Number**: Portal → Numbers
4. **Create a Connection**: Portal → Call Control → Connections
5. **Set up WhatsApp**: Portal → Messaging → WhatsApp

### 3. Update Environment Variables

Replace your Twilio credentials with Telnyx:

```bash
# Remove these Twilio variables:
# TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
# TWILIO_AUTH_TOKEN=your_auth_token_here
# TWILIO_PHONE_NUMBER=+1234567890
# TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# Add these Telnyx variables:
TELNYX_API_KEY=KEYxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TELNYX_PHONE_NUMBER=+1234567890
TELNYX_WHATSAPP_NUMBER=whatsapp:+1234567890
TELNYX_CONNECTION_ID=your-connection-id
TELNYX_MESSAGING_PROFILE_ID=your-messaging-profile-id
```

### 4. Key Differences

| Feature | Twilio | Telnyx |
|---------|--------|--------|
| API Client | `twilio(accountSid, authToken)` | `Telnyx(apiKey)` |
| Call Creation | `client.calls.create()` | `telnyx.calls.create()` |
| Webhook Format | TwiML XML | Telnyx XML |
| Message Status | `MessageStatus` | `event_type` |
| Call SID | `CallSid` | `call.id` |

### 5. Webhook Updates

Update your webhook URLs in Telnyx Portal:

**Voice Webhook:**
```
https://your-domain.com/api/voice/incoming
```

**Call Status Webhook:**
```
https://your-domain.com/api/voice/status
```

**WhatsApp Webhook:**
```
https://your-domain.com/api/whatsapp/incoming
```

## 📋 Migration Checklist

- [ ] Install Telnyx SDK
- [ ] Get Telnyx API credentials
- [ ] Purchase Telnyx phone number
- [ ] Create Telnyx connection
- [ ] Set up WhatsApp on Telnyx
- [ ] Update .env file
- [ ] Update webhook URLs in Telnyx Portal
- [ ] Test voice calls
- [ ] Test WhatsApp messages
- [ ] Test call recording
- [ ] Verify webhooks are working

## 🧪 Testing Your Migration

### Test Voice Call
```bash
curl -X POST http://localhost:3003/api/calls/outgoing \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+1234567890",
    "notes": "Test call with Telnyx"
  }'
```

### Test WhatsApp Message
```bash
curl -X POST http://localhost:3003/api/whatsapp/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+1234567890",
    "message": "🎉 Testing Telnyx WhatsApp!"
  }'
```

### Test IVR Status
```bash
curl http://localhost:3003/api/voice/status
```

## 🔧 Configuration Details

### Telnyx Connection ID
- Go to Portal → Call Control → Connections
- Copy the Connection ID
- This is used for voice call routing

### Telnyx Messaging Profile ID
- Go to Portal → Messaging → Profiles
- Copy the Profile ID
- This is used for SMS/WhatsApp messaging

### WhatsApp Setup
1. Go to Portal → Messaging → WhatsApp
2. Create WhatsApp sender
3. Upload required business documents
4. Wait for approval (can take 1-3 days)

## 🚨 Common Issues & Solutions

### Issue: "API Key invalid"
**Solution**: Double-check your TELNYX_API_KEY in .env file

### Issue: "Connection not found"
**Solution**: Verify TELNYX_CONNECTION_ID matches your active connection

### Issue: WhatsApp not sending
**Solution**: Ensure WhatsApp sender is approved and number is verified

### Issue: Webhook not receiving events
**Solution**: Check webhook URL is accessible and HTTPS (for production)

## 📊 Benefits of Telnyx

- **Better Pricing**: Often 20-30% cheaper than Twilio
- **Simpler API**: More intuitive endpoints
- **Better Documentation**: Clear examples and guides
- **WhatsApp Business**: Direct WhatsApp API integration
- **Global Coverage**: Numbers in 60+ countries

## 🎯 After Migration

Once migrated, you'll have:
- ✅ Lower costs per call/message
- ✅ Better WhatsApp integration
- ✅ Simplified API calls
- ✅ Better error handling
- ✅ More reliable service

## 🆘 Support

If you need help during migration:
1. Check Telnyx documentation: [docs.telnyx.com](https://docs.telnyx.com/)
2. Contact Telnyx support: support@telnyx.com
3. Review this guide's troubleshooting section

## 🔄 Rollback Plan

If you need to rollback to Twilio:
1. Restore Twilio environment variables
2. Revert route imports to use Twilio modules
3. Update webhook URLs in Twilio Console
4. Test functionality

The system maintains backward compatibility during migration.
