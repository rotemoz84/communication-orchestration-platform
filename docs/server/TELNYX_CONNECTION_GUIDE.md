# Telnyx TeXML Inbound IVR Setup

This guide applies to the patient inbound-call flow. The server does not
initiate standalone outbound Telnyx calls.

## Server Values

Configure the deployed server with:

```env
BASE_URL=https://api.drozyuval.com
REP_PHONE_NUMBER=+972500000000
IVR_FALLBACK_EMAIL_TO=validation-recipient@example.com
```

The SMTP variables documented in `server/.env.example` are needed if key `9`
should send the temporary internal validation email.

## Telnyx Portal Setup

1. Buy a Telnyx number with voice capability.
2. Create a Telnyx TeXML Application.
3. Configure its inbound Voice URL:

   ```text
   POST https://api.drozyuval.com/api/voice/incoming
   ```

4. Assign the number to the TeXML Application.
5. Allow the TeXML `<Dial>` leg to call the representative number configured
   as `REP_PHONE_NUMBER`.
6. After direct testing passes, forward the existing clinic number to the
   Telnyx number and verify the patient's caller ID is preserved.

No Telnyx API key or Call Control connection ID is used by this inbound
webhook implementation. WhatsApp remains deferred to a future Meta
integration.

## Manual Webhook Check

After deploying the database migration and current server code, simulate an
incoming Telnyx request:

```bash
curl -X POST https://api.drozyuval.com/api/voice/incoming \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "CallSid=manual-test-001" \
  --data-urlencode "From=+972501234567" \
  --data-urlencode "To=+972509876543"
```

The response is TeXML. Open hours return a `<Dial>` response; closed hours
return a Hebrew follow-up menu. This request creates a call-history record in
the deployed database.
