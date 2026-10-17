$ErrorActionPreference = "Stop"

# EDIT THESE SETTINGS before running the script.
# For Gmail, use an app password, not your regular account password.
$smtpHost = "smtp.gmail.com"
$smtpPort = "587"
$smtpUsername = "your-email@gmail.com"
$smtpPassword = "your-app-password"
$mailFrom = $smtpUsername

$rootDirectory = $PSScriptRoot
$backendDirectory = Join-Path $rootDirectory "Backend\Email-Sender-Service"
$frontendDirectory = Join-Path $rootDirectory "Frontend"

if ($smtpUsername -eq "your-email@gmail.com" -or $smtpPassword -eq "your-app-password") {
    throw "Edit the SMTP settings at the top of run-dev.ps1 before starting the application."
}

if (-not (Test-Path (Join-Path $backendDirectory "mvnw.cmd"))) {
    throw "Backend Maven wrapper was not found at '$backendDirectory'."
}

if (-not (Test-Path (Join-Path $frontendDirectory "package.json"))) {
    throw "Frontend package.json was not found at '$frontendDirectory'."
}

if (-not (Get-Command npm.cmd -ErrorAction SilentlyContinue)) {
    throw "npm was not found. Install Node.js and npm, then run this script again."
}

if (-not (Test-Path (Join-Path $frontendDirectory "node_modules"))) {
    throw "Frontend dependencies are missing. Run 'npm install' in '$frontendDirectory' first."
}

$parsedSmtpPort = 0
if (-not [int]::TryParse($smtpPort, [ref]$parsedSmtpPort) -or $parsedSmtpPort -lt 1 -or $parsedSmtpPort -gt 65535) {
    throw "SMTP port must be a number between 1 and 65535."
}

$env:SMTP_HOST = $smtpHost
$env:SMTP_PORT = [string]$parsedSmtpPort
$env:SMTP_USERNAME = $smtpUsername
$env:SMTP_PASSWORD = $smtpPassword
$env:MAIL_FROM = $mailFrom

$backendProcess = Start-Process -FilePath "cmd.exe" `
    -ArgumentList "/k", "mvnw.cmd spring-boot:run" `
    -WorkingDirectory $backendDirectory `
    -PassThru

Write-Host "Backend is starting. Waiting for it at http://localhost:8080 ..."
$backendReady = $false
for ($attempt = 0; $attempt -lt 120; $attempt++) {
    if ($backendProcess.HasExited) {
        throw "The backend terminal closed before the service became ready."
    }

    $connection = New-Object System.Net.Sockets.TcpClient
    try {
        $connection.Connect("localhost", 8080)
        $backendReady = $true
        break
    } catch {
        Start-Sleep -Seconds 1
    } finally {
        $connection.Dispose()
    }
}

if (-not $backendReady) {
    throw "Backend did not start listening on port 8080 within 120 seconds. Check the backend terminal for errors."
}

Write-Host "Backend is ready. Starting frontend..."
Start-Process -FilePath "cmd.exe" `
    -ArgumentList "/k", "npm run dev" `
    -WorkingDirectory $frontendDirectory | Out-Null

Write-Host "Frontend started. Open the Vite URL shown in its terminal."
Write-Host "Keep both service terminals open while using the application."
