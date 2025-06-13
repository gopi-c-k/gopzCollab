import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Blockquote from '@tiptap/extension-blockquote'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import BulletList from '@tiptap/extension-bullet-list'
import Document from '@tiptap/extension-document'
import ListItem from '@tiptap/extension-list-item'
import htmlDocx from 'html-docx-js/dist/html-docx';
import html2pdf from 'html2pdf.js';
import OrderedList from '@tiptap/extension-ordered-list'
import Link from '@tiptap/extension-link'
import Code from '@tiptap/extension-code'
import Image from '@tiptap/extension-image'
import Highlight from '@tiptap/extension-highlight'
import Placeholder from '@tiptap/extension-placeholder'
import TextStyle from '@tiptap/extension-text-style'
import Heading from '@tiptap/extension-heading'
import Color from '@tiptap/extension-color'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript'
import Paragraph from '@tiptap/extension-paragraph'
import { Text as TextExtension } from '@tiptap/extension-text'
import Collaboration from '@tiptap/extension-collaboration'
import CollaborationCursor from '@tiptap/extension-collaboration-cursor'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
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
  X,
  ListOrdered,
  PlusCircle,
  PlusSquare,
  MinusCircle,
  MinusSquare,
  Columns2,
  DivideSquare,
  ArrowDown,
  ArrowUp,
  ArrowLeft,
  ArrowRight,
  LayoutList,
  LayoutGrid,
  TableProperties,
  Merge,
  Split,
  Wand2,
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
  FileDown,
  FileArchive,
  Palette,
  Trash2,
  Superscript as SuperscriptIcon,
  Subscript as SubscriptIcon,
} from 'lucide-react'
import { useState, useCallback, useEffect,useMemo } from 'react'

import CodeBlock from '@tiptap/extension-code-block'

