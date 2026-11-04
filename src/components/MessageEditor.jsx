import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import { useEffect, useState } from 'react'
import { isValidLinkUrl, normalizeLinkUrl } from '../utils/linkValidation.js'
import './MessageEditor.css'

function ToolbarButton({ label, isActive, disabled, onClick }) {
  return (
    <button
      type="button"
      className={`message-editor__toolbar-btn${isActive ? ' is-active' : ''}`}
      aria-label={label}
      aria-pressed={isActive}
      disabled={disabled}
      onClick={onClick}
    >
      {label}
    </button>
  )
}

function MessageEditor({
  value = '',
  onChange,
  readOnly = false,
  labelledBy,
  describedBy,
  invalid = false,
}) {
  const [linkError, setLinkError] = useState('')

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
        HTMLAttributes: {
          rel: 'noopener noreferrer',
          target: '_blank',
        },
        validate: isValidLinkUrl,
      }),
    ],
    content: value || '',
    editable: !readOnly,
    editorProps: {
      attributes: {
        class: 'message-editor__content',
        'aria-labelledby': labelledBy || undefined,
        'aria-describedby': describedBy || undefined,
        'aria-invalid': invalid ? 'true' : undefined,
        role: 'textbox',
        'aria-multiline': 'true',
      },
    },
    onUpdate: ({ editor: current }) => {
      onChange?.(current.getHTML())
    },
  })

  useEffect(() => {
    if (!editor) return
    editor.setEditable(!readOnly)
  }, [editor, readOnly])

  useEffect(() => {
    if (!editor) return
    const current = editor.getHTML()
    const next = value || ''
    if (current !== next) {
      editor.commands.setContent(next, { emitUpdate: false })
    }
  }, [editor, value])

  function promptForLink() {
    if (!editor) return

    setLinkError('')
    const previous = editor.getAttributes('link').href || ''
    const raw = window.prompt('Enter a link URL (https:// or mailto:)', previous)

    if (raw === null) return

    const trimmed = raw.trim()
    if (!trimmed) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }

    const normalized = normalizeLinkUrl(trimmed)
    if (!isValidLinkUrl(normalized)) {
      setLinkError(
        'Links must use http://, https://, or mailto:. javascript: and other schemes are blocked.',
      )
      return
    }

    editor
      .chain()
      .focus()
      .extendMarkRange('link')
      .setLink({ href: normalized })
      .run()
  }

  if (!editor) return null

  return (
    <div
      className={`message-editor${readOnly ? ' message-editor--readonly' : ''}${invalid ? ' message-editor--invalid' : ''}`}
    >
      {!readOnly && (
        <div className="message-editor__toolbar" role="toolbar" aria-label="Formatting">
          <ToolbarButton
            label="Bold"
            isActive={editor.isActive('bold')}
            onClick={() => editor.chain().focus().toggleBold().run()}
          />
          <ToolbarButton
            label="Italic"
            isActive={editor.isActive('italic')}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          />
          <ToolbarButton
            label="Heading"
            isActive={editor.isActive('heading', { level: 2 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          />
          <ToolbarButton
            label="Bullets"
            isActive={editor.isActive('bulletList')}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          />
          <ToolbarButton
            label="Numbered"
            isActive={editor.isActive('orderedList')}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          />
          <ToolbarButton
            label="Link"
            isActive={editor.isActive('link')}
            onClick={promptForLink}
          />
        </div>
      )}

      <EditorContent editor={editor} />

      {linkError ? (
        <p className="message-editor__error" role="alert">
          {linkError}
        </p>
      ) : null}
    </div>
  )
}

export default MessageEditor
