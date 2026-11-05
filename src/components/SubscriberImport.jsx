import { useId, useState } from 'react'
import { previewSubscriberCsv } from '../utils/csvImport.js'
import './SubscriberImport.css'

function SubscriberImport({ subscribers, onImport, onCancel, saving = false }) {
  const fileId = useId()
  const [preview, setPreview] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [resultMessage, setResultMessage] = useState('')

  async function handleFileChange(event) {
    const file = event.target.files?.[0]
    setPreview(null)
    setResultMessage('')
    setError('')

    if (!file) return

    setBusy(true)
    try {
      const text = await file.text()
      const nextPreview = await previewSubscriberCsv(text, subscribers)
      setPreview(nextPreview)

      if (nextPreview.rowCount === 0) {
        setError('No subscriber rows found. Include name and email columns.')
      }
    } catch (parseError) {
      setError(parseError.message || 'Could not read that CSV file.')
    } finally {
      setBusy(false)
    }
  }

  async function handleConfirmImport() {
    if (!preview?.valid?.length || saving) return

    setBusy(true)
    setError('')
    try {
      const result = await onImport(preview.valid)
      setResultMessage(
        `Imported ${result.added} subscriber${result.added === 1 ? '' : 's'}. ` +
          `${result.skippedDuplicates} duplicate${result.skippedDuplicates === 1 ? '' : 's'} skipped. ` +
          `${result.skippedUnsubscribed} unsubscribed address${result.skippedUnsubscribed === 1 ? '' : 'es'} left unchanged.`,
      )
      setPreview(null)
    } catch (importError) {
      setError(importError.message || 'Import failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="subscriber-import" aria-labelledby="subscriber-import-heading">
      <header className="subscriber-import__header">
        <h2 id="subscriber-import-heading" className="subscriber-import__title">
          Import CSV
        </h2>
        <p className="subscriber-import__copy">
          Upload a CSV with <strong>name</strong> and <strong>email</strong>{' '}
          columns. Preview results before confirming. Existing unsubscribed
          addresses are never automatically resubscribed.
        </p>
      </header>

      <div className="subscriber-import__field">
        <label htmlFor={fileId} className="subscriber-import__label">
          CSV file
        </label>
        <input
          id={fileId}
          type="file"
          accept=".csv,text/csv"
          className="subscriber-import__file"
          onChange={handleFileChange}
          disabled={busy}
        />
      </div>

      {error ? (
        <p className="subscriber-import__error" role="alert">
          {error}
        </p>
      ) : null}

      {resultMessage ? (
        <p className="subscriber-import__success" role="status">
          {resultMessage}
        </p>
      ) : null}

      {preview ? (
        <div className="subscriber-import__preview">
          <p className="subscriber-import__summary" aria-live="polite">
            <strong>{preview.valid.length}</strong> valid ·{' '}
            <strong>{preview.invalid.length}</strong> invalid ·{' '}
            <strong>{preview.duplicates.length}</strong> duplicates / skipped
          </p>

          {preview.valid.length > 0 ? (
            <PreviewTable
              title="Valid rows ready to import"
              rows={preview.valid}
              columns={['name', 'email']}
            />
          ) : null}

          {preview.invalid.length > 0 ? (
            <PreviewTable
              title="Invalid rows"
              rows={preview.invalid}
              columns={['name', 'email', 'reason']}
            />
          ) : null}

          {preview.duplicates.length > 0 ? (
            <PreviewTable
              title="Duplicates / protected unsubscribed"
              rows={preview.duplicates}
              columns={['name', 'email', 'reason']}
            />
          ) : null}
        </div>
      ) : null}

      <div className="subscriber-import__actions">
        <button type="button" className="subscriber-import__ghost" onClick={onCancel}>
          Close
        </button>
        <button
          type="button"
          className="subscriber-import__primary"
          onClick={handleConfirmImport}
          disabled={!preview?.valid?.length || busy || saving}
        >
          {saving || busy ? 'Importing…' : 'Confirm import'}
        </button>
      </div>
    </section>
  )
}

function PreviewTable({ title, rows, columns }) {
  return (
    <div className="subscriber-import__table-wrap">
      <h3 className="subscriber-import__table-title">{title}</h3>
      <table className="subscriber-import__table">
        <thead>
          <tr>
            <th scope="col">Line</th>
            {columns.map((column) => (
              <th key={column} scope="col">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 25).map((row) => (
            <tr key={`${row.lineNumber}-${row.email}-${row.reason || 'ok'}`}>
              <td>{row.lineNumber}</td>
              {columns.map((column) => (
                <td key={column}>{row[column] || '—'}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length > 25 ? (
        <p className="subscriber-import__more">
          Showing first 25 of {rows.length} rows.
        </p>
      ) : null}
    </div>
  )
}

export default SubscriberImport
