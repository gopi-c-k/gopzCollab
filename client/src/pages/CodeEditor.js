import React, { useState, useRef, useEffect, useCallback } from 'react';

// Utility to generate unique IDs
const generateId = () => Math.random().toString(36).substring(2, 9);

// Define LANGUAGE_VERSIONS and CODE_SNIPPETS directly within the component for this environment
const LANGUAGE_VERSIONS = {
  javascript: "18.15.0",
  typescript: "5.0.3",
  python: "3.10.0",
  java: "15.0.2",
  csharp: "6.12.0",
  php: "8.2.3",
  cpp: "10.2.0", // Changed from "latest" to a specific version to fix API error
  html: "latest", // Piston API doesn't "execute" HTML directly, but we can simulate
  css: "latest",  // Piston API doesn't "execute" CSS directly, but we can simulate
  json: "latest", // Piston API doesn't "execute" JSON directly, but we can simulate
  markdown: "latest", // Markdown is not executable
  plaintext: "latest", // Plaintext is not executable
};

const CODE_SNIPPETS = {
  javascript: `function greet(name) { // Corrected: 'f' was missing
  console.log('Hello, ' + name + '!');
}
greet("Alex"); // Try changing "Alex" to your name!
`,
  typescript: `type Params = {
  name: string;
}
function greet(data: Params) {
  console.log("Hello, " + data.name + "!");
}
greet({ name: "Alex" }); // Try changing "Alex" to your name and see the TypeScript simulation!
`,
  python: `def greet(name):\n\tprint("Hello, " + name + "!")\n\ngreet("Alex") # Change "Alex" to your name for a simulated Python output!\n`,
  java: `public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello World from Java!"); // Change this message!
    }
}
`,
  csharp:
    'using System;\n\nnamespace HelloWorld\n{\n\tclass Hello { \n\t\tstatic void Main(string[] args) {\n\t\t\tConsole.WriteLine("Hello World in C#");\n\t\t}\n\t}\n}\n',
  php: "<?php\n\n$name = 'Alex';\necho 'Hello from PHP, ' . $name . '!';\n// Try changing the name variable!\n",
  cpp: `#include <iostream>

int main() {
    std::cout << "Hello World from C++!" << std::endl; // Change this message!
    return 0;
}
`, // Added C++ snippet
  html: `<!DOCTYPE html>
<html>
<head>
  <title>New HTML File</title>
</head>
<body>
  <h1>This is a new HTML file!</h1>
  <p>HTML is for rendering, not execution. Open in a browser to view!</p>
</body>
</html>`,
  css: `/* New CSS File */
body {
  background-color: #282c34;
  color: white;
}
/* CSS defines styles, it is not directly executable. */`,
  json: `{
  "key": "value",
  "data": [1, 2, 3],
  "message": "This is a JSON file. Use a validator to check its syntax."
}`,
  markdown: `# Markdown File Example
## This is a heading
- List item 1
- List item 2
Markdown is a markup language, not executable code.`,
  plaintext: `This is a plain text file.
You can write anything here, but it's not executable code.`,
};

// Default file content for different languages, now utilizing CODE_SNIPPETS
const getDefaultContent = (lang) => {
  return CODE_SNIPPETS[lang] || `// No snippet available for ${lang}`;
};

// --- START: New axios mock using fetch for real API calls ---
const mockAxios = {
  create: ({ baseURL }) => ({
    post: async (endpoint, data) => {
      const url = `${baseURL}${endpoint}`;
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorText = await response.text(); // Get raw text for better debugging
          let errorMessage = `HTTP error! Status: ${response.status}`;
          try {
            const errorJson = JSON.parse(errorText);
            errorMessage += `, Message: ${errorJson.message || JSON.stringify(errorJson)}`;
          } catch (e) {
            errorMessage += `, Response: ${errorText.substring(0, 200)}...`; // Truncate long responses
          }
          throw new Error(errorMessage);
        }
        return { data: await response.json() };
      } catch (error) {
        console.error("Error during API call:", error);
        // Re-throw to be caught by the calling function's try-catch
        throw error;
      }
    },
  }),
};
// --- END: New axios mock using fetch for real API calls ---


// --- START: The executeCode function provided by the user, modified to use mockAxios ---
const executeCode = async (language, sourceCode) => {
  const API_INSTANCE = mockAxios.create({
    baseURL: "https://emkc.org/api/v2/piston",
  });

  const response = await API_INSTANCE.post("/execute", {
    language: language,
    version: LANGUAGE_VERSIONS[language],
    files: [
      {
        content: sourceCode,
      },
    ],
  });
  return response.data;
};
// --- END: The executeCode function provided by the user ---


