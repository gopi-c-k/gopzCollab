import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Blockquote from '@tiptap/extension-blockquote'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Link from '@tiptap/extension-link'
import Code from '@tiptap/extension-code'
import Image from '@tiptap/extension-image'
import Highlight from '@tiptap/extension-highlight'
import Placeholder from '@tiptap/extension-placeholder'
import TextStyle from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Highlighter,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Undo,
  Redo,
  Type,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Code as CodeIcon,
  Code2,
  Link as LinkIcon,
  Unlink,
  Image as ImageIcon,
  Table as TableIcon,
  Sun,
  Moon,
  Save,
  FileText,
  Palette,
  Trash2,
  Plus,
  Minus,
  Superscript as SuperscriptIcon,
  Subscript as SubscriptIcon,
} from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'

import CodeBlock from '@tiptap/extension-code-block'

const RichTextEditor = () => {
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [wordCount, setWordCount] = useState(0)
  const [charCount, setCharCount] = useState(0)
  const [extensionClasses, setExtensionClasses] = useState('')


  const themeClasses = isDarkMode
    ? 'bg-gray-900 text-white'
    : 'bg-gray-50 text-gray-900'

  const toolbarClasses = isDarkMode
    ? 'bg-gray-800 border-gray-700'
    : 'bg-white border-gray-200'

  const editorClasses = isDarkMode
    ? 'bg-gray-800 border-gray-700 text-white'
    : 'bg-white border-gray-300 text-gray-900'

  const buttonClasses = isDarkMode
    ? 'bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white'
    : 'bg-white hover:bg-gray-100 text-gray-700 hover:text-gray-900'

  const activeButtonClasses = isDarkMode
    ? 'border-2 border-blue-500'
    : 'border-2 border-blue-400'


  const editor = useEditor({
    key: isDarkMode ? 'dark-editor' : 'light-editor',
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      CodeBlock.configure({
        languageClassPrefix: 'language-',
        defaultLanguage: 'javascript',
        HTMLAttributes: {
          class: `${isDarkMode
            ? 'bg-gray-800 text-red-100 border-gray-700'
            : 'bg-gray-100 text-gray-800 border-gray-200'} p-4 rounded-md overflow-x-auto font-mono text-sm border`
        },
      }),

      Underline,
      Subscript,
      Blockquote.configure({
        HTMLAttributes: {
          class: `${isDarkMode && 'bg-gray-800 text-gray-300'} border-l-4 border-blue-500 pl-4 italic my-4`,
        }
      }),
      Superscript,
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: `${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'} cursor-pointer underline`,
        },
        autolink: true,
        defaultProtocol: 'https',
        protocols: ['http', 'https'],
        isAllowedUri: (url, ctx) => {
          try {
            const parsedUrl = url.includes(':') ? new URL(url) : new URL(`${ctx.defaultProtocol}://${url}`)
            if (!ctx.defaultValidate(parsedUrl.href)) {
              return false
            }

            const disallowedProtocols = ['ftp', 'file', 'mailto']
            const protocol = parsedUrl.protocol.replace(':', '')

            if (disallowedProtocols.includes(protocol)) {
              return false
            }

            const allowedProtocols = ctx.protocols.map(p => (typeof p === 'string' ? p : p.scheme))

            if (!allowedProtocols.includes(protocol)) {
              return false
            }

            const disallowedDomains = ['example-phishing.com', 'malicious-site.net']
            const domain = parsedUrl.hostname

            if (disallowedDomains.includes(domain)) {
              return false
            }
            return true
          } catch {
            return false
          }
        },
        shouldAutoLink: url => {
          try {
            const parsedUrl = url.includes(':') ? new URL(url) : new URL(`https://${url}`)
            const disallowedDomains = ['example-no-autolink.com', 'another-no-autolink.com']
            const domain = parsedUrl.hostname

            return !disallowedDomains.includes(domain)
          } catch {
            return false
          }
        },

      }),
      Image.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          class: 'rounded-md',
        },
      }),
      Placeholder.configure({
        placeholder: 'Write something amazing...',
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      Code,

    ],
    content: `
      <h1>Welcome to the <b> gopzCollab </b> Rich Text Editor!</h1>
    <p>This is a comprehensive rich text editor with full formatting capabilities. You can:</p>
    <ul>
      <li><strong>Bold</strong>, <em>italic</em>, and <u>underline</u> text</li>
      <li>Create <mark style="background-color: yellow;">highlighted text</mark> and <s>strikethrough</s></li>
      <li>Add different heading levels and alignment</li>
      <li>Insert code blocks and inline code</li>
      <li>Create tables with full functionality</li>
    </ul>
    <blockquote style="border-left: 4px solid #3b82f6; padding-left: 16px; margin: 16px 0; font-style: italic; color: #64748b;">
      "The best way to predict the future is to create it." - Peter Drucker
    </blockquote>
    <p>Here's an example of inline <code style="background-color: #f1f5f9; padding: 2px 4px; border-radius: 4px; font-family: monospace;">inline code</code> and a code block:</p>
    <pre style="padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; overflow-x: auto; font-family: 'Courier New', monospace;"><code>function greeting(name) {
  return \`Hello, \${name}!\`;
}
console.log(greeting('World'));</code></pre>
      <p>Try out all the formatting options above.</p>
    `,
    onUpdate: ({ editor }) => {
      const text = editor.getText()
      setWordCount(text.trim().split(/\s+/).filter(word => word.length > 0).length)
      setCharCount(text.length)
    },
  })

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode)
  }

  const addImage = () => {
    const url = window.prompt('Enter the URL of the image:')

    if (url) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }



  const insertTable = () => {
    const rows = parseInt(window.prompt('Number of rows:', '3')) || 3
    const cols = parseInt(window.prompt('Number of columns:', '3')) || 3

    editor
      .chain()
      .focus()
      .insertTable({ rows, cols, withHeaderRow: true })
      .run()
  }

  const saveContent = () => {
    const html = editor.getHTML()
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'document.html'
    a.click()
  }

  const setLink = useCallback(() => {
    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('URL', previousUrl)
    if (url === null) {
      return
    }
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink()
        .run()

      return
    }
    try {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url })
        .run()
    } catch (e) {
      alert(e.message)
    }
  }, [editor])

  if (!editor) {
    return null
  }



  return (
    <div className={`min-h-screen p-6 transition-all duration-300 ${themeClasses}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-3">
          <FileText className="w-8 h-8 text-blue-500" />
          <img
            src="/assets/Images/Logo.png"
            className='w-44'
          ></img>
          <h1 className="text-2xl font-bold">Text Editor</h1>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-lg transition-colors ${buttonClasses}`}
            title="Toggle Theme (Dark/Light)"
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <button
            onClick={saveContent}
            className={`p-2 rounded-lg transition-colors ${buttonClasses}`}
            title="Save Document"
          >
            <Save className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className={`border rounded-lg p-4 mb-4 shadow-lg ${toolbarClasses}`}>
        <div className="flex flex-wrap gap-2 items-center">
          {/* History Controls */}
          <div className="flex items-center space-x-1 mr-4">
            <button
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              className={`p-2 rounded transition-colors ${buttonClasses} ${!editor.can().undo() && 'opacity-50 cursor-not-allowed'}`}
              title="Undo (Ctrl+Z)"
            >
              <Undo className="w-4 h-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              className={`p-2 rounded transition-colors ${buttonClasses} ${!editor.can().redo() && 'opacity-50 cursor-not-allowed'}`}
              title="Redo (Ctrl+Y)"
            >
              <Redo className="w-4 h-4" />
            </button>
          </div>

          <div className={`w-px h-6 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-300'}`}></div>

          {/* Text Formatting */}
          <div className="flex items-center space-x-1 mr-2">
            <button
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={`p-2 rounded transition-colors ${buttonClasses} ${editor.isActive('bold') ? activeButtonClasses : ''}`}
              title="Bold (Ctrl+B)"
            >
              <Bold className="w-4 h-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={`p-2 rounded transition-colors ${buttonClasses} ${editor.isActive('italic') ? activeButtonClasses : ''}`}
              title="Italic (Ctrl+I)"
            >
              <Italic className="w-4 h-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              className={`p-2 rounded transition-colors ${buttonClasses} ${editor.isActive('underline') ? activeButtonClasses : ''}`}
              title="Underline (Ctrl+U)"
            >
              <UnderlineIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleStrike().run()}
              className={`p-2 rounded transition-colors ${buttonClasses} ${editor.isActive('strike') ? activeButtonClasses : ''}`}
              title="Strikethrough"
            >
              <Strikethrough className="w-4 h-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleHighlight().run()}
              className={`p-2 rounded transition-colors ${buttonClasses} ${editor.isActive('highlight') ? activeButtonClasses : ''}`}
              title="Highlight Text"
            >
              <Highlighter className="w-4 h-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleSubscript().run()}
              className={`p-2 rounded transition-colors ${buttonClasses} ${editor.isActive('subscript') ? activeButtonClasses : ''}`}
              title="Subscript (Ctrl+Shift+-)"
            >
              <SubscriptIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleSuperscript().run()}
              className={`p-2 rounded transition-colors ${buttonClasses} ${editor.isActive('superscript') ? activeButtonClasses : ''}`}
              title="Subscript (Ctrl+Shift+-)"
            >
              <SuperscriptIcon className="w-4 h-4" />
            </button>
          </div>

          <div className={`w-px h-6 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-300'}`}></div>

          {/* Headings */}
          <div className="flex items-center space-x-1 mr-4">
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              className={`p-2 rounded transition-colors ${buttonClasses} ${editor.isActive('heading', { level: 1 }) ? activeButtonClasses : ''}`}
              title="Heading 1"
            >
              <Heading1 className="w-4 h-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              className={`p-2 rounded transition-colors ${buttonClasses} ${editor.isActive('heading', { level: 2 }) ? activeButtonClasses : ''}`}
              title="Heading 2"
            >
              <Heading2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              className={`p-2 rounded transition-colors ${buttonClasses} ${editor.isActive('heading', { level: 3 }) ? activeButtonClasses : ''}`}
              title="Heading 3"
            >
              <Heading3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().setParagraph().run()}
              className={`p-2 rounded transition-colors ${buttonClasses} ${editor.isActive('paragraph') ? activeButtonClasses : ''}`}
              title="Paragraph"
            >
              <Type className="w-4 h-4" />
            </button>
          </div>

          <div className={`w-px h-6 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-300'}`}></div>

          {/* Alignment */}
          <div className="flex items-center space-x-1 mr-4">
            <button
              onClick={() => editor.chain().focus().setTextAlign('left').run()}
              className={`p-2 rounded transition-colors ${buttonClasses} ${editor.isActive({ textAlign: 'left' }) ? activeButtonClasses : ''}`}
              title="Align Left"
            >
              <AlignLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().setTextAlign('center').run()}
              className={`p-2 rounded transition-colors ${buttonClasses} ${editor.isActive({ textAlign: 'center' }) ? activeButtonClasses : ''}`}
              title="Align Center"
            >
              <AlignCenter className="w-4 h-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().setTextAlign('right').run()}
              className={`p-2 rounded transition-colors ${buttonClasses} ${editor.isActive({ textAlign: 'right' }) ? activeButtonClasses : ''}`}
              title="Align Right"
            >
              <AlignRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().setTextAlign('justify').run()}
              className={`p-2 rounded transition-colors ${buttonClasses} ${editor.isActive({ textAlign: 'justify' }) ? activeButtonClasses : ''}`}
              title="Justify"
            >
              <AlignJustify className="w-4 h-4" />
            </button>
          </div>

          <div className={`w-px h-6 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-300'}`}></div>

          {/* Lists and Structure */}
          <div className="flex items-center space-x-1 mr-4">
            <button
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={`p-2 rounded transition-colors ${buttonClasses} ${editor.isActive('bulletList') ? activeButtonClasses : ''}`}
              title="Bullet List"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={`p-2 rounded transition-colors ${buttonClasses} ${editor.isActive('orderedList') ? activeButtonClasses : ''}`}
              title="Numbered List"
            >
              <ListOrdered className="w-4 h-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              className={`p-2 rounded transition-colors ${buttonClasses} ${editor.isActive('blockquote') ? activeButtonClasses : ''}`}
              title="Quote Block"
            >
              <Quote className="w-4 h-4" />
            </button>
          </div>

          <div className={`w-px h-6 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-300'}`}></div>

          {/* Code */}
          <div className="flex items-center space-x-1 mr-4">
            <button
              onClick={() => editor.chain().focus().toggleCode().run()}
              className={`p-2 rounded transition-colors ${buttonClasses} ${editor.isActive('code') ? activeButtonClasses : ''}`}
              title="Inline Code (Ctrl+`)"
            >
              <CodeIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              className={`p-2 rounded transition-colors ${buttonClasses} ${editor.isActive('codeBlock') ? activeButtonClasses : ''}`}
              title="Code Block"
            >
              <Code2 className="w-4 h-4" />
            </button>
          </div>

          <div className={`w-px h-6 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-300'}`}></div>

          {/* Links and Media */}
          <div className="flex items-center space-x-1 mr-4">
            <button
              onClick={setLink}
              className={`p-2 rounded transition-colors ${buttonClasses} ${editor.isActive('link') ? activeButtonClasses : ''}`}
              title="Insert Link (Ctrl+K)"
            >
              <LinkIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().unsetLink().run()}
              disabled={!editor.isActive('link')}
              className={`p-2 rounded transition-colors ${buttonClasses} ${!editor.isActive('link') && 'opacity-50 cursor-not-allowed'}`}
              title="Remove Link"
            >
              <Unlink className="w-4 h-4" />
            </button>
            <button
              onClick={addImage}
              className={`p-2 rounded transition-colors ${buttonClasses}`}
              title="Insert Image"
            >
              <ImageIcon className="w-4 h-4" />
            </button>
          </div>

          <div className={`w-px h-6 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-300'}`}></div>

          {/* Table and Advanced */}
          <div className="flex items-center space-x-1">
            <button
              onClick={insertTable}
              className={`p-2 rounded transition-colors ${buttonClasses}`}
              title="Insert Table"
            >
              <TableIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().clearNodes().run()}
              className={`p-2 rounded transition-colors ${buttonClasses}`}
              title="Clear Formatting"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className={`p-2 rounded transition-colors ${buttonClasses}`}
              title="Color Options"
            >
              <Palette className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Color Picker */}
        {showColorPicker && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">Text:</span>
                {['#000000', '#dc2626', '#16a34a', '#2563eb', '#ca8a04', '#9333ea', '#c2410c', '#64748b'].map((color) => (
                  <button
                    key={color}
                    onClick={() => editor.chain().focus().setColor(color).run()}
                    className="w-6 h-6 rounded border-2 border-gray-300 hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    title={`Text Color: ${color}`}
                  />
                ))}
                <button
                  onClick={() => editor.chain().focus().unsetColor().run()}
                  className={`px-2 py-1 text-xs rounded border ${buttonClasses} border-gray-300 dark:border-gray-600`}
                >
                  Reset
                </button>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">Highlight:</span>
                {['transparent', '#fef3c7', '#dcfce7', '#dbeafe', '#fce7f3', '#f3e8ff', '#fed7aa', '#f1f5f9'].map((color) => (
                  <button
                    key={color}
                    onClick={() => editor.chain().focus().toggleHighlight({ color }).run()}
                    className="w-6 h-6 rounded border-2 border-gray-300 hover:scale-110 transition-transform"
                    style={{ backgroundColor: color === 'transparent' ? 'transparent' : color, border: color === 'transparent' ? '2px dashed #9ca3af' : '2px solid #d1d5db' }}
                    title={`Highlight: ${color}`}
                  />
                ))}
                <button
                  onClick={() => editor.chain().focus().unsetHighlight().run()}
                  className={`px-2 py-1 text-xs rounded border ${buttonClasses} border-gray-300 dark:border-gray-600`}
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Editor with Bubble Menu */}
      {editor && (
        <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }}>
          <div className={`flex items-center space-x-1 p-1 rounded shadow-lg ${isDarkMode ? 'bg-gray-700' : 'bg-white'}`}>
            <button
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={`p-1 rounded ${buttonClasses} ${editor.isActive('bold') ? (isDarkMode ? 'bg-blue-600' : 'bg-blue-500') : ''}`}
            >
              <Bold className="w-4 h-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={`p-1 ${buttonClasses} rounded ${editor.isActive('italic') ? (isDarkMode ? 'bg-blue-600' : 'bg-blue-500') : ''}`}
            >
              <Italic className="w-4 h-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              className={`p-1 rounded ${buttonClasses} ${editor.isActive('underline') ? (isDarkMode ? 'bg-blue-600' : 'bg-blue-500') : ''}`}
            >
              <UnderlineIcon className="w-4 h-4" />
            </button>
            <button
              onClick={setLink}
              className={`p-1 rounded ${buttonClasses} ${editor.isActive('link') ? (isDarkMode && activeButtonClasses) : ''}`}
            >
              <LinkIcon className="w-4 h-4" />
            </button>
          </div>
        </BubbleMenu>
      )}

      {/* Editor Content */}
      <div className={`border rounded-lg p-6 min-h-96 shadow-lg transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${editorClasses}`}>
        <EditorContent editor={editor} />
      </div>

      {/* Status Bar */}
      <div className={`mt-4 p-3 text-sm rounded-lg flex justify-between items-center ${isDarkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
        <div className="flex items-center space-x-4">
          <span>✅ Ready</span>
          <span>📄 Words: {wordCount}</span>
          <span>🔤 Characters: {charCount}</span>
        </div>
        <div className="flex items-center space-x-2 text-xs">
          <span>💡 Tip: Use Ctrl+B, Ctrl+I, Ctrl+U for quick formatting</span>
        </div>
      </div>

      {/* Keyboard Shortcuts Help */}
      <div className={`mt-2 p-2 text-xs rounded ${isDarkMode ? 'bg-gray-800 text-gray-500' : 'bg-gray-100 text-gray-500'}`}>
        <details>
          <summary className="cursor-pointer hover:text-blue-500">Keyboard Shortcuts</summary>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <span><kbd className={`px-1 py-0.5 ${buttonClasses} rounded text-xs`}>Ctrl+B</kbd> Bold</span>
            <span><kbd className={`px-1 py-0.5 ${buttonClasses} rounded text-xs`}>Ctrl+I</kbd> Italic</span>
            <span><kbd className={`px-1 py-0.5 ${buttonClasses} rounded text-xs`}>Ctrl+U</kbd> Underline</span>
            <span><kbd className={`px-1 py-0.5 ${buttonClasses} rounded text-xs`}>Ctrl+K</kbd> Insert Link</span>
            <span><kbd className={`px-1 py-0.5 ${buttonClasses} rounded text-xs`}>Ctrl+`</kbd> Inline Code</span>
            <span><kbd className={`px-1 py-0.5 ${buttonClasses} rounded text-xs`}>Tab</kbd> Indent in Code</span>
          </div>
        </details>
      </div>
    </div>
  )
}

export default RichTextEditor