import React from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import CodeBlock from '@tiptap/extension-code-block'
import Highlight from '@tiptap/extension-highlight'
import TextStyle from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import CharacterCount from '@tiptap/extension-character-count'
import TextAlign from '@tiptap/extension-text-align'

const MenuBar = ({ editor }) => {
  if (!editor) return null

  const buttons = [
    { label: 'Bold', action: () => editor.chain().focus().toggleBold().run(), active: editor.isActive('bold') },
    { label: 'Italic', action: () => editor.chain().focus().toggleItalic().run(), active: editor.isActive('italic') },
    { label: 'Underline', action: () => editor.chain().focus().toggleUnderline().run(), active: editor.isActive('underline') },
    { label: 'Strike', action: () => editor.chain().focus().toggleStrike().run() },
    { label: 'Code Block', action: () => editor.chain().focus().toggleCodeBlock().run() },
    { label: 'Quote', action: () => editor.chain().focus().toggleBlockquote().run() },
    { label: 'Paragraph', action: () => editor.chain().focus().setParagraph().run() },
    { label: 'H2', action: () => editor.chain().focus().setHeading({ level: 2 }).run() },
    { label: 'H3', action: () => editor.chain().focus().setHeading({ level: 3 }).run() },
    { label: '• List', action: () => editor.chain().focus().toggleBulletList().run() },
    { label: '1. List', action: () => editor.chain().focus().toggleOrderedList().run() },
    { label: 'HR', action: () => editor.chain().focus().setHorizontalRule().run() },
    {
      label: 'Link',
      action: () => {
        const url = window.prompt('Enter URL')
        if (url) editor.chain().focus().setLink({ href: url }).run()
      },
    },
    {
      label: 'Image',
      action: () => {
        const url = window.prompt('Enter Image URL')
        if (url) editor.chain().focus().setImage({ src: url }).run()
      },
    },
    {
      label: 'Highlight',
      action: () => editor.chain().focus().setColor('#F59E0B').run(),
    },
    {
      label: 'Clear',
      action: () => editor.chain().focus().unsetAllMarks().clearNodes().run(),
    },
  ]

  return React.createElement(
    'div',
    { className: 'flex flex-wrap gap-2 p-2 bg-gray-100 rounded mb-3' },
    buttons.map((btn, index) =>
      React.createElement(
        'button',
        {
          key: index,
          onClick: btn.action,
          className: `px-2 py-1 border rounded ${btn.active ? 'bg-blue-200 font-bold' : ''}`,
        },
        btn.label
      )
    )
  )
}

function Editor() {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link,
      Image,
      CodeBlock,
      Highlight,
      TextStyle,
      Color,
      CharacterCount.configure({ limit: 1000 }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content: '<p>Write your <strong>high-class content</strong> here ✨</p>',
  })

  return React.createElement(
    'div',
    { className: 'max-w-3xl mx-auto' },
    React.createElement(MenuBar, { editor }),
    React.createElement(EditorContent, {
      editor,
      className: 'border p-4 rounded min-h-[200px] ProseMirror',
    }),
    React.createElement(
      'p',
      { className: 'text-right mt-2 text-sm text-gray-500' },
      `${editor?.storage.characterCount.characters() || 0}/1000 characters`
    )
  )
}

export default Editor
