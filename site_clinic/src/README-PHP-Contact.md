# PHP Contact Endpoint

`src/contact.php` is an active hosting-side contact endpoint used by the React
site at `https://drozyuval.com/contact.php`.

## Current Use

The React contact form submits to the main inquiry API first:

```text
https://api.drozyuval.com/api/inquiries
```

The PHP endpoint is called as a fallback when the API request fails. It is
also currently called after a successful API response as a temporary email
backup. That second behavior can duplicate lead notifications or storage and
should be resolved deliberately when the daily-summary/email flow is reliable.

## Input And Output

The PHP endpoint accepts JSON fields:

| Field | Requirement |
| --- | --- |
| `name` | Optional |
| `phone` | Expected when `email` is absent; not enforced in PHP today |
| `email` | Expected when `phone` is absent; not enforced in PHP today |
| `service` | Optional |
| `week` | Optional; pregnancy-related sensitive data |
| `message` | Optional |

The React form enforces the phone-or-email rule. The PHP endpoint currently
accepts any valid JSON object, logs a CSV record, and sends an HTML email when
hosting mail is configured. Adding equivalent server-side validation and
consent persistence is still required before treating it as an independent
compliant intake path. Responses are JSON:

- `200` on a successful save/send attempt.
- `400` for invalid input.
- `405` for unsupported HTTP method.
- `500` for server-side write/mail failures.

## Configuration And Deployment

The PHP source contains the recipient email and CSV filename configuration.
When deploying the static site, publish the PHP endpoint beside the built site
so it is reachable at `/contact.php`, and ensure its directory can write the
CSV file and the host supports PHP mail delivery.

The CSV data is expected to include timestamp, name, phone, email, service,
week, and message columns. Treat this file as containing personal and possibly
sensitive medical-related information.

## Manual Check

```bash
curl -X POST https://drozyuval.com/contact.php \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","phone":"0501234567","week":"12","message":"Test request"}'
```
