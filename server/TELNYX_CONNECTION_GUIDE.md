# Telnyx Outbound Call Setup

This note applies to the existing outbound-call endpoint,
`POST /api/calls/outgoing`. Inbound IVR is not active yet; its TeXML rollout
is tracked in `docs/TELNYX_TEXML_IVR_IMPLEMENTATION_PLAN.md`.

## Required Values

Create a Telnyx Call Control connection and assign an outbound-capable Telnyx
number to it. Configure the server with:

```env
TELNYX_API_KEY=KEY...
TELNYX_PHONE_NUMBER=+...
TELNYX_CONNECTION_ID=...
BASE_URL=https://api.drozyuval.com
```

The Connection ID is available in the Telnyx Portal under **Voice** /
**Call Control** / **Connections**. The server passes it when it creates an
outbound call in `integrations/telnyx/voice.js`.

## Check

With the API and database configured, request an outbound call:

```bash
curl -X POST https://api.drozyuval.com/api/calls/outgoing \
  -H "Content-Type: application/json" \
  -d '{"to":"+972500000000","notes":"Outbound setup check"}'
```

Do not configure WhatsApp through Telnyx from this guide. WhatsApp endpoints
are intentionally disabled until a later Meta WhatsApp implementation.
