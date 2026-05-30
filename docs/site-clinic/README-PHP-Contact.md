# PHP Contact Endpoint

`site_clinic/src/contact.php` is an active hosting-side contact endpoint used
by the React site at `https://drozyuval.com/contact.php`.

## Current Use

The React contact form submits to the main inquiry API first:

```text
https://api.drozyuval.com/api/inquiries
```

The PHP endpoint is called only as a fallback when the API request fails or
returns an unsuccessful response. A successful main API submission does not
create a PHP CSV/email copy. A duplicate remains possible if the main API stores
the inquiry but its success response is lost before reaching the browser.

## Input And Output

The PHP endpoint accepts JSON fields:

| Field | Requirement |
| --- | --- |
| `name` | Optional |
| `phone` | Required when `email` is absent |
| `email` | Required when `phone` is absent |
| `service` | Optional |
| `week` | Optional; pregnancy-related sensitive data |
| `message` | Optional |
| `privacyConsent` | Required boolean `true` |
| `sensitiveDataConsent` | Required boolean `true` when `week` is supplied |

The React form and PHP endpoint both enforce these intake rules. The PHP
endpoint stores accepted consent flags, the `2026-02` policy version, and a
server-side timestamp in its CSV output. Existing historical CSV rows are
preserved with blank evidence fields when the header is upgraded. Responses are
JSON:

- `200` on a successful save/send attempt.
- `400` for invalid input.
- `405` for unsupported HTTP method.
- `500` for server-side write/mail failures.

## Configuration And Deployment

The PHP source contains the recipient email and CSV filename configuration.
When deploying the static site, publish the PHP endpoint beside the built site
so it is reachable at `/contact.php`, and ensure its directory can write the
CSV file and the host supports PHP mail delivery.

The CSV data includes timestamp, name, phone, email, service, week, message,
consent flags, consent policy version, and consent-recorded timestamp columns.
Treat this file as containing personal and possibly sensitive medical-related
information.

## Manual Check

```bash
curl -X POST https://drozyuval.com/contact.php \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","phone":"0501234567","week":"12","message":"Test request","privacyConsent":true,"sensitiveDataConsent":true}'
```