// Main App component
function App() {
  const [theme, setTheme] = useState('vs-dark');
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const editorContainerRef = useRef(null);
  const [editorLoaded, setEditorLoaded] = useState(false);
  const [panelHeight, setPanelHeight] = useState(200);
  const [isResizingPanel, setIsResizingPanel] = useState(false);
  const [activePanelTab, setActivePanelTab] = useState('terminal');
  const [explorerWidth, setExplorerWidth] = useState(250);
  const [isResizingExplorer, setIsResizingExplorer] = useState(false);
  const [explorerSplitHeight, setExplorerSplitHeight] = useState(0.7);
  const [isResizingExplorerSplit, setIsResizingExplorerSplit] = useState(false);
  const explorerContentRef = useRef(null);
  const openEditorsContentRef = useRef(null);
  const [terminalOutput, setTerminalOutput] = useState(`$ Welcome to VSCode Lite Terminal!
$ Click 'Run' to execute code.
`);
  const [outputDisplayContent, setOutputDisplayContent] = useState(''); // New state for output tab content
  const [isLoadingCode, setIsLoadingCode] = useState(false); // State for loading indicator

  // State for context menu
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    item: null, // The file/folder item that was right-clicked
  });

  // State for inline file/folder creation
  const [creatingNewItem, setCreatingNewItem] = useState({
    parentId: null,
    type: null, // 'file' or 'folder'
    name: '',
  });

  // State for selected item in explorer (distinct from active file)
  const [selectedItemId, setSelectedItemId] = useState(null);

  // State for file system and open editors
  const [fileSystem, setFileSystem] = useState([
    // Initial file system will have only one file
    { id: generateId(), name: 'main.js', type: 'file', language: 'javascript', content: getDefaultContent('javascript') },
  ]);
  const [openEditors, setOpenEditors] = useState([]);
  const [activeFileId, setActiveFileId] = useState(null);
  const [activeFileName, setActiveFileName] = useState('');
  const [activeFileLanguage, setActiveFileLanguage] = useState('javascript');

  // State to track the currently dragged item's ID in open editors
  const [draggedOpenEditorId, setDraggedOpenEditorId] = useState(null);


  // Update content of a file in the file system
  // Moved this definition up to avoid "Cannot access before initialization"
  const updateFileContent = useCallback((fileId, newContent) => {
    setFileSystem(prevFileSystem => {
      const update = (items) => {
        return items.map(item => {
          if (item.id === fileId && item.type === 'file') {
            return { ...item, content: newContent };
          }
          if (item.type === 'folder' && item.children) {
            return { ...item, children: update(item.children) };
          }
          return item;
        });
      };
      return update(prevFileSystem);
    });
    setOpenEditors(prevOpenEditors =>
      prevOpenEditors.map(editor =>
        editor.id === fileId ? { ...editor, content: newContent } : editor
      )
    );
  }, [setFileSystem, setOpenEditors]);

  // Refs to hold the latest state values for Monaco editor callbacks
  const activeFileIdRef = useRef(null); // Initialize with null
  const updateFileContentRef = useRef(null); // Initialize with null

  // Update refs when their corresponding states/callbacks change
  useEffect(() => {
    activeFileIdRef.current = activeFileId;
  }, [activeFileId]);

  useEffect(() => {
    updateFileContentRef.current = updateFileContent;
  }, [updateFileContent]);


  // Function to get the path of a file/folder
  const getItemPath = useCallback((itemId, currentPath = '', currentItems = fileSystem) => {
    for (const item of currentItems) {
      const newPath = currentPath === '' ? item.name : `${currentPath}/${item.name}`;
      if (item.id === itemId) {
        return newPath;
      }
      if (item.type === 'folder' && item.children) {
        const foundPath = getItemPath(itemId, newPath, item.children);
        if (foundPath) return foundPath;
      }
    }
    return null;
  }, [fileSystem]);

  // Recursively flatten file system for easier lookup
  const flattenFileSystem = useCallback((items, result = []) => {
    items.forEach(item => {
      result.push(item);
      if (item.type === 'folder' && item.children) {
        flattenFileSystem(item.children, result);
      }
    });
    return result;
  }, []);


  const handleFileClick = useCallback((file) => {
    // Select the item visually in the explorer
    setSelectedItemId(file.id);
    if (file.type === 'file') {
      setActiveFileId(file.id);
      setOpenEditors(prev => {
        if (!prev.some(editor => editor.id === file.id)) {
          return [...prev, file];
        }
        return prev;
      });
    } else if (file.type === 'folder') {
      setFileSystem(prevFileSystem => {
        const toggleFolder = (items) => {
          return items.map(item => {
            if (item.id === file.id) {
              return { ...item, isOpen: !item.isOpen };
            }
            if (item.type === 'folder' && item.children) {
              return { ...item, children: toggleFolder(item.children) };
            }
            return item;
          });
        };
        return toggleFolder(prevFileSystem);
      });
    }
  }, [setOpenEditors, setFileSystem, setActiveFileId, setSelectedItemId]);

  const handleCloseEditor = useCallback((fileIdToClose) => {
    setOpenEditors(prev => {
      const newOpenEditors = prev.filter(editor => editor.id !== fileIdToClose);
      if (fileIdToClose === activeFileId) {
        setActiveFileId(newOpenEditors.length > 0 ? newOpenEditors[newOpenEditors.length - 1].id : null);
      }
      return newOpenEditors;
    });
  }, [activeFileId, setOpenEditors]);

  // Initiate inline file/folder creation (used by explorer buttons and context menu)
  const initiateNewItemCreation = useCallback((type, parentId, preferredExtension = null) => {
    let initialName = '';
    if (type === 'file' && preferredExtension) {
      initialName = `untitled.${preferredExtension}`;
    }
    setCreatingNewItem({ parentId, type, name: initialName });
    // If it's a folder, ensure it's open to show the new item input
    if (type === 'file' || type === 'folder') {
      setFileSystem(prevFileSystem => {
        const openParentFolder = (items) => {
          return items.map(item => {
            if (item.id === parentId && item.type === 'folder') {
              return { ...item, isOpen: true };
            }
            if (item.type === 'folder' && item.children) {
              return { ...item, children: openParentFolder(item.children) };
            }
            return item;
          });
        };
        // If parentId is null (root), no need to open a specific folder
        if (parentId === null) return prevFileSystem;
        return openParentFolder(prevFileSystem);
      });
    }
  }, [setCreatingNewItem, setFileSystem]);

  // Handle new item name change for inline input
  const handleNewItemNameChange = useCallback((e) => {
    setCreatingNewItem(prev => ({ ...prev, name: e.target.value }));
  }, [setCreatingNewItem]);

  // Handle new item submission (on Enter or blur)
  const handleNewItemSubmit = useCallback((e, parentId, type, name) => {
    if (e.key === 'Enter' || e.type === 'blur') {
      const itemName = name.trim();
      if (!itemName) {
        setCreatingNewItem({ parentId: null, type: null, name: '' }); // Discard if empty
        return;
      }

      // Determine file extension and language based on the entered name
      const fileExtension = itemName.includes('.') ? itemName.split('.').pop() : 'txt';
      // Map common extensions to their language keys, or default to plaintext
      const languageMap = {
        js: 'javascript',
        ts: 'typescript',
        py: 'python',
        java: 'java',
        cs: 'csharp',
        php: 'php',
        cpp: 'cpp', // Explicitly map cpp extension
        html: 'html',
        css: 'css',
        json: 'json',
        md: 'markdown',
        txt: 'plaintext',
      };
      const newItemLanguage = type === 'file' ? (languageMap[fileExtension] || 'plaintext') : undefined;

      const newItem = {
        id: generateId(),
        name: itemName,
        type: type,
        language: newItemLanguage,
        content: type === 'file' ? getDefaultContent(newItemLanguage) : undefined,
        isOpen: type === 'folder' ? false : undefined, // Folders are initially closed
        children: type === 'folder' ? [] : undefined,
      };

      setFileSystem(prevFileSystem => {
        const addToFileSystem = (items) => {
          if (parentId === null) {
            return [...items, newItem];
          }
          return items.map(item => {
            if (item.id === parentId && item.type === 'folder') {
              return { ...item, isOpen: true, children: [...(item.children || []), newItem] };
            }
            if (item.type === 'folder' && item.children) {
              return { ...item, children: addToFileSystem(item.children) };
            }
            return item;
          });
        };
        return addToFileSystem(prevFileSystem);
      });
      setCreatingNewItem({ parentId: null, type: null, name: '' }); // Clear creation state
      if (newItem.type === 'file') {
        handleFileClick(newItem); // Open the new file automatically
      }
    }
  }, [handleFileClick, setCreatingNewItem, setFileSystem]);

  const handleContextMenu = useCallback((e, item) => {
    e.preventDefault(); // Prevent default browser context menu
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      item: item,
    });
  }, [setContextMenu]);

  const handleCopyPath = useCallback(() => {
    if (contextMenu.item) {
      const fullPath = getItemPath(contextMenu.item.id);
      if (fullPath) {
        // Use document.execCommand('copy') as navigator.clipboard.writeText() may not work due to iFrame restrictions
        const tempInput = document.createElement('textarea');
        tempInput.value = fullPath;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
        setTerminalOutput(prev => prev + `\n$ Copied path: ${fullPath}`);
        setActivePanelTab('terminal');
      }
    }
    setContextMenu({ ...contextMenu, visible: false });
  }, [contextMenu, setTerminalOutput, setActivePanelTab, getItemPath]);

  const handleCopyRelativePath = useCallback(() => {
    if (contextMenu.item) {
      const fullPath = getItemPath(contextMenu.item.id);
      // For simplicity, let's just make it relative to the root for now.
      // In a real app, this would depend on the current "project root".
      const relativePath = fullPath ? fullPath.split('/').slice(1).join('/') : ''; // Remove first segment
      if (relativePath) {
        // Use document.execCommand('copy') as navigator.clipboard.writeText() may not work due to iFrame restrictions
        const tempInput = document.createElement('textarea');
        tempInput.value = relativePath;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
        setTerminalOutput(prev => prev + `\n$ Copied relative path: ${relativePath}`);
        setActivePanelTab('terminal');
      }
    }
    setContextMenu({ ...contextMenu, visible: false });
  }, [contextMenu, setTerminalOutput, setActivePanelTab, getItemPath]);

  const handleShare = useCallback(() => {
    if (contextMenu.item) {
      const itemName = contextMenu.item.name;
      setTerminalOutput(prev => prev + `\n$ Simulating share for "${itemName}". In a real app, this would open a share dialog.`);
      setActivePanelTab('terminal');
    }
    setContextMenu({ ...contextMenu, visible: false });
  }, [contextMenu, setTerminalOutput, setActivePanelTab]);

  // Function to delete an item
  const handleDeleteItem = useCallback((itemIdToDelete) => {
    setFileSystem(prevFileSystem => {
      const deleteFromFs = (items) => {
        return items.filter(item => {
          if (item.id === itemIdToDelete) {
            // If the item to delete is currently active in the editor or an open tab, close it
            if (activeFileId === itemIdToDelete) {
              setActiveFileId(null);
            }
            setOpenEditors(prev => prev.filter(editor => editor.id !== itemIdToDelete));
            if (selectedItemId === itemIdToDelete) {
              setSelectedItemId(null);
            }
            setTerminalOutput(prev => prev + `\n$ Deleted: ${getItemPath(itemIdToDelete)}`);
            return false; // Remove this item
          }
          if (item.type === 'folder' && item.children) {
            item.children = deleteFromFs(item.children);
          }
          return true; // Keep this item
        });
      };
      return deleteFromFs(prevFileSystem);
    });
    setContextMenu({ ...contextMenu, visible: false });
  }, [activeFileId, selectedItemId, setOpenEditors, setTerminalOutput, setFileSystem, contextMenu, getItemPath]);

  // Recursive rendering of file system items
  const renderFileSystem = (items, indent = 0) => {
    return items.map(item => (
      <React.Fragment key={item.id}>
        <div
          // Use selectedItemId for visual selection, activeFileId for open file
          className={`flex items-center p-1 rounded-md cursor-pointer hover:bg-gray-700 group
                      ${selectedItemId === item.id ? 'bg-blue-800 text-white' : ''}
                      ${activeFileId === item.id && selectedItemId !== item.id ? 'border-l-2 border-blue-500' : ''}
                     `}
          style={{ paddingLeft: `${indent * 10 + 8}px` }}
          onClick={() => handleFileClick(item)}
          onContextMenu={(e) => handleContextMenu(e, item)} // Right-click handler
        >
          {item.type === 'folder' ? (
            <span className="mr-1">{item.isOpen ? ' 📂 ' : ' 📁 '}</span>
          ) : (
            <span className="mr-1"> 📄 </span>
          )}
          <span className="truncate">{item.name}</span>
          {item.type === 'folder' && (
            <div className="flex space-x-1 ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-150 folder-icons">
              <button
                // Adjust icon color based on theme for better visibility
                className={`${theme === 'vs' ? 'text-gray-600' : 'text-gray-400'} hover:text-white p-0.5 rounded-sm`}
                onClick={(e) => { e.stopPropagation(); initiateNewItemCreation('file', item.id); }}
                title="New File in this folder"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-file-plus"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><path d="M14 2v6h6"/><path d="M12 18v-6"/><path d="M9 15h6"/></svg>
              </button>
              <button
                // Adjust icon color based on theme for better visibility
                className={`${theme === 'vs' ? 'text-gray-600' : 'text-gray-400'} hover:text-white p-0.5 rounded-sm`}
                onClick={(e) => { e.stopPropagation(); initiateNewItemCreation('folder', item.id); }}
                title="New Folder in this folder"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-folder-plus"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2v10z"/><line x1="12" x2="12" y1="11" y2="17"/><line x1="9" x2="15" y1="14" y2="14"/></svg>
              </button>
            </div>
          )}
        </div>
        {item.type === 'folder' && item.isOpen && item.children && renderFileSystem(item.children, indent + 1)}
        {item.id === creatingNewItem.parentId && item.isOpen && (
            <div className="flex items-center p-1" style={{ paddingLeft: `${(indent + 1) * 10 + 8}px` }}>
                <span className="mr-1">{creatingNewItem.type === 'folder' ? ' 📁 ' : ' 📄 '}</span>
                <input
                    type="text"
                    className={`new-item-input flex-grow
                      ${theme === 'vs' ? 'bg-white text-gray-900' : 'bg-gray-700 text-white'}
                      border border-blue-500 rounded px-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500`
                    }
                    value={creatingNewItem.name}
                    onChange={handleNewItemNameChange}
                    onKeyDown={(e) => handleNewItemSubmit(e, creatingNewItem.parentId, creatingNewItem.type, creatingNewItem.name)}
                    onBlur={(e) => handleNewItemSubmit(e, creatingNewItem.parentId, creatingNewItem.type, creatingNewItem.name)}
                    autoFocus
                />
            </div>
        )}
      </React.Fragment>
    ));
  };

  // Handle theme change
  const handleThemeChange = useCallback((e) => {
    setTheme(e.target.value);
  }, [setTheme]);

  // Handle language change (for new files created from top bar)
  const handleLanguageChange = useCallback((newLanguage) => {
    // Determine file extension
    const fileExtensionMap = {
      javascript: 'js',
      typescript: 'ts',
      python: 'py',
      java: 'java',
      csharp: 'cs',
      php: 'php',
      cpp: 'cpp', // Added C++ extension mapping
      html: 'html',
      css: 'css',
      json: 'json',
      markdown: 'md',
      plaintext: 'txt',
    };
    const fileExtension = fileExtensionMap[newLanguage] || 'txt';
    const newFileName = `untitled.${fileExtension}`;
    const newFileId = generateId();
    const newFile = {
      id: newFileId,
      name: newFileName,
      type: 'file',
      language: newLanguage,
      content: getDefaultContent(newLanguage),
    };
    // Add the new file to the root of the file system
    setFileSystem(prevFileSystem => [...prevFileSystem, newFile]);
    // Directly open the new file in the editor
    handleFileClick(newFile);
  }, [handleFileClick, setFileSystem]);

  // Handle panel resizing (mouse down)
  const handlePanelMouseDown = useCallback((e) => {
    setIsResizingPanel(true);
    document.body.style.cursor = 'ns-resize';
  }, [setIsResizingPanel]);

  // Handle explorer resizing (mouse down)
  const handleExplorerMouseDown = useCallback((e) => {
    setIsResizingExplorer(true);
    document.body.style.cursor = 'ew-resize';
  }, [setIsResizingExplorer]);

  // Handle explorer/open editors split resizing (mouse down)
  const handleExplorerSplitMouseDown = useCallback((e) => {
    setIsResizingExplorerSplit(true);
    document.body.style.cursor = 'ns-resize';
  }, [setIsResizingExplorerSplit]);

  // Handle global mouse move for resizing
  const handleMouseMove = useCallback((e) => {
    if (isResizingPanel) {
      const newHeight = window.innerHeight - e.clientY - 40;
      setPanelHeight(Math.max(50, Math.min(newHeight, window.innerHeight - 200)));
      if (editorRef.current) {
        editorRef.current.layout();
      }
    } else if (isResizingExplorer) {
      const newWidth = e.clientX;
      setExplorerWidth(Math.max(150, Math.min(newWidth, window.innerWidth / 2)));
      if (editorRef.current) {
        editorRef.current.layout();
      }
    } else if (isResizingExplorerSplit) {
        if (explorerContentRef.current && explorerContentRef.current.parentElement) {
            const sidebarRect = explorerContentRef.current.parentElement.getBoundingClientRect();
            const newSplitRatio = (e.clientY - sidebarRect.top) / sidebarRect.height;
            setExplorerSplitHeight(Math.max(0.2, Math.min(0.8, newSplitRatio)));
        }
    }
  }, [isResizingPanel, isResizingExplorer, isResizingExplorerSplit, setPanelHeight, setExplorerWidth, setExplorerSplitHeight, editorRef, explorerContentRef]);

  // Handle global mouse up to stop resizing
  const handleMouseUp = useCallback(() => {
    setIsResizingPanel(false);
    setIsResizingExplorer(false);
    setIsResizingExplorerSplit(false);
    document.body.style.cursor = 'default';
  }, [setIsResizingPanel, setIsResizingExplorer, setIsResizingExplorerSplit]);

  useEffect(() => {
    if (isResizingPanel || isResizingExplorer || isResizingExplorerSplit) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingPanel, isResizingExplorer, isResizingExplorerSplit, handleMouseMove, handleMouseUp]);

  // Handle code execution
  const handleRunCode = useCallback(async () => {
    if (!activeFileId) {
      setTerminalOutput(prev => prev + `\n$ No file is open to run.`);
      setActivePanelTab('terminal');
      return;
    }

    const currentFileContent = editorRef.current?.getValue() || '';
    const currentLanguage = activeFileLanguage;

    setTerminalOutput(prev => prev + `\n$ Running ${activeFileName} (${currentLanguage})...`);
    setIsLoadingCode(true); // Set loading state
    setActivePanelTab('terminal'); // Default to terminal when running

    try {
      if (['html', 'css', 'json', 'markdown', 'plaintext'].includes(currentLanguage)) {
        let simulatedOutput = '';
        if (currentLanguage === 'html') {
            simulatedOutput = "HTML content is for rendering in a browser, not direct execution. \n(Check the file content to 'see' the output.)";
        } else if (currentLanguage === 'css') {
            simulatedOutput = "CSS defines styles, it is not directly executable. \n(It modifies the appearance of HTML.)";
        } else if (currentLanguage === 'json') {
            try {
                JSON.parse(currentFileContent);
                simulatedOutput = "JSON is valid!";
            } catch (error) {
                simulatedOutput = `JSON Error: ${error.message}`;
            }
        } else if (currentLanguage === 'markdown') {
            simulatedOutput = "Markdown is a markup language, not executable code. \n(It's for formatted text.)";
        } else if (currentLanguage === 'plaintext') {
            simulatedOutput = "This is a plain text file, not executable code. \n(It contains raw unformatted text.)";
        } else {
            simulatedOutput = `Simulating execution for ${currentLanguage}... Code length: ${currentFileContent.length} characters.`;
        }
        setTerminalOutput(prev => prev + `\nOutput:\n${simulatedOutput}\n$ `);
        setOutputDisplayContent(simulatedOutput); // Set for output tab
        setActivePanelTab('output'); // Switch to output tab after simulated execution
      } else {
        const result = await executeCode(currentLanguage, currentFileContent);
        let displayOutput = '';

        // Prioritize stdout, then stderr
        if (result.run && result.run.stdout) {
            displayOutput = result.run.stdout;
            setTerminalOutput(prev => prev + `\nOutput:\n${result.run.stdout}\n$ `);
        } else if (result.run && result.run.stderr) {
            displayOutput = result.run.stderr;
            setTerminalOutput(prev => prev + `\nError:\n${result.run.stderr}\n$ `);
        } else {
            displayOutput = "Execution completed with no output.";
            setTerminalOutput(prev => prev + `\nExecution completed with no output.\n$ `);
        }
        setOutputDisplayContent(displayOutput); // Set for output tab
        setActivePanelTab('output'); // Switch to output tab after execution
      }
    } catch (error) {
      console.error("API execution error:", error);
      const errorMessage = error.message || 'An unknown error occurred during execution.';
      setTerminalOutput(prev => prev + `\nError: Failed to execute code via Piston API. ${errorMessage}\n$ `);
      setOutputDisplayContent(`Error: Failed to execute code via Piston API. ${errorMessage}`); // Set error for output tab
      setActivePanelTab('output'); // Switch to output tab on error
    } finally {
      setIsLoadingCode(false); // Reset loading state
    }
  }, [activeFileId, activeFileLanguage, setIsLoadingCode, setOutputDisplayContent, setTerminalOutput, setActivePanelTab, editorRef, activeFileName]);

  // Mock function to generate problems based on simple keywords
  const generateProblems = useCallback(() => {
    const problems = [];
    const flatFiles = flattenFileSystem(fileSystem);
    flatFiles.forEach(file => {
      if (file.type === 'file' && file.content) {
        if (file.language === 'javascript' || file.language === 'typescript') {
          if (file.content.includes('syntax error')) {
            problems.push(`Syntax error detected in ${file.name} (JS/TS).`);
          }
          if (file.content.includes('todo')) {
            problems.push(`TODO: Implement feature in ${file.name} (JS/TS).`);
          }
        } else if (file.language === 'python') {
          if (file.content.includes('IndentationError')) {
            problems.push(`Indentation error detected in ${file.name} (Python).`);
          }
        } else if (file.language === 'java') {
          if (file.content.includes('class Main')) {
              problems.push(`Info: Found 'class Main' in ${file.name} (Java).`);
          }
        } else if (file.language === 'cpp') { // Added C++ problem detection
          if (file.content.includes('#include <vector>')) {
            problems.push(`Info: C++ code includes <vector>.`);
          }
          if (file.content.includes('segmentation fault')) {
            problems.push(`Runtime error: Possible segmentation fault in ${file.name} (C++).`);
          }
        }
      }
    });
    return problems.length > 0 ? problems : ["No problems detected."];
  }, [fileSystem, flattenFileSystem]);

  const handleTerminalClear = useCallback(() => {
    setTerminalOutput('$ Terminal Cleared.\n$ ');
  }, [setTerminalOutput]);

  // Effect to load Monaco Editor scripts and create the editor instance ONCE
  useEffect(() => {
    // Fix: Explicitly configure Monaco workers for better loading in sandboxed environments
    if (!window.monaco) {
        // Use window.self to explicitly refer to the global object,
        // which can help with 'no-restricted-globals' ESLint rules in some environments.
        window.self.MonacoEnvironment = {
            getWorkerUrl: function (moduleId, label) {
                if (label === 'json') {
                    return 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.29.1/min/vs/language/json/json.worker.js';
                }
                if (label === 'css' || label === 'scss' || label === 'less') {
                    return 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.29.1/min/vs/language/css/css.worker.js';
                }
                if (label === 'html' || label === 'handlebars' || label === 'razor') {
                    return 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.29.1/min/vs/language/html/html.worker.js';
                }
                if (label === 'typescript' || label === 'javascript') {
                    return 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.29.1/min/vs/language/typescript/ts.worker.js';
                }
                return 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.29.1/min/vs/editor/editor.worker.js';
            }
        };

        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.29.1/min/vs/loader.min.js';
        script.async = true;
        script.onload = () => {
            window.require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.29.1/min/vs' } });
            window.require(['vs/editor/editor.main'], () => {
                monacoRef.current = window.monaco;
                setEditorLoaded(true); // Signal that Monaco is ready
                console.log('Monaco Editor scripts loaded from CDN.');

                // Create the editor instance if it hasn't been created yet
                if (!editorRef.current) {
                    editorRef.current = monacoRef.current.editor.create(editorContainerRef.current, {
                        value: '', // Start with empty value
                        language: 'plaintext', // Default language until a file is opened
                        theme: theme,
                        minimap: { enabled: true },
                        fontSize: 14,
                        scrollBeyondLastLine: false,
                        roundedSelection: true,
                        padding: {
                            top: 10,
                            bottom: 10
                        }
                    });

                    // Attach the content change listener ONCE during editor creation
                    editorRef.current.onDidChangeModelContent(() => {
                        // Use refs to get the latest values of activeFileId and updateFileContent
                        // This prevents stale closures.
                        if (activeFileIdRef.current && updateFileContentRef.current) { // Added check for updateFileContentRef.current
                            const newContent = editorRef.current.getValue();
                            updateFileContentRef.current(activeFileIdRef.current, newContent);
                        }
                    });

                    const handleResize = () => {
                        editorRef.current?.layout();
                    };
                    window.addEventListener('resize', handleResize);

                    // Cleanup for this effect: dispose editor and remove resize listener
                    return () => {
                        if (editorRef.current) {
                            editorRef.current.dispose();
                            editorRef.current = null;
                        }
                        window.removeEventListener('resize', handleResize);
                    };
                }
            });
        };
        document.body.appendChild(script);
        return () => {
            // Cleanup script tag if component unmounts before script loads
            if (script.parentNode) {
                script.parentNode.removeChild(script);
            }
        };
    } else if (editorLoaded && editorContainerRef.current && monacoRef.current && !editorRef.current) {
        // This case handles when monaco is already loaded (e.g., hot reload)
        // but editorRef.current is null, indicating it needs to be created.
        editorRef.current = monacoRef.current.editor.create(editorContainerRef.current, {
            value: '',
            language: 'plaintext',
            theme: theme,
            minimap: { enabled: true },
            fontSize: 14,
            scrollBeyondLastLine: false,
            roundedSelection: true,
            padding: {
                top: 10,
                bottom: 10
            }
        });
        editorRef.current.onDidChangeModelContent(() => {
            if (activeFileIdRef.current && updateFileContentRef.current) { // Added check for updateFileContentRef.current
                const newContent = editorRef.current.getValue();
                updateFileContentRef.current(activeFileIdRef.current, newContent);
            }
        });
        const handleResize = () => {
            editorRef.current?.layout();
        };
        window.addEventListener('resize', handleResize);
        return () => {
            if (editorRef.current) {
                editorRef.current.dispose();
                editorRef.current = null;
            }
            window.removeEventListener('resize', handleResize);
        };
    }
  }, [theme, editorLoaded]); // Dependencies: theme to apply on creation, editorLoaded to re-run after script loads

  // Effect to manage the active file and update the editor's model
  useEffect(() => {
    if (editorLoaded && monacoRef.current && editorRef.current) {
      if (activeFileId) {
        const flatFiles = flattenFileSystem(fileSystem);
        const file = flatFiles.find(f => f.id === activeFileId);

        if (file) {
          setActiveFileName(file.name);
          setActiveFileLanguage(file.language);

          const currentModel = editorRef.current.getModel();

          // Check if the current model in the editor is already for this file
          // Monaco uses URIs for models, so we can identify them this way.
          const newFileUri = monacoRef.current.Uri.parse(`file:///${file.id}`);

          if (currentModel && currentModel.uri.toString() === newFileUri.toString()) {
            // If it's the same file, only update content if it's different.
            // This prevents resetting the cursor/undo stack when user types.
            if (currentModel.getValue() !== file.content) {
                editorRef.current.executeEdits("my-source", [{
                    range: currentModel.getFullModelRange(),
                    text: file.content
                }]);
            }
            monacoRef.current.editor.setModelLanguage(currentModel, file.language);
          } else {
            // If it's a different file or no model, dispose current and create new one
            if (currentModel) {
              currentModel.dispose(); // Dispose the old model
            }
            const newModel = monacoRef.current.editor.createModel(file.content, file.language, newFileUri);
            editorRef.current.setModel(newModel);
            // Monaco will automatically set the language from the model, but this explicit call is harmless
            // monacoRef.current.editor.setModelLanguage(newModel, file.language);
          }
        }
      } else {
        // If no active file, set editor to a blank state
        if (editorRef.current.getModel()) {
          editorRef.current.getModel().dispose();
        }
        editorRef.current.setModel(null); // Clear the model
        setActiveFileName('No file open');
        setActiveFileLanguage('');
      }
    }
  }, [activeFileId, editorLoaded, fileSystem, flattenFileSystem, monacoRef, setActiveFileName, setActiveFileLanguage]); // Added setActiveFileName, setActiveFileLanguage to dependencies


  useEffect(() => {
    if (editorRef.current && monacoRef.current) {
      monacoRef.current.editor.setTheme(theme);
    }
  }, [theme]);

  // Handle click outside context menu or inline input to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (contextMenu.visible && !event.target.closest('.context-menu')) {
        setContextMenu({ ...contextMenu, visible: false });
      }
      // If clicking outside an active new item input, and the name is empty, discard it
      if (creatingNewItem.parentId !== null && !event.target.closest('.new-item-input')) {
        if (creatingNewItem.name === '') {
          setCreatingNewItem({ parentId: null, type: null, name: '' }); // Discard empty
        } else {
            // If there's a name, submit it on blur (simulate Enter)
            handleNewItemSubmit({ key: 'Enter' }, creatingNewItem.parentId, creatingNewItem.type, creatingNewItem.name);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [contextMenu, creatingNewItem, handleNewItemSubmit, setCreatingNewItem]);


  // Drag & Drop handlers for Open Editors
  const handleOpenEditorDragStart = useCallback((e, fileId) => {
    e.dataTransfer.setData('text/plain', fileId);
    setDraggedOpenEditorId(fileId);
    e.currentTarget.classList.add('opacity-50', 'border-dashed', 'border-blue-500'); // Visual feedback for dragging
  }, []);

  const handleOpenEditorDragEnd = useCallback((e) => {
    setDraggedOpenEditorId(null);
    e.currentTarget.classList.remove('opacity-50', 'border-dashed', 'border-blue-500');
  }, []);

  const handleOpenEditorDragOver = useCallback((e) => {
    e.preventDefault(); // Crucial to allow dropping
    const targetElement = e.currentTarget;
    if (targetElement.classList.contains('open-editor-item')) {
      targetElement.classList.add('border-blue-500', 'border-b-2'); // Indicate drop target
    }
  }, []);

  const handleOpenEditorDragLeave = useCallback((e) => {
    e.currentTarget.classList.remove('border-blue-500', 'border-b-2');
  }, []);

  const handleOpenEditorDrop = useCallback((e, targetFileId) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-blue-500', 'border-b-2'); // Remove drop target visual feedback

    const draggedFileId = e.dataTransfer.getData('text/plain');

    setOpenEditors(prevOpenEditors => {
      const draggedIndex = prevOpenEditors.findIndex(editor => editor.id === draggedFileId);
      const targetIndex = prevOpenEditors.findIndex(editor => editor.id === targetFileId);

      if (draggedIndex === -1 || targetIndex === -1 || draggedIndex === targetIndex) {
        return prevOpenEditors; // No change if invalid or same position
      }

      const newOpenEditors = [...prevOpenEditors];
      const [draggedItem] = newOpenEditors.splice(draggedIndex, 1);
      newOpenEditors.splice(targetIndex, 0, draggedItem);
      return newOpenEditors;
    });
  }, []);


  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900 font-sans text-gray-900 dark:text-gray-100">
      {/* Tailwind CSS for Inter font */}
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <style>
        {`
        body {
          font-family: 'Inter', sans-serif;
          overflow: hidden; /* Prevent body scroll */
        }
        /* Custom scrollbar for better aesthetics */
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #888;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: #555;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background-color: #f1f1f1;
        }
        /* Dark mode scrollbar */
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #555;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: #777;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-track {
          background-color: #333;
        }
        /* Editor specific scrollbar */
        .editor-container .monaco-editor .overflow-guard .monaco-scrollable-element ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .editor-container .monaco-editor .overflow-guard .monaco-scrollable-element ::-webkit-scrollbar-thumb {
          background-color: #888;
          border-radius: 4px;
        }
        .editor-container .monaco-editor .overflow-guard .monaco-scrollable-element ::-webkit-scrollbar-thumb:hover {
          background-color: #555;
        }
        .editor-container .monaco-editor .overflow-guard .monaco-scrollable-element ::-webkit-scrollbar-track {
          background-color: #f1f1f1;
        }
        .vs-dark .editor-container .monaco-editor .overflow-guard .monaco-scrollable-element ::-webkit-scrollbar-thumb {
          background-color: #555;
        }
        .vs-dark .editor-container .monaco-editor .overflow-guard .monaco-scrollable-element ::-webkit-scrollbar-thumb:hover {
          background-color: #777;
        }
        .vs-dark .editor-container .monaco-editor .overflow-guard .monaco-scrollable-element ::-webkit-scrollbar-track {
          background-color: #333;
        }
        /* Show hover icons for folder */
        .group:hover .folder-icons {
          opacity: 1;
        }
        `}
      </style>

      {/* Top Bar - mimicking VS Code's header */}
      <header className="bg-gray-800 text-white p-3 shadow-md flex items-center justify-between rounded-b-lg z-10">
        <div className="flex items-center space-x-4">
          <span className="text-xl font-bold">VSCode Lite</span>
          <div className="flex space-x-2">
            {Object.entries(LANGUAGE_VERSIONS).filter(([lang]) => !['html', 'css', 'json', 'markdown', 'plaintext'].includes(lang)).map(([lang, version]) => (
                <button
                    key={lang}
                    onClick={() => handleLanguageChange(lang)}
                    className={`px-3 py-1 text-white rounded-md transition-colors duration-200 shadow-sm
                        ${lang === activeFileLanguage ? 'bg-blue-600' : 'bg-gray-700 hover:bg-blue-600'}`}
                >
                    {lang.charAt(0).toUpperCase() + lang.slice(1)}
                </button>
            ))}
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <label htmlFor="theme-select" className="text-sm">Theme:</label>
          <select
            id="theme-select"
            value={theme}
            onChange={handleThemeChange}
            className="p-1 rounded-md bg-gray-700 text-white border border-gray-600 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="vs-dark">Dark</option>
            <option value="vs">Light</option>
            <option value="hc-black">High Contrast Black</option>
          </select>
          <button
            onClick={handleRunCode}
            className={`px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors duration-200 shadow-sm flex items-center space-x-1 ${isLoadingCode ? 'opacity-70 cursor-not-allowed' : ''}`}
            title="Run Code"
            disabled={isLoadingCode}
          >
            {isLoadingCode ? (
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-play"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            )}
            <span>{isLoadingCode ? 'Running...' : 'Run'}</span>
          </button>
        </div>
      </header>

      {/* Main Content Area: Sidebar + Editor + Bottom Panel */}
      <div className="flex flex-grow overflow-hidden">
        {/* Left Sidebar (Explorer) */}
        <div className="bg-gray-800 text-gray-300 flex flex-col p-2 shadow-xl border-r border-gray-700" style={{ width: explorerWidth, minWidth: '150px', maxWidth: '50%' }}>
          <div className="flex items-center justify-between font-bold text-xs uppercase mb-2 text-gray-400">
            Explorer
            <div className="flex space-x-1">
              <button
                onClick={() => initiateNewItemCreation('file', null)} // Add to root
                className="text-gray-400 hover:text-white px-1 rounded-sm"
                title="New File"
              >
                 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-file-plus"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><path d="M14 2v6h6"/><path d="M12 18v-6"/><path d="M9 15h6"/></svg>
              </button>
              <button
                className="text-gray-400 hover:text-white px-1 rounded-sm"
                onClick={() => initiateNewItemCreation('folder', null)} // Add to root
                title="New Folder"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-folder-plus"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2v10z"/><line x1="12" x2="12" y1="11" y2="17"/><line x1="9" x2="15" y1="14" y2="14"/></svg>
              </button>
            </div>
          </div>
          <div className="flex flex-col custom-scrollbar" ref={explorerContentRef} style={{height: `${explorerSplitHeight * 100}%`}}>
            {renderFileSystem(fileSystem)}
            {/* NEW BLOCK: For rendering new item input at the root level */}
            {creatingNewItem.parentId === null && creatingNewItem.type && (
                <div className="flex items-center p-1" style={{ paddingLeft: `8px` }}>
                    <span className="mr-1">{creatingNewItem.type === 'folder' ? ' 📁 ' : ' 📄 '}</span>
                    <input
                        type="text"
                        className={`new-item-input flex-grow
                          ${theme === 'vs' ? 'bg-white text-gray-900' : 'bg-gray-700 text-white'}
                          border border-blue-500 rounded px-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500`
                        }
                        value={creatingNewItem.name}
                        onChange={handleNewItemNameChange}
                        onKeyDown={(e) => handleNewItemSubmit(e, creatingNewItem.parentId, creatingNewItem.type, creatingNewItem.name)}
                        onBlur={(e) => handleNewItemSubmit(e, creatingNewItem.parentId, creatingNewItem.type, creatingNewItem.name)}
                        autoFocus
                    />
                </div>
            )}
          </div>

          {/* Resizer for Explorer/Open Editors split */}
          <div
            className="h-1 bg-gray-700 hover:bg-blue-500 cursor-ns-resize transition-colors duration-100 mx-2 rounded-lg"
            onMouseDown={handleExplorerSplitMouseDown}
          ></div>

          <div className="font-bold text-xs uppercase mt-2 mb-2 text-gray-400">Open Editors</div>
          <div className="flex flex-col space-y-1 text-sm custom-scrollbar" ref={openEditorsContentRef} style={{ height: `${(1 - explorerSplitHeight) * 100}%` }}>
            {openEditors.map(file => (
              <div
                key={file.id}
                className={`open-editor-item flex items-center justify-between p-1 rounded-md cursor-pointer hover:bg-gray-700
                            ${activeFileId === file.id ? 'bg-blue-800 text-white' : ''}
                            ${draggedOpenEditorId === file.id ? 'opacity-50 border-dashed border-blue-500' : ''}
                           `}
                onClick={() => handleFileClick(file)}
                onContextMenu={(e) => handleContextMenu(e, file)} // Right-click handler for open editors
                draggable // Make the item draggable
                onDragStart={(e) => handleOpenEditorDragStart(e, file.id)}
                onDragEnd={handleOpenEditorDragEnd}
                onDragOver={handleOpenEditorDragOver}
                onDrop={(e) => handleOpenEditorDrop(e, file.id)}
                // Removed onDragEnter as it was causing a ReferenceError
                onDragLeave={handleOpenEditorDragLeave}
              >
                <span className="truncate"> 📄  {file.name}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); handleCloseEditor(file.id); }}
                  className="ml-2 text-gray-400 hover:text-white px-1 rounded-sm"
                  title="Close Editor"
                >
                   ✖
                </button>
              </div>
            ))}
            {openEditors.length === 0 && <p className="text-gray-500 text-center text-xs p-2">No open editors</p>}
          </div>
        </div>

        {/* Explorer Resizer */}
        <div
          className="w-1 bg-gray-700 hover:bg-blue-500 cursor-ew-resize transition-colors duration-100"
          onMouseDown={handleExplorerMouseDown}
        ></div>

        {/* Editor and Bottom Panel Wrapper */}
        <div className="flex flex-col flex-grow">
          {/* Editor Area */}
          <div
            ref={editorContainerRef}
            className="flex-grow editor-container border border-gray-300 dark:border-gray-700 rounded-lg m-3 overflow-hidden shadow-lg"
            style={{ marginBottom: isResizingPanel ? '0' : '10px' }}
          >
            {!editorLoaded && (
              <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                Loading editor...
              </div>
            )}
            {editorLoaded && !activeFileId && (
              <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400 text-lg">
                Select a file from the Explorer to start editing.
              </div>
            )}
          </div>

          {/* Panel Resizer */}
          <div
            className="h-1 bg-gray-700 hover:bg-blue-500 cursor-ns-resize transition-colors duration-100 mx-3 rounded-b-lg"
            onMouseDown={handlePanelMouseDown}
          ></div>

          {/* Bottom Panel */}
          <div className="bg-gray-800 text-gray-300 mx-3 mb-3 p-2 rounded-lg shadow-xl flex flex-col" style={{ height: panelHeight, minHeight: '50px', maxHeight: '50vh' }}>
            <div className="flex border-b border-gray-700 mb-2">
              <button
                onClick={() => setActivePanelTab('problems')}
                className={`px-4 py-2 text-sm ${activePanelTab === 'problems' ? 'text-white border-b-2 border-blue-500' : 'text-gray-400 hover:text-white'}`}
              >
                Problems
              </button>
              <button
                onClick={() => setActivePanelTab('output')}
                className={`px-4 py-2 text-sm ${activePanelTab === 'output' ? 'text-white border-b-2 border-blue-500' : 'text-gray-400 hover:text-white'}`}
              >
                Output
              </button>
              <button
                onClick={() => setActivePanelTab('terminal')}
                className={`px-4 py-2 text-sm ${activePanelTab === 'terminal' ? 'text-white border-b-2 border-blue-500' : 'text-gray-400 hover:text-white'}`}
              >
                Terminal
              </button>
            </div>
            <div className="flex-grow overflow-auto text-sm bg-gray-900 p-2 rounded-md whitespace-pre-wrap">
              {activePanelTab === 'problems' && (
                <div className="text-yellow-400">
                  {generateProblems().map((problem, index) => (
                    <p key={index}> ⚠️  {problem}</p>
                  ))}
                  {/* Removed hardcoded Webpack messages */}
                </div>
              )}
              {activePanelTab === 'output' && (
                <div className="text-gray-400">
                  <pre>{outputDisplayContent || 'Click "Run Code" to see the output here.'}</pre>
                </div>
              )}
              {activePanelTab === 'terminal' && (
                <>
                  <pre className="text-green-400">{terminalOutput}</pre>
                  <button
                    onClick={handleTerminalClear}
                    className="mt-2 px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded-md"
                  >
                    Clear Terminal
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer - mimicking VS Code's status bar */}
      <footer className="bg-gray-800 text-white p-2 text-sm flex justify-between items-center rounded-t-lg shadow-inner z-10">
        <div className="flex items-center space-x-4">
          <span>&nbsp;</span> {/* Placeholder for left icons */}
          <span> 📄  {activeFileName} | {activeFileLanguage.toUpperCase()}</span>
        </div>
        <div className="flex items-center space-x-4">
          <span>UTF-8</span>
          <span>LF</span>
          <span><i className="fas fa-check-circle text-green-400"></i> No Errors</span>
          <span>Theme: {theme.replace('vs-', '').replace('-', ' ').toUpperCase()}</span>
        </div>
      </footer>

      {/* Context Menu */}
      {contextMenu.visible && (
        <div
          className="context-menu absolute bg-gray-700 p-1 rounded-md shadow-lg z-20"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          {contextMenu.item && contextMenu.item.type === 'folder' && (
            <>
              <button
                className="block w-full text-left px-3 py-1 text-sm text-gray-300 bg-gray-900 hover:bg-blue-600 hover:text-white rounded-sm"
                onClick={() => { initiateNewItemCreation('file', contextMenu.item.id); setContextMenu({...contextMenu, visible: false}); }}
              >
                New File
              </button>
              <button
                className="block w-full text-left px-3 py-1 text-sm text-gray-300 bg-gray-900 hover:bg-blue-600 hover:text-white rounded-sm"
                onClick={() => { initiateNewItemCreation('folder', contextMenu.item.id); setContextMenu({...contextMenu, visible: false}); }}
              >
                New Folder
              </button>
              <div className="border-t border-gray-600 my-1"></div>
            </>
          )}
          {contextMenu.item && (
            <>
              <button
                className="block w-full text-left px-3 py-1 text-sm text-gray-300 bg-gray-900 hover:bg-blue-600 hover:text-white rounded-sm"
                onClick={handleCopyPath}
              >
                Copy Path
              </button>
              <button
                className="block w-full text-left px-3 py-1 text-sm text-gray-300 bg-gray-900 hover:bg-blue-600 hover:text-white rounded-sm"
                onClick={handleCopyRelativePath}
              >
                Copy Relative Path
              </button>
              <button
                className="block w-full text-left px-3 py-1 text-sm text-gray-300 bg-gray-900 hover:bg-blue-600 hover:text-white rounded-sm"
                onClick={handleShare}
              >
                Share
              </button>
              <div className="border-t border-gray-600 my-1"></div>
              <button
                className="block w-full text-left px-3 py-1 text-sm text-red-400 bg-gray-900 hover:bg-red-600 hover:text-white rounded-sm"
                onClick={() => handleDeleteItem(contextMenu.item.id)}
              >
                Delete
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
