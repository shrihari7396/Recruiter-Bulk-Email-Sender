# Postmark email campaign tool

Upload a CSV of recipients, review its validation results, compose a plain-text email, optionally attach a file, and send a separate message to each valid address.

## Run locally (Windows)

Install Java and Node.js/npm, then install the frontend dependencies once:

```powershell
Set-Location "Frontend"
npm install
Set-Location ..
```

### Where to enter SMTP credentials

Open the root-level [`run-dev.ps1`](./run-dev.ps1) file in a text editor. At the very top, under `# EDIT THESE SETTINGS before running the script.`, replace the example values in this block with your own SMTP settings:

```powershell
$smtpHost = "smtp.gmail.com"                 # Your provider's SMTP server
$smtpPort = "587"                            # Your provider's SMTP port
$smtpUsername = "your-email@gmail.com"       # Your SMTP login/email
$smtpPassword = "your-app-password"          # Your SMTP password or app password
$mailFrom = $smtpUsername                    # Sender address shown on outgoing mail
```

For example, set `$smtpUsername` to the email address used to log in and `$smtpPassword` to its SMTP/app password. If your provider requires another SMTP server or port, update `$smtpHost` and `$smtpPort` too. For Gmail, use an app password instead of your regular account password. Keep your real credentials private; do not share the script or commit real credentials to source control.

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
