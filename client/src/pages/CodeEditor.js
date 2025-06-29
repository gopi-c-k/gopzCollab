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

// Simulate Axios API interaction for the Piston API
const simulateAxiosPost = async (url, data) => {
    console.log(`Simulating API call to ${url} with data:`, data);
    return new Promise(resolve => {
        setTimeout(() => {
            if (url.includes("/execute")) {
                let output = "";
                let stderr = "";
                let exitCode = 0;

                const language = data.language; // Language from the API request
                // Safely access content from the files array
                const sourceCode = data.files && data.files.length > 0 ? data.files[0].content : '';

                switch (language) {
                    case 'javascript':
                        try {
                            // Temporarily capture console.log output
                            const originalConsoleLog = console.log;
                            let jsOutput = '';
                            console.log = (...args) => { jsOutput += args.join(' ') + '\n'; };
                            new Function(sourceCode)(); // Execute JS code
                            console.log = originalConsoleLog; // Restore original console.log
                            output = jsOutput.trim();
                        } catch (e) {
                            stderr = e.message;
                            exitCode = 1;
                        }
                        break;
                    case 'python':
                        // Simple simulation for Python based on common patterns
                        if (sourceCode.includes("print")) {
                            output = `Simulated Python Output: Code length ${sourceCode.length} chars. Looks like a print statement was there!\n`;
                            const matches = sourceCode.match(/print\((.*?)\)/g);
                            if (matches) {
                                matches.forEach(match => {
                                    output += `-> Detected: ${match}\n`;
                                });
                            }
                        } else {
                            output = "Simulated Python execution complete (no print statements detected).";
                        }
                        break;
                    case 'java':
                        output = "Simulated Java Output: Java program executed.";
                        if (sourceCode.includes("System.out.println")) {
                            output += "\n-> Detected System.out.println statement.";
                        }
                        break;
                    case 'csharp':
                        output = "Simulated C# Output: C# program executed.";
                        if (sourceCode.includes("Console.WriteLine")) {
                            output += "\n-> Detected Console.WriteLine statement.";
                        }
                        break;
                    case 'php':
                        output = "Simulated PHP Output: PHP script ran.";
                        if (sourceCode.includes("echo")) {
                            output += "\n-> Detected 'echo' statement.";
                        }
                        break;
                    case 'typescript':
                        output = "Simulated TypeScript Output: Compiled to JavaScript and executed.";
                        if (sourceCode.includes("console.log")) {
                             const originalConsoleLog = console.log;
                            let tsOutput = '';
                            console.log = (...args) => { tsOutput += args.join(' ') + '\n'; };
                            // Basic regex to extract console.log like calls
                            const logMatches = sourceCode.match(/console\.log\((.*?)\)/g);
                            if (logMatches) {
                                logMatches.forEach(match => {
                                    tsOutput += `-> TS Log Detected: ${match}\n`;
                                });
                            }
                             console.log = originalConsoleLog;
                            output += `\n${tsOutput.trim()}`;
                        }
                        break;
                    // For HTML, CSS, JSON, Markdown, Plaintext, we return descriptive messages
                    case 'html':
                        output = "HTML content is for rendering in a browser, not direct execution. \n(Check the file content to 'see' the output.)";
                        break;
                    case 'css':
                        output = "CSS defines styles, it is not directly executable. \n(It modifies the appearance of HTML.)";
                        break;
                    case 'json':
                        try {
                            JSON.parse(sourceCode);
                            output = "JSON is valid.";
                        } catch (e) {
                            stderr = `JSON Parse Error: ${e.message}`;
                            exitCode = 1;
                        }
                        break;
                    case 'markdown':
                        output = "Markdown is a markup language, not executable code. \n(It's for formatted text.)";
                        break;
                    case 'plaintext':
                        output = "This is plain text, not executable code. \n(It contains raw unformatted text.)";
                        break;
                    default:
                        output = `Execution for language '${language}' is not supported by this simulator.`;
                }

                resolve({
                    data: {
                        run: {
                            stdout: output,
                            stderr: stderr,
                            code: exitCode,
                            signal: null,
                            output: output + stderr, // Combined output for simplicity
                        },
                        language: language,
                        version: data.version,
                    }
                });
            } else {
                resolve({ data: {} }); // Generic response for other endpoints
            }
        }, 1000); // Simulate network delay
    });
};

