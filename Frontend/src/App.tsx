import { useRef, useState } from 'react'
import './App.css'

type Preview = {
  totalRows: number
  recipients: string[]
  invalidRows: { row: number; value: string }[]
  duplicateCount: number
}

type SendResult = {
  attempted: number
  sent: number
  failed: number
  invalidRowsSkipped: number
  failedRecipients: string[]
}

async function readError(response: Response) {
  try {
    const payload = (await response.json()) as { message?: string }
    return payload.message ?? 'Something went wrong. Please try again.'
  } catch {
    return 'Something went wrong. Please try again.'
  }
}

function App() {
  const [csv, setCsv] = useState<File | null>(null)
  const [attachment, setAttachment] = useState<File | null>(null)
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [preview, setPreview] = useState<Preview | null>(null)
  const [result, setResult] = useState<SendResult | null>(null)
  const [busy, setBusy] = useState<'preview' | 'send' | null>(null)
  const [error, setError] = useState('')
  const csvInput = useRef<HTMLInputElement>(null)
  const attachmentInput = useRef<HTMLInputElement>(null)

  const selectCsv = (file?: File) => {
    if (!file) return
    setCsv(file)
    setPreview(null)
    setResult(null)
    setError('')
  }

  const validateList = async () => {
    if (!csv) return
    setBusy('preview')
    setError('')
    setResult(null)
    const form = new FormData()
    form.append('csv', csv)
    try {
      const response = await fetch('/api/campaigns/preview', { method: 'POST', body: form })
      if (!response.ok) throw new Error(await readError(response))
      setPreview((await response.json()) as Preview)
    } catch (reason) {
      setPreview(null)
      setError(reason instanceof Error ? reason.message : 'Could not validate this CSV file.')
    } finally {
      setBusy(null)
    }
  }

  const sendCampaign = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!csv || !preview || preview.recipients.length === 0) return
    setBusy('send')
    setError('')
    setResult(null)
    const form = new FormData()
    form.append('csv', csv)
    form.append('subject', subject)
    form.append('body', body)
    if (attachment) form.append('attachment', attachment)
    try {
      const response = await fetch('/api/campaigns/send', { method: 'POST', body: form })
      if (!response.ok) throw new Error(await readError(response))
      setResult((await response.json()) as SendResult)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'The campaign could not be sent.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#" aria-label="Postmark home">
          <span className="brand-mark"><MailIcon /></span>
          <span>postmark<span className="brand-period">.</span></span>
        </a>
        <div className="workspace-label">WORKSPACE</div>
        <button className="workspace-switcher" type="button">
          <span className="workspace-avatar">S</span>
          <span className="workspace-name">Studio account<small>Personal workspace</small></span>
          <span className="chevron">⌄</span>
        </button>
        <div className="nav-label">CAMPAIGNS</div>
        <nav className="main-nav" aria-label="Main navigation">
          <a className="nav-item active" href="#compose"><span className="nav-icon"><ComposeIcon /></span>Compose</a>
          <a className="nav-item muted" href="#activity"><span className="nav-icon"><ClockIcon /></span>Activity</a>
          <a className="nav-item muted" href="#contacts"><span className="nav-icon"><UsersIcon /></span>Contacts</a>
        </nav>
        <div className="sidebar-bottom">
          <div className="help-card">
            <span className="help-icon">?</span>
            <strong>Need a hand?</strong>
            <p>Get your campaign ready to go.</p>
            <a href="mailto:support@example.com">Visit the help center <span>↗</span></a>
          </div>
          <button className="profile-button" type="button">
            <span className="profile-avatar">SH</span>
            <span className="profile-name">Shrihari H<small>Account settings</small></span>
            <span className="chevron">···</span>
          </button>
        </div>
      </aside>

      <section className="main-panel" id="compose">
        <header className="topbar">
          <div className="breadcrumbs"><span>Campaigns</span><span className="crumb-divider">/</span><strong>New campaign</strong></div>
          <div className="topbar-right"><span className="save-indicator"><i /> Campaign composer</span><button className="avatar-button" type="button" aria-label="Account">SH</button></div>
        </header>

        <div className="content-wrap">
          <div className="page-heading">
            <div>
              <div className="eyebrow">YOUR NEXT BIG SEND</div>
              <h1>Create a campaign</h1>
              <p className="page-subtitle">A thoughtful message goes a long way. Let’s get yours ready.</p>
            </div>
            <div className="step-indicator"><span className="step-dot">1</span><span>Compose</span><span className="step-line" /><span className="step-dot future">2</span><span className="future-label">Review &amp; send</span></div>
          </div>

          <div className="campaign-layout">
            <form className="campaign-form" onSubmit={sendCampaign}>
              <section className="form-card recipient-card">
                <div className="card-heading">
                  <span className="section-icon recipient-icon"><UsersIcon /></span>
                  <div><h2>Who are we writing to?</h2><p>Bring in your list and we’ll take care of the rest.</p></div>
                  <span className="required-label">REQUIRED</span>
                </div>
                <label className={`upload-zone ${csv ? 'has-file' : ''}`} htmlFor="csv-upload" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); selectCsv(event.dataTransfer.files[0]) }}>
                  <input ref={csvInput} id="csv-upload" type="file" accept=".csv,text/csv" onChange={(event) => selectCsv(event.target.files?.[0])} />
                  <span className="upload-icon"><UploadIcon /></span>
                  <span className="upload-copy">
                    <strong>{csv ? csv.name : <>Drop your CSV here, or <em>browse files</em></>}</strong>
                    <small>{csv ? `${(csv.size / 1024).toFixed(0)} KB · CSV file` : 'A single email column works great · Max 2 MB'}</small>
                  </span>
                  {csv && <button className="remove-file" type="button" aria-label="Remove recipient CSV" onClick={(event) => { event.preventDefault(); event.stopPropagation(); setCsv(null); setPreview(null); setResult(null); if (csvInput.current) csvInput.current.value = '' }}>×</button>}
                </label>
                <div className="upload-note"><span className="note-check">✓</span> We’ll check every address before anything goes out.</div>
                {csv && <button className="text-button validate-button" type="button" onClick={validateList} disabled={busy !== null}><span>{busy === 'preview' ? 'Checking your list…' : preview ? 'Refresh list check' : 'Check recipient list'}</span><span>→</span></button>}
                {preview && <div className="list-preview" aria-live="polite">
                  <div className="preview-stats">
                    <div><strong>{preview.recipients.length}</strong><span>valid recipients</span></div>
                    <div><strong>{preview.duplicateCount}</strong><span>duplicates removed</span></div>
                    <div><strong>{preview.invalidRows.length}</strong><span>invalid rows</span></div>
                  </div>
                  {preview.invalidRows.length > 0 && <div className="invalid-list"><strong>Rows that won’t be sent</strong>{preview.invalidRows.slice(0, 4).map((row) => <span key={`${row.row}-${row.value}`}>Row {row.row}: {row.value || 'No email address'}</span>)}{preview.invalidRows.length > 4 && <span>and {preview.invalidRows.length - 4} more…</span>}</div>}
                  {preview.recipients.length > 0 && <div className="recipient-sample"><strong>Preview</strong><span>{preview.recipients.slice(0, 3).join(' · ')}{preview.recipients.length > 3 ? ` · +${preview.recipients.length - 3} more` : ''}</span></div>}
                </div>}
              </section>

              <section className="form-card message-card">
                <div className="card-heading">
                  <span className="section-icon message-icon"><ComposeIcon /></span>
                  <div><h2>Make it yours</h2><p>Write a clear subject and a message that feels like you.</p></div>
                  <span className="required-label">REQUIRED</span>
                </div>
                <label className="field-label" htmlFor="subject">Subject line <span>{subject.length}/200</span></label>
                <input id="subject" className="text-input" type="text" value={subject} onChange={(event) => setSubject(event.target.value)} maxLength={200} placeholder="A little something for you…" required />
                <div className="field-label message-label"><label htmlFor="message-body">Your message</label><span>Plain text</span></div>
                <textarea id="message-body" className="text-input message-input" value={body} onChange={(event) => setBody(event.target.value)} maxLength={10000} placeholder={'Hi there,\n\nWrite your message here…'} required />
                <div className="editor-footer"><span>{body.length}/10,000 characters</span><span>Each email is sent privately</span></div>
              </section>

              <section className="form-card attachment-card">
                <div className="card-heading">
                  <span className="section-icon attach-icon"><PaperclipIcon /></span>
                  <div><h2>Anything to attach?</h2><p>Share a document, image, or something useful.</p></div>
                  <span className="optional-label">OPTIONAL</span>
                </div>
                <input ref={attachmentInput} id="attachment-upload" className="visually-hidden" type="file" onChange={(event) => setAttachment(event.target.files?.[0] ?? null)} />
                {attachment ? <div className="attachment-file"><span className="file-icon"><PaperclipIcon /></span><span className="attachment-copy"><strong>{attachment.name}</strong><small>{(attachment.size / 1024 / 1024).toFixed(2)} MB</small></span><button className="remove-attachment" type="button" onClick={() => { setAttachment(null); if (attachmentInput.current) attachmentInput.current.value = '' }} aria-label="Remove attachment">×</button></div> : <button className="add-attachment" type="button" onClick={() => attachmentInput.current?.click()}><span>＋</span> Add an attachment <small>up to 10 MB</small></button>}
              </section>

              {error && <div className="alert error-alert" role="alert"><span>!</span><p>{error}</p></div>}
              {result && <div className={`alert ${result.failed ? 'warning-alert' : 'success-alert'}`} role="status"><span>{result.failed ? '!' : '✓'}</span><p><strong>{result.sent} of {result.attempted} emails sent.</strong>{result.failed ? ` ${result.failed} could not be sent.` : ' Your campaign is on its way.'}{result.invalidRowsSkipped > 0 ? ` ${result.invalidRowsSkipped} invalid rows skipped.` : ''}{result.failedRecipients.length > 0 && <small className="failed-list">Failed: {result.failedRecipients.join(', ')}</small>}</p></div>}

              <div className="form-actions">
                <button className="secondary-button" type="button" onClick={() => { setSubject(''); setBody(''); setResult(null); setError('') }}>Clear message</button>
                <button className="send-button" type="submit" disabled={busy !== null || !preview || preview.recipients.length === 0 || !subject.trim() || !body.trim()}>
                  {busy === 'send' ? <><span className="spinner" /> Sending…</> : <>Send campaign <span>→</span></>}
                </button>
              </div>
              <p className="send-disclaimer">By sending, you confirm these recipients have agreed to receive your email.</p>
            </form>

            <aside className="preview-column">
              <div className="preview-heading"><span>LIVE PREVIEW</span><span className="preview-dot" /><span className="preview-status">{preview ? 'LIST CHECKED' : 'DRAFT'}</span></div>
              <div className="email-preview">
                <div className="email-browser"><span /><span /><span /><small>New message</small></div>
                <div className="email-meta"><div><span>From</span><strong>Your SMTP sender</strong></div><div><span>To</span><strong>{preview?.recipients.length ? `${preview.recipients.length} recipient${preview.recipients.length === 1 ? '' : 's'} · sent individually` : 'Your recipients'}</strong></div><div><span>Subject</span><strong>{subject || 'Your subject line'}</strong></div></div>
                <div className="email-rule" />
                <div className="email-body">{body || <span className="placeholder-body">Your message will appear here. Keep it warm, keep it human.</span>}</div>
                {attachment && <div className="preview-attachment"><PaperclipIcon /><span>{attachment.name}</span></div>}
                <div className="email-signoff">Sent with <strong>postmark<span className="brand-period">.</span></strong></div>
              </div>
              <div className="privacy-card"><span className="privacy-icon"><ShieldIcon /></span><div><strong>Your list stays private</strong><p>Every recipient gets their own email. No CCs, no shared addresses.</p></div></div>
              <div className="tip-card"><span className="tip-sparkle">✳</span><p><strong>A little tip</strong><br />A clear subject line helps your note stand out. Keep it short and genuine.</p></div>
            </aside>
          </div>
          <footer className="page-footer"><span>Made for meaningful messages.</span><span>Need help? <a href="mailto:support@example.com">Talk to us</a></span></footer>
        </div>
      </section>
    </main>
  )
}

function MailIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 7.5 12 14l8.5-6.5M5 5.5h14A1.5 1.5 0 0 1 20.5 7v10a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 17V7A1.5 1.5 0 0 1 5 5.5Z" /></svg>
}
function ComposeIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9m3-1 4 4-9 9-5 1 1-5 9-9Z" /></svg>
}
function ClockIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
}
function UsersIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 20v-1.5a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4V20m7-9a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm6-7.5a4 4 0 0 1 0 7.7m5 8.3v-1.5a4 4 0 0 0-3-3.87" /></svg>
}
function UploadIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M4 15v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4" /></svg>
}
function PaperclipIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8.5 12.5 6.8-6.8a3.2 3.2 0 0 1 4.5 4.5l-9.2 9.2a5 5 0 0 1-7.1-7.1l9.2-9.2" /></svg>
}
function ShieldIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 20 6v5c0 5-3.4 8.3-8 10-4.6-1.7-8-5-8-10V6l8-3Z" /><path d="m8.5 12 2.3 2.3 4.7-4.8" /></svg>
}

export default App
