# Vallorne Educational Services | Cloudflare Pages Website

**Version 9, 9 November 2026 | GitHub and Cloudflare Pages release package**

This ZIP is a complete bilingual website repository. **Extract its contents into the repository root**. Do not upload the ZIP file itself as the website source.

## Repository layout

- `/` (repository root): the entire crawlable English/Arabic website, static assets, images, fonts, existing approved downloadable documents, `robots.txt`, and `sitemap.xml`.
- `functions/api/`: Cloudflare Pages server endpoints for contact, career applications with CV upload, newsletter confirmation, and public availability configuration.
- `functions/_server/`: private shared server-side logic. Keep this folder under `functions/`.
- `docs/`: asset provenance and implementation notes.

## 1. GitHub -> Cloudflare Pages automatic deployment

1. Create or open the Vallorne GitHub repository. **Upload the extracted files and folders to its root**; the root should contain `index.html`, `assets`, `en`, `ar`, `functions`, and this `README.md`.
2. In Cloudflare, open **Workers & Pages -> Create application -> Pages -> Import an existing Git repository**.
3. Authorize GitHub and choose the Vallorne repository.
4. Choose **Framework preset: None**, **Build command: `exit 0`**, **Build output directory: `.` (repository root)**, **Root directory: repository root**, and production branch **`main`**.
5. Use the Cloudflare-generated `*.pages.dev` preview to inspect desktop and mobile pages before connecting the live domain.
6. Connect `www.vallorne-edu.com` only after review, update DNS as Cloudflare instructs, and verify HTTPS, sitemap and indexability.
7. Cloudflare automatically publishes each approved push to `main`; for staged changes use pull-request / preview branches and merge after review. Configure branch deployment controls if you do not want pushes to go live automatically.

Never send passwords, GitHub tokens, Cloudflare tokens or private API secrets through the website source or public repository.

## 2. Activating real enquiry forms

Form buttons do not open mailto drafts. They POST to the Pages Functions API, which reports success only when the relevant service operation succeeds. **Until credentials and private storage are configured, the API returns an unavailable status rather than falsely claiming a successful submission.**

Create the following Cloudflare Pages project settings under **Settings -> Variables and Secrets**. Mark secret keys as encrypted secrets.

| Name | Type | Purpose |
|---|---|---|
| `TURNSTILE_SITE_KEY` | public variable | Turnstile site widget key |
| `TURNSTILE_SECRET_KEY` | secret | Server-side Turnstile verification |
| `RESEND_API_KEY` | secret | Transactional email delivery |
| `EMAIL_FROM` | public variable | Sender address on a Resend-verified domain (for example `Vallorne Educational Services <info@vallorne-edu.com>`) |
| `CONTACT_TO_EMAIL` | variable | Real mailbox receiving contact enquiries |
| `CAREERS_TO_EMAIL` | variable | Real mailbox receiving job applications |
| `WHATSAPP_NUMBER` | variable | Verified WhatsApp Business number with country code, digits only |
| `BREVO_API_KEY` | secret | Newsletter double opt-in API |
| `BREVO_LIST_ID` | variable | Brevo contact-list numeric ID |
| `BREVO_DOI_TEMPLATE_ID` | variable | Brevo transactional DOI template ID |
| `BREVO_CONFIRM_REDIRECT_URL` | variable | Approved HTTPS confirmation destination URL |

Create a **private** Cloudflare R2 bucket for CV files. Bind it to Pages Functions with the exact binding name **`CV_BUCKET`** under **Settings -> Bindings -> R2 bucket**, for both preview and production as needed. **Do not expose the R2 bucket to the public internet.** Configure an R2 object lifecycle rule to delete application PDFs after **90 days**, in alignment with the Privacy page. Restrict employee access to the R2 dashboard; set a process for deletion requests. Do not make application files accessible by public URLs.

Verify the email domain (SPF/DKIM as provided by the email service) without overwriting existing mailbox MX records. Confirm the mailbox routes work. Enable Cloudflare rate limiting/WAF for `/api/*`. For production CV uploads, add a malware-scanning process and do not open unsolicited PDFs before screening. Restrict uploads to PDF and 4 MiB as implemented.

Activate Brevo's Double Opt-In confirmation template and check its transactional-email/API permissions. Contacts are not added as subscribed until confirmation. See `docs/ACTIVATION_CHECKLIST.md`.

## 3. Endpoint behaviour

- `GET /api/config`: public readiness booleans and public site key; exposes **no secrets**.
- `POST /api/contact`: validates input and Turnstile, delivers a message to the configured mailbox via Resend, then returns success.
- **Send via WhatsApp**: opens the installed WhatsApp app with a prefilled message addressed to the verified number. The visitor must press **Send** in WhatsApp to complete it. Without the number, the UI explains that the channel is unavailable.
- `POST /api/careers`: validates the form, verifies Turnstile, accepts PDF up to 4 MiB, writes to a private R2 bucket, emails the applicant's details and private file key to the careers mailbox, and returns a reference number. An unsuccessful email notification triggers removal of the uploaded object; no false success is returned.
- `POST /api/newsletter`: requests a Brevo Double Opt-In confirmation email. It does not claim instant subscription.

Do not run production testing by collecting real applicants' CVs before the storage, mailbox, retention and anti-spam controls are configured.

## 4. Remaining controls

- **No live video** has been supplied for the How Vallorne Works panel. Do not claim a video is playable.
- The site has an AI-chat launcher but **no AI chatbot service is connected**. Human chat directs visitors to contact; it is not a live agent chat platform.
- The UK company registration information and final WhatsApp number must be confirmed by the owner before any company claim and working links are published.
- The user's instruction to remove the public Grade 11 lesson sample has been honored. No G11 PDF is bundled or linked.
- The full English and Arabic site files remain standalone and indexable, not a JavaScript-only single-page shell. Use Google Search Console to verify actual indexing after publication; metadata cannot guarantee search ranking or sitelinks.

## 5. Validation

The package was checked with HTML asset/link auditing and inline desktop/mobile Chrome rendering. In this environment local HTTP navigation was blocked, so a real deployed preview and end-to-end live provider tests remain necessary. The Pages Functions were tested with mocked Turnstile, Resend, Brevo, and private R2 responses. See `docs/ACTIVATION_CHECKLIST.md`.

## Update to an existing GitHub-connected website

This edition is deliberately flattened for an existing Cloudflare Pages project whose previous GitHub version had `index.html` in the repository root. On Cloudflare Pages, the build output directory must be `.` (or the repository root). If the project instead uses `public`, update its build output setting to `.` before relying on automatic deployment. The production branch is `main`. Store all secrets in Cloudflare settings, never GitHub source.