// The API object to mimic axios.create().post()
const API = {
    post: (endpoint, data) => {
        // Ensure data.files[0].content is passed as sourceCode to the simulator
        return simulateAxiosPost(endpoint, {
            language: data.language,
            files: data.files, // Pass the entire files array as it is
            version: data.version
        });
    }
};

// The executeCode function from your provided snippet
export const executeCode = async (language, sourceCode) => {
  const response = await API.post("/execute", {
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

  // Update content of a file in the file system
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
  const initiateNewItemCreation = useCallback((type, parentId) => {
    setCreatingNewItem({ parentId, type, name: '' });
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

      const fileExtension = itemName.split('.').pop();
      const newItemLanguage = type === 'file' ? (Object.keys(LANGUAGE_VERSIONS).includes(fileExtension) ? fileExtension : 'plaintext') : undefined;

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
            <span className="mr-1">{item.isOpen ? '📂' : '📁'}</span>
          ) : (
            <span className="mr-1">📄</span>
          )}
          <span className="truncate">{item.name}</span>
          {item.type === 'folder' && (
            <div className="flex space-x-1 ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-150 folder-icons">
              <button
                className="text-gray-400 hover:text-white p-0.5 rounded-sm"
                onClick={(e) => { e.stopPropagation(); initiateNewItemCreation('file', item.id); }}
                title="New File in this folder"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-file-plus"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><path d="M14 2v6h6"/><path d="M12 18v-6"/><path d="M9 15h6"/></svg>
              </button>
              <button
                className="text-gray-400 hover:text-white p-0.5 rounded-sm"
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
                <span className="mr-1">{creatingNewItem.type === 'folder' ? '📁' : '📄'}</span>
                <input
                    type="text"
                    className="new-item-input flex-grow bg-gray-600 text-white border border-blue-500 rounded px-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
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
            simulatedOutput = "HTML content is for rendering in a browser, not direct execution.";
        } else if (currentLanguage === 'css') {
            simulatedOutput = "CSS defines styles, it is not directly executable.";
        } else if (currentLanguage === 'json') {
            try {
                JSON.parse(currentFileContent);
                simulatedOutput = "JSON is valid!";
            } catch (error) {
                simulatedOutput = `JSON Error: ${error.message}`;
            }
        } else {
            simulatedOutput = `Simulating execution for ${currentLanguage}... Code length: ${currentFileContent.length} characters.`;
        }
        setTerminalOutput(prev => prev + `\nOutput:\n${simulatedOutput}\n$ `);
        setOutputDisplayContent(simulatedOutput); // Set for output tab
        setActivePanelTab('output'); // Switch to output tab after simulated execution

      } else {
        const result = await executeCode(currentLanguage, currentFileContent);

        let displayOutput = '';
        if (result.run.stderr) {
          setTerminalOutput(prev => prev + `\nError:\n${result.run.stderr}\n$ `);
          displayOutput = result.run.stderr; // Show error in output tab too
        } else if (result.run.stdout) {
          setTerminalOutput(prev => prev + `\nOutput:\n${result.run.stdout}\n$ `);
          displayOutput = result.run.stdout; // Show stdout in output tab
        } else {
          setTerminalOutput(prev => prev + `\nExecution completed with no output.\n$ `);
          displayOutput = "Execution completed with no output.";
        }
        setOutputDisplayContent(displayOutput); // Set for output tab
        setActivePanelTab('output'); // Switch to output tab after execution
      }
    } catch (error) {
      console.error("API execution error:", error);
      setTerminalOutput(prev => prev + `\nError: Failed to execute code. Please check console for details. ${error.message || ''}\n$ `);
      setOutputDisplayContent(`Error: Failed to execute code. ${error.message || ''}`); // Set error for output tab
      setActivePanelTab('output'); // Switch to output tab on error
    } finally {
      setIsLoadingCode(false); // Reset loading state
    }
  }, [activeFileId, activeFileLanguage, executeCode, setIsLoadingCode, setOutputDisplayContent, setTerminalOutput, setActivePanelTab, editorRef, activeFileName]);

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
        }
      }
    });
    return problems.length > 0 ? problems : ["No problems detected."];
  }, [fileSystem, flattenFileSystem]);

  const handleTerminalClear = useCallback(() => {
    setTerminalOutput('$ Terminal Cleared.\n$ ');
  }, [setTerminalOutput]);

  // Load Monaco Editor scripts from CDN
  useEffect(() => {
    if (window.monaco) {
      monacoRef.current = window.monaco;
      setEditorLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.29.1/min/vs/loader.min.js';
    script.async = true;
    script.onload = () => {
      window.require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.29.1/min/vs' } });
      window.require(['vs/editor/editor.main'], () => {
        monacoRef.current = window.monaco;
        setEditorLoaded(true);
        console.log('Monaco Editor scripts loaded from CDN.');
      });
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Effect to manage the active file in the editor
  useEffect(() => {
    if (editorLoaded && editorContainerRef.current && monacoRef.current) {
      if (activeFileId) {
        const flatFiles = flattenFileSystem(fileSystem);
        const file = flatFiles.find(f => f.id === activeFileId);
        if (file) {
          setActiveFileName(file.name);
          setActiveFileLanguage(file.language);

          if (editorRef.current) {
            if (editorRef.current.getModel()) {
              editorRef.current.getModel().dispose();
            }
            const newModel = monacoRef.current.editor.createModel(file.content, file.language);
            editorRef.current.setModel(newModel);
            monacoRef.current.editor.setModelLanguage(newModel, file.language);
          } else {
            editorRef.current = monacoRef.current.editor.create(editorContainerRef.current, {
              value: file.content,
              language: file.language,
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
              const newContent = editorRef.current.getValue();
              updateFileContent(activeFileId, newContent);
            });

            const handleResize = () => {
              if (editorRef.current) {
                editorRef.current.layout();
              }
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
        }
      } else {
        if (editorRef.current) {
          editorRef.current.setValue('');
          editorRef.current.setModel(null);
        }
        setActiveFileName('No file open');
        setActiveFileLanguage('');
      }
    }
  }, [activeFileId, editorLoaded, fileSystem, theme, flattenFileSystem, updateFileContent]);

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
                onClick={() => initiateNewItemCreation('folder', null)} // Add to root
                className="text-gray-400 hover:text-white px-1 rounded-sm"
                title="New Folder"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-folder-plus"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2v10z"/><line x1="12" x2="12" y1="11" y2="17"/><line x1="9" x2="15" y1="14" y2="14"/></svg>
              </button>
            </div>
          </div>
          <div className="flex flex-col custom-scrollbar" ref={explorerContentRef} style={{height: `${explorerSplitHeight * 100}%`}}>
            {renderFileSystem(fileSystem)}
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
                className={`flex items-center justify-between p-1 rounded-md cursor-pointer hover:bg-gray-700 ${activeFileId === file.id ? 'bg-blue-800 text-white' : ''}`}
                onClick={() => handleFileClick(file)}
                onContextMenu={(e) => handleContextMenu(e, file)} // Right-click handler for open editors
              >
                <span className="truncate">📄 {file.name}</span>
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
                    <p key={index}>⚠️ {problem}</p>
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
          <span>📄 {activeFileName} | {activeFileLanguage.toUpperCase()}</span>
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
          className="context-menu absolute bg-gray-700 text-white p-1 rounded-md shadow-lg z-20"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          {contextMenu.item && contextMenu.item.type === 'folder' && (
            <>
              <button
                className="block w-full text-left px-3 py-1 text-sm hover:bg-blue-600 rounded-sm"
                onClick={() => { initiateNewItemCreation('file', contextMenu.item.id); setContextMenu({...contextMenu, visible: false}); }}
              >
                New File
              </button>
              <button
                className="block w-full text-left px-3 py-1 text-sm hover:bg-blue-600 rounded-sm"
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
                className="block w-full text-left px-3 py-1 text-sm hover:bg-blue-600 rounded-sm"
                onClick={handleCopyPath}
              >
                Copy Path
              </button>
              <button
                className="block w-full text-left px-3 py-1 text-sm hover:bg-blue-600 rounded-sm"
                onClick={handleCopyRelativePath}
              >
                Copy Relative Path
              </button>
              <button
                className="block w-full text-left px-3 py-1 text-sm hover:bg-blue-600 rounded-sm"
                onClick={handleShare}
              >
                Share
              </button>
              <div className="border-t border-gray-600 my-1"></div>
              <button
                className="block w-full text-left px-3 py-1 text-sm hover:bg-red-600 text-red-300 rounded-sm"
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


