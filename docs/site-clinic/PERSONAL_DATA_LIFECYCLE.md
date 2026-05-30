# Personal Data Lifecycle

## Inquiry Submission Paths

### Normal Submission

Successful website inquiries are stored in PostgreSQL through
`POST /api/inquiries`. The Node daily-summary job sends new inquiry details to
the configured internal mailbox. A successful Node submission does not call
the PHP fallback.

### Fallback Submission

When the Node API fails or returns an unsuccessful response, the website calls
`contact.php`. That fallback stores a row in hosting-side `leads.csv` and sends
an internal notification email. Treat both as personal-data copies. If the Node
API stores an inquiry but its success response is lost in transit, the fallback
may still create a second copy; operational cleanup must account for that edge
case.

## Inquiry Erasure Workflow

For a verified inquiry erasure request:

1. Have an authorized technical operator delete the primary PostgreSQL inquiry
   using restricted database access. No application delete endpoint is exposed.
2. Search the configured inquiry-summary mailbox for the inquiry contact
   details and remove applicable summary emails according to the clinic's
   approved mailbox procedure.
3. Check hosting-side `leads.csv` for a fallback copy and remove the applicable
   row according to the clinic's approved hosting procedure.
4. Apply the clinic's approved handling for backups, hosting logs, and any
   legally required retention exception.
5. Record completion outside the erased inquiry record using the clinic's
   approved request-tracking procedure.

## Call Record Erasure Workflow

Caller records are stored in PostgreSQL and may also appear in IVR fallback
notification emails. For a verified erasure request:

1. Have an authorized technical operator delete the primary PostgreSQL call
   record using restricted database access. No application delete endpoint is
   exposed.
2. Search the configured IVR fallback mailbox for applicable notifications and
   remove them according to the clinic's approved mailbox procedure.
3. Apply the clinic's approved handling for provider-side records, backups,
   hosting logs, and any legally required retention exception.
4. Record completion outside the erased call record using the clinic's approved
   request-tracking procedure.

## Retention Decision

Automated retention deletion is not configured in this repository. The clinic
and qualified counsel must approve retention periods and any required
exceptions before a purge job is introduced.

## Application Logging

Application logs intentionally omit contact details, caller numbers, session
IDs, provider call IDs, and calendar event links. Keep this minimization in
place when adding diagnostics. Hosting and provider-side logs still need their
own retention and access-control review.
