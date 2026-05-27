# Clinic Website

The public Dr. Yuval Oz site is a React/Vite single-page application. It is
Hebrew-first and uses hash routing so it can be deployed as static files
without server rewrite configuration.

## Routes

- `#/` - landing page and lead form
- `#/privacy-policy` - privacy policy rendered from `src/translations/texts.ts`
- `#/articles/:id` - article page support; the articles section is currently
  hidden on the landing page

## Development

```bash
npm install
npm run dev
npm run build
npm run lint
```

## Lead Submission Flow

The contact form in `src/components/ContactForm.tsx` collects a phone number
or email address, optional service/message fields, privacy consent, and
separate consent when a pregnancy week is entered.

It posts first to:

```text
https://api.drozyuval.com/api/inquiries
```

There is also a PHP submission endpoint at `src/contact.php`, deployed as
`https://drozyuval.com/contact.php`. It logs submissions to CSV and sends an
email through PHP hosting configuration.

Important current behavior: the React form calls the PHP endpoint even after a
successful main API response as a temporary email backup. This can create two
records/notifications for one submission; do not remove or change that
behavior without deciding how inquiry notification delivery should work.

## Product And Design Intent

The site intentionally moved away from an on-site multi-step booking widget to
a lower-friction lead collection flow:

- Desktop layout keeps a contact form visible in a sticky sidebar.
- Mobile layout places the same form inline with the clinic content.
- The main content presents the physician, specialties, and professional
  experience in a clean medical visual style.
- The application currently captures interest for personal follow-up; the
  backend booking API is separate from this public-site form.

## Active Privacy Surface

The user-visible policy and consent copy live in
`src/components/PrivacyPolicy.tsx` and `src/translations/texts.ts`. Legal or
retention claims in those files should be reviewed with the clinic before
production changes.
