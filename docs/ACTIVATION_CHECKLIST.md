# Vallorne Version 9 | Owner activation checklist

- [ ] Confirm exact legal company registration identity and postal address before publishing the UK-registered statement.
- [ ] Create GitHub repository and connect Cloudflare Pages; preview deploy first.
- [ ] Verify DNS, HTTPS, canonical redirects, reciprocal bilingual alternate links, sitemap, robots, and Google Search Console.
- [ ] Activate monitored general and careers mailboxes, verify sender domain with Resend.
- [ ] Configure Cloudflare Turnstile public/secret keys and test verified + failed challenges.
- [ ] Add Cloudflare WAF/rate limits for `/api/*`, and confirm spam/abuse handling.
- [ ] Configure **private** CV_BUCKET, staff-only bucket access, 90-day lifecycle cleanup, and a PDF malware review process.
- [ ] Submit a test contact form from English and Arabic and confirm actual mailbox delivery.
- [ ] Submit a test PDF CV from English and Arabic; verify R2 private object, email notification, and removal-on-failure behaviour.
- [ ] Configure Brevo double opt-in, verify confirmation email and subscription only after opt-in.
- [ ] Verify UK/SA WhatsApp number; test opening WhatsApp with the correct business recipient and prefilling English/Arabic text.
- [ ] Check mobile at 360px and 390px and desktop at 1440px on **deployed** Cloudflare preview, including partner logos and Manar portrait.
- [ ] Confirm How Vallorne Works video is labelled accurately; connect only if approved recording supplied.
- [ ] Decide whether to connect the AI-chat service later. Do not imply it is live.
- [ ] After sign-off, deploy production domain, monitor Cloudflare deploy logs / form errors, submit sitemap to Search Console.

**Status at handoff:** Website repository is ready to upload. Provider credentials are not included, so **live form submissions are not activated yet**.
