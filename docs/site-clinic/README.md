# Clinic Website

The public Dr. Yuval Oz site is a React/Vite single-page application. It is
Hebrew-first and uses hash routing so it can be deployed as static files
without server rewrite configuration.

## Routes

- `#/` - landing page and lead form
- `#/privacy-policy` - privacy policy rendered from
  `site_clinic/src/translations/texts.ts`
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

The contact form in `site_clinic/src/components/ContactForm.tsx` collects a
phone number or email address, optional service/message fields, privacy
consent, and separate consent when a pregnancy week is entered.

It posts first to:

```text
https://api.drozyuval.com/api/inquiries
```

There is also a PHP submission endpoint at `site_clinic/src/contact.php`,
deployed as `https://drozyuval.com/contact.php`. It logs submissions to CSV
and sends an email through PHP hosting configuration.

The React form calls the PHP endpoint only when the main API request fails or
returns an unsuccessful response. Successful main API submissions stay in
PostgreSQL and are included in the Node daily-summary email without creating a
second hosting-side CSV/email copy.

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
`site_clinic/src/components/PrivacyPolicy.tsx` and
`site_clinic/src/translations/texts.ts`. Legal or retention claims in those
files should be reviewed with the clinic before production changes.
