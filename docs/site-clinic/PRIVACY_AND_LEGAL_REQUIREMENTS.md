# Privacy And Legal Requirements

## Status

This is a product/compliance checklist for the clinic website, not legal
advice or a representation that every item has been completed. Because the
site may process pregnancy-week information, final privacy text, retention
periods, security controls, and Israeli-law obligations should be confirmed
with qualified counsel and the clinic before production reliance.

## Data Flow Currently Visible In Code

The public form collects:

- Optional name.
- A phone number or email address for follow-up.
- Optional requested service and message.
- Optional pregnancy week, which should be treated as health-related sensitive
  information.
- General privacy consent in the form UI.
- Separate sensitive-data consent when pregnancy week is entered.

Submission surfaces:

- Main API: `https://api.drozyuval.com/api/inquiries`.
- PHP endpoint: `https://drozyuval.com/contact.php`, currently used as a
  fallback and temporary notification backup.
- Admin inquiry view: session-protected server page at `/admin`.

## Current Gaps To Resolve

- Node and PHP intake paths now require general privacy consent, separately
  require sensitive-data consent when pregnancy week is supplied, and store
  accepted flags with the `2026-02` policy version and a server timestamp.
- Request metadata such as IP address and user agent is not persisted. Decide
  whether collecting it would be necessary and proportionate.
- Successful Node intake no longer invokes the PHP fallback, avoiding the
  previous duplicate CSV/email copy for the normal submission path.
- Public inquiry fields are trimmed and bounded before storage or fallback
  copying; pregnancy week must be a whole number from 1 through 42.
- A restricted-operator personal-data lifecycle runbook exists, but automated
  retention and external-copy cleanup are not implemented.
- Administrative access exists, but a documented access/change audit trail is
  not yet implemented.
- Data may be stored in both PostgreSQL and PHP-generated CSV/email delivery;
  operational ownership and deletion handling must cover all locations.

## Compliance Topics To Confirm

The prior compliance review identified these legal frameworks as potentially
relevant, depending on visitors and business circumstances:

- Israeli Privacy Protection Law, including Amendment 13, for processing data
  of Israeli residents and particularly health-related information.
- GDPR/UK GDPR if individuals in the EU or UK are intentionally served or their
  data is processed within its territorial scope.
- CCPA/CPRA only if applicable business/data thresholds or California-specific
  obligations are met.

Confirm at minimum:

- Who is the data controller and where privacy requests are sent.
- Lawful basis and explicit-consent requirements for inquiry data and pregnancy
  week.
- Whether database registration, notification, or a privacy officer/DPO is
  required for the clinic's actual scale and data categories.
- Defined retention periods, deletion workflow, backups/email/CSV treatment,
  and breach response.
- Security measures for server database, admin sessions, hosting-side CSV, and
  email recipients.
- Whether any external analytics, cookies, embeds, or service providers have
  been added since this checklist was written.

## Required Product Protections

Keep the following behavior in the public flow:

- Privacy policy link adjacent to form consent.
- No pre-selected consent.
- Separate explicit consent when pregnancy week is provided.
- Clear notice explaining why contact data and optional health information are
  requested.

Implementation work still needed:

- Review stored consent evidence whenever the published privacy-policy revision
  changes and update the server-side version key with the public copy.
- Decide whether IP/user-agent logging is necessary and proportionate.
- Approve and operationalize the deletion/access runbook in
  `docs/site-clinic/PERSONAL_DATA_LIFECYCLE.md`.
- Review the Hebrew user-visible policy in
  `site_clinic/src/translations/texts.ts` against the final operational process
  and legal advice.

## Cookie And Tracking Note

The reviewed React code did not show an analytics or advertising integration.
Do not assume a cookie banner is unnecessary indefinitely: reassess if
analytics, advertising pixels, embedded third-party widgets, or other
non-essential client storage are introduced.