const RichTextEditor = () => {
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [wordCount, setWordCount] = useState(0)
  const [charCount, setCharCount] = useState(0)
  const [tableModalShow, setTableModalShow] = useState(false)
  const [open, setOpen] = useState(false);
  const ydoc = useMemo(() => new Y.Doc(), [])
const provider = useMemo(
  () => new WebsocketProvider('ws://localhost:1234', 'your-room-name', ydoc),
  [ydoc]
)


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
      StarterKit,
      Document,
      Paragraph,
      TextExtension,
      Heading.configure({
        levels: [1, 2, 3],
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
      BulletList.configure({
        HTMLAttributes: {
          class: `list-disc pl-6`,
        },
      }),
      OrderedList.configure({
        HTMLAttributes: {
          class: `list-decimal pl-6`,
        },
      }),
      ListItem,
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
      Code.configure({
        HTMLAttributes: {
          class: "bg-purple-100 text-gray-800 p-1 rounded font-mono text-sm border border-gray-300 dark:border-gray-700"

        },
      }),
       // ADD THESE TWO LINES:
    Collaboration.configure({
      document: ydoc,
    }),
    
      CollaborationCursor.configure({
        provider,
        user: {
          name: localStorage.getItem('userName') || 'Anonymous',
          color: localStorage.getItem('userColor') || '#60a5fa',
        },
      }),
    ],
    content: `<p>Type your text here...</p>`,
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

  const saveContent = (format = 'html') => {
    const html = editor.getHTML();

    if (format === 'html') {
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      downloadFile(url, 'document.html');
    }

    if (format === 'docx') {
      const docxBlob = htmlDocx.asBlob(html);
      const url = URL.createObjectURL(docxBlob);
      downloadFile(url, 'document.docx');
    }

    if (format === 'pdf') {
      const element = document.createElement('div');
      element.innerHTML = html;

      html2pdf().from(element).set({
        margin: 10,
        filename: 'document.pdf',
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      }).save();
    }
  };

  const downloadFile = (url, filename) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

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
            onClick={() => setOpen(!open)}
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
              onClick={() => { setTableModalShow(!tableModalShow) }}
              className={`p-2 rounded transition-colors ${buttonClasses}`}
              title="Table Options"
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

        {/* Table Modal */}
        {tableModalShow && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
                  className={`p-2 rounded transition-colors ${buttonClasses}`}
                  title="Insert Table"
                >
                  <TableIcon className="w-4 h-4" />
                </button>
                <button
                  className={`p-2 rounded transition-colors ${buttonClasses}`}
                  title="Add column before"
                  onClick={() => editor.chain().focus().addColumnBefore().run()}>
                  <PlusCircle className="w-4 h-4" />
                </button>

                <button
                  className={`p-2 rounded transition-colors ${buttonClasses}`}
                  title="Add column after"
                  onClick={() => editor.chain().focus().addColumnAfter().run()}
                >
                  <PlusSquare className="w-4 h-4" />
                </button>

                <button
                  className={`p-2 rounded transition-colors ${buttonClasses}`}
                  title="Delete column"
                  onClick={() => editor.chain().focus().deleteColumn().run()}
                >
                  <MinusSquare className="w-4 h-4" />
                </button>

                <button
                  className={`p-2 rounded transition-colors ${buttonClasses}`}
                  title="Add row before"
                  onClick={() => editor.chain().focus().addRowBefore().run()}
                >
                  <ArrowUp className="w-4 h-4" />
                </button>

                <button
                  className={`p-2 rounded transition-colors ${buttonClasses}`}
                  title="Add row after"
                  onClick={() => editor.chain().focus().addRowAfter().run()}
                >
                  <ArrowDown className="w-4 h-4" />
                </button>

                <button
                  className={`p-2 rounded transition-colors ${buttonClasses}`}
                  title="Delete row"
                  onClick={() => editor.chain().focus().deleteRow().run()}
                >
                  <MinusCircle className="w-4 h-4" />
                </button>

                <button
                  className={`p-2 rounded transition-colors ${buttonClasses}`}
                  title="Delete table"
                  onClick={() => editor.chain().focus().deleteTable().run()}
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <button
                  className={`p-2 rounded transition-colors ${buttonClasses}`}
                  title="Merge cells"
                  onClick={() => editor.chain().focus().mergeCells().run()}
                >
                  <Merge className="w-4 h-4" />
                </button>

                <button
                  className={`p-2 rounded transition-colors ${buttonClasses}`}
                  title="Split cell"
                  onClick={() => editor.chain().focus().splitCell().run()}
                >
                  <Split className="w-4 h-4" />
                </button>

                <button
                  className={`p-2 rounded transition-colors ${buttonClasses}`}
                  title="Toggle header column"
                  onClick={() => editor.chain().focus().toggleHeaderColumn().run()}
                >
                  <Columns2 className="w-4 h-4" />
                </button>

                <button
                  className={`p-2 rounded transition-colors ${buttonClasses}`}
                  title="Toggle header row"
                  onClick={() => editor.chain().focus().toggleHeaderRow().run()}
                >
                  <LayoutList className="w-4 h-4" />
                </button>

                <button
                  className={`p-2 rounded transition-colors ${buttonClasses}`}
                  title="Toggle header cell"
                  onClick={() => editor.chain().focus().toggleHeaderCell().run()}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>

                <button
                  className={`p-2 rounded transition-colors ${buttonClasses}`}
                  title="Merge or split"
                  onClick={() => editor.chain().focus().mergeOrSplit().run()}
                >
                  <DivideSquare className="w-4 h-4" />
                </button>

                <button
                  className={`p-2 rounded transition-colors ${buttonClasses}`}
                  title="Set cell attribute (colspan 2)"
                  onClick={() => editor.chain().focus().setCellAttribute('colspan', 2).run()}
                >
                  <TableProperties className="w-4 h-4" />
                </button>

                <button
                  className={`p-2 rounded transition-colors ${buttonClasses}`}
                  title="Fix tables"
                  onClick={() => editor.chain().focus().fixTables().run()}
                >
                  <Wand2 className="w-4 h-4" />
                </button>

                <button
                  className={`p-2 rounded transition-colors ${buttonClasses}`}
                  title="Go to next cell"
                  onClick={() => editor.chain().focus().goToNextCell().run()}
                >
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  className={`p-2 rounded transition-colors ${buttonClasses}`}
                  title="Go to previous cell"
                  onClick={() => editor.chain().focus().goToPreviousCell().run()}
                >
                  <ArrowLeft className="w-4 h-4" />
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
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div
            className={`p-6 rounded-xl w-[340px] shadow-xl border ${isDarkMode
              ? 'bg-gray-800 border-gray-700 text-gray-100'
              : 'bg-white border-gray-200 text-gray-900'
              }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-semibold tracking-tight">Download Format</h2>
              <button
                onClick={() => setOpen(false)}
                title="Close"
                className={`rounded-full p-1 ${buttonClasses} hover:bg-gray-200 dark:hover:bg-gray-700`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Options */}
            <div className="space-y-3">
              <button
                onClick={() => saveContent('html')}
                title="Download as .html"
                className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:shadow-md transition ${buttonClasses}`}
              >
                <FileText className="w-5 h-5" />
                HTML (.html)
              </button>

              <button
                onClick={() => saveContent('docx')}
                title="Download as .docx"
                className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:shadow-md transition ${buttonClasses}`}
              >
                <FileDown className="w-5 h-5" />
                Word (.docx)
              </button>

              <button
                onClick={() => saveContent('pdf')}
                title="Download as .pdf"
                className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:shadow-md transition ${buttonClasses}`}
              >
                <FileArchive className="w-5 h-5" />
                PDF (.pdf)
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  )
}

export default RichTextEditor