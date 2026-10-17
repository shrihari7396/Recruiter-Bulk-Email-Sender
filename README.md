# Postmark email campaign tool

Upload a CSV of recipients, review its validation results, compose a plain-text email, optionally attach a file, and send a separate message to each valid address.

## Run locally (Windows)

Install Java and Node.js/npm, then install the frontend dependencies once:

```powershell
Set-Location "Frontend"
npm install
Set-Location ..
```

Before running, open [`run-dev.ps1`](./run-dev.ps1) in a text editor and change the SMTP settings at the top of the file: `$smtpHost`, `$smtpPort`, `$smtpUsername`, `$smtpPassword`, and `$mailFrom`. For Gmail, use an app password instead of your regular account password. Do not share the script or commit real credentials to source control.

From the repository root, start the backend first and then the frontend:

```powershell
.\run-dev.ps1
```

The script opens the backend terminal and waits for Spring Boot to listen on port 8080 before opening the frontend terminal. Defaults in the script use Gmail SMTP on port `587`; for Outlook or another SMTP provider, edit those settings to match the provider. Port 587 with STARTTLS is configured by default.

Open the local Vite URL printed in the frontend terminal. The development server proxies `/api` requests to Spring Boot on `localhost:8080`.

Use only this root `run-dev.ps1` launcher to start both services.

## Recipient CSV

Use a CSV with an `email` or `email address` header, or a plain one-column list of addresses. A header can appear in any column (for example `name,email`). Invalid addresses are shown in the preview and skipped; duplicate addresses are removed. The service accepts at most 500 unique recipients and a 2 MB CSV.

Attachments are limited to 10 MB. Emails are sent individually, not as a shared To/CC list. Review the recipient preview before clicking **Send campaign**.

This starter is intended for local/private use. Add authentication and authorization before exposing the sending API to other users or the public internet.
