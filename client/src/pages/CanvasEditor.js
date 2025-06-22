import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ChromePicker } from 'react-color';
import {
  Edit,
  Image,
  Type,
  Square,
  Circle,
  Triangle,
  Minus,
  ArrowRight,
  Trash2,
  Layers,
  ChevronUp,
  ChevronDown,
  Download,
  Save,
  Undo,
  Redo,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Palette,
  Lock,
  Unlock,
  Users,
  Unlink,
  Sliders,
  Code,
  Link,
  Copy,
  Clipboard,
  Scissors,
  Eye,
  EyeOff,
  Grid,
  Ruler,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Plus,
  Search,
  Folder,
  File,
  Share2,
  Settings,
  HelpCircle,
  Sun,
  Moon,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  MousePointer,
  Move,
  Hexagon,
  Star,
  Zap,
  Eraser,
  Droplet,
  RefreshCw,
} from 'lucide-react';


const AdvancedCanvasEditor = () => {
  const canvasRef = useRef(null);
  const [ctx, setCtx] = useState(null);
  const [activeTool, setActiveTool] = useState('select');
  const [color, setColor] = useState('#000000');
  const [fillColor, setFillColor] = useState('#3b82f6');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [fontFamily, setFontFamily] = useState('Arial');
  const [fontSize, setFontSize] = useState(24);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentPos, setCurrentPos] = useState({ x: 0, y: 0 });
  const [objects, setObjects] = useState([]);
  const [selectedObject, setSelectedObject] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [zoom, setZoom] = useState(100);
  const [gridVisible, setGridVisible] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [showLayersPanel, setShowLayersPanel] = useState(true);
  const [showPropertiesPanel, setShowPropertiesPanel] = useState(true);
  const [brushSize, setBrushSize] = useState(10);
  const [canvasSize] = useState({ width: 1200, height: 800 });
  const [clipboard, setClipboard] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [lastX, setLastX] = useState(0);
  const [lastY, setLastY] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const eraserSize = brushSize || 20; // or a fixed value like 20



  // Color presets
  const colorPresets = [
    '#ffffff', '#f8fafc', '#e2e8f0', '#94a3b8', '#475569', '#1e293b', '#0f172a',
    '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e', '#10b981',
    '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7',
    '#d946ef', '#ec4899', '#f43f5e'
  ];

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    setCtx(context);

    // Set canvas size
    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;

    // Initial render
    renderCanvas(context);
    saveToHistory();
  }, []);

  // Render canvas
  const renderCanvas = useCallback((context = ctx) => {
    if (!context) return;

    // Clear canvas
    context.clearRect(0, 0, canvasSize.width, canvasSize.height);

    // Set background
    context.fillStyle = darkMode ? '#111827' : '#ffffff';
    context.fillRect(0, 0, canvasSize.width, canvasSize.height);

    // Draw grid if visible
    if (gridVisible) {
      drawGrid(context);
    }


    objects.forEach(obj => {
      context.save();

      if (obj.type === 'eraser') {
        // Set to erasing mode
        context.globalCompositeOperation = 'destination-out';
        context.strokeStyle = 'rgba(0,0,0,1)';
      } else {
        // Normal drawing mode
        context.globalCompositeOperation = 'source-over';
        context.strokeStyle = obj.stroke || '#000';
        context.fillStyle = obj.fill || 'transparent';
      }

      drawObject(context, obj);

      context.restore();
    });




    // Draw selection handles for selected object
    if (selectedObject) {
      drawSelectionHandles(context, selectedObject);
    }

    // Draw preview for current drawing
    if (isDrawing && activeTool !== 'brush' && activeTool !== 'eraser') {
      drawPreview(context);
    }
  }, [ctx, objects, selectedObject, isDrawing, darkMode, gridVisible, activeTool, startPos, currentPos, color, fillColor, strokeWidth, fontSize, fontFamily]);

  // Draw grid
  const drawGrid = (context) => {
    const gridSize = 20;
    context.strokeStyle = darkMode ? '#374151' : '#e5e7eb';
    context.lineWidth = 0.5;
    context.setLineDash([]);

    for (let x = 0; x <= canvasSize.width; x += gridSize) {
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, canvasSize.height);
      context.stroke();
    }

    for (let y = 0; y <= canvasSize.height; y += gridSize) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(canvasSize.width, y);
      context.stroke();
    }
  };

  // Draw object
  const drawObject = (context, obj) => {
    if (!obj.visible) return;

    context.save();
    context.globalAlpha = obj.opacity || 1;

    switch (obj.type) {
      case 'rectangle':
        context.fillStyle = obj.fill;
        context.strokeStyle = obj.stroke;
        context.lineWidth = obj.strokeWidth;
        context.fillRect(obj.x, obj.y, obj.width, obj.height);
        if (obj.strokeWidth > 0) {
          context.strokeRect(obj.x, obj.y, obj.width, obj.height);
        }
        break;

      case 'circle':
        context.beginPath();
        context.arc(obj.x + obj.radius, obj.y + obj.radius, obj.radius, 0, 2 * Math.PI);
        context.fillStyle = obj.fill;
        context.fill();
        if (obj.strokeWidth > 0) {
          context.strokeStyle = obj.stroke;
          context.lineWidth = obj.strokeWidth;
          context.stroke();
        }
        break;

      case 'line':
        context.beginPath();
        context.moveTo(obj.x1, obj.y1);
        context.lineTo(obj.x2, obj.y2);
        context.strokeStyle = obj.stroke;
        context.lineWidth = obj.strokeWidth;
        context.stroke();
        break;

      case 'text':
        context.font = `${obj.fontWeight || 'normal'} ${obj.fontStyle || 'normal'} ${obj.fontSize}px ${obj.fontFamily}`;
        context.fillStyle = obj.fill;
        context.fillText(obj.text, obj.x, obj.y);
        break;

      case 'brush':
        if (obj.points && obj.points.length > 1) {
          context.beginPath();
          context.moveTo(obj.points[0].x, obj.points[0].y);
          for (let i = 1; i < obj.points.length; i++) {
            context.lineTo(obj.points[i].x, obj.points[i].y);
          }
          context.strokeStyle = obj.stroke;
          context.lineWidth = obj.strokeWidth;
          context.lineCap = 'round';
          context.lineJoin = 'round';
          context.stroke();
        }
        break;
      case 'eraser':
        if (obj.points && obj.points.length > 1) {
          context.save();
          context.beginPath();
          context.moveTo(obj.points[0].x, obj.points[0].y);
          for (let i = 1; i < obj.points.length; i++) {
            context.lineTo(obj.points[i].x, obj.points[i].y);
          }
          context.strokeStyle = 'rgba(0,0,0,1)'; // color doesn't matter
          context.lineWidth = obj.strokeWidth || 10; // eraser size
          context.lineCap = 'round';
          context.lineJoin = 'round';
          context.globalCompositeOperation = 'destination-out';
          context.stroke();
          context.globalCompositeOperation = 'source-over';
          context.restore();
        }
        break;


      case 'triangle':
        context.beginPath();
        context.moveTo(obj.x + obj.width / 2, obj.y);
        context.lineTo(obj.x, obj.y + obj.height);
        context.lineTo(obj.x + obj.width, obj.y + obj.height);
        context.closePath();
        context.fillStyle = obj.fill;
        context.fill();
        if (obj.strokeWidth > 0) {
          context.strokeStyle = obj.stroke;
          context.lineWidth = obj.strokeWidth;
          context.stroke();
        }
        break;

      case 'star':
        drawStar(context, obj);
        break;

      case 'hexagon':
        drawHexagon(context, obj);
        break;
    }

    context.restore();
  };

  // Draw star
  const drawStar = (context, obj) => {
    const centerX = obj.x + obj.size;
    const centerY = obj.y + obj.size;
    const outerRadius = obj.size;
    const innerRadius = obj.size * 0.5;

    context.beginPath();
    for (let i = 0; i < 10; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (i * Math.PI) / 5 - Math.PI / 2;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      if (i === 0) {
        context.moveTo(x, y);
      } else {
        context.lineTo(x, y);
      }
    }
    context.closePath();
    context.fillStyle = obj.fill;
    context.fill();
    if (obj.strokeWidth > 0) {
      context.strokeStyle = obj.stroke;
      context.lineWidth = obj.strokeWidth;
      context.stroke();
    }
  };

  // Draw hexagon
  const drawHexagon = (context, obj) => {
    const centerX = obj.x + obj.size;
    const centerY = obj.y + obj.size;
    const radius = obj.size;

    context.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      if (i === 0) {
        context.moveTo(x, y);
      } else {
        context.lineTo(x, y);
      }
    }
    context.closePath();
    context.fillStyle = obj.fill;
    context.fill();
    if (obj.strokeWidth > 0) {
      context.strokeStyle = obj.stroke;
      context.lineWidth = obj.strokeWidth;
      context.stroke();
    }
  };

  // Draw selection handles
  const drawSelectionHandles = (context, obj) => {
    const bounds = getObjectBounds(obj);
    const handleSize = 8;

    context.fillStyle = '#3b82f6';
    context.strokeStyle = '#ffffff';
    context.lineWidth = 2;

    // Corner handles
    const handles = [
      { x: bounds.x - handleSize / 2, y: bounds.y - handleSize / 2 },
      { x: bounds.x + bounds.width - handleSize / 2, y: bounds.y - handleSize / 2 },
      { x: bounds.x + bounds.width - handleSize / 2, y: bounds.y + bounds.height - handleSize / 2 },
      { x: bounds.x - handleSize / 2, y: bounds.y + bounds.height - handleSize / 2 }
    ];

    handles.forEach(handle => {
      context.fillRect(handle.x, handle.y, handleSize, handleSize);
      context.strokeRect(handle.x, handle.y, handleSize, handleSize);
    });
  };

  // Draw preview
  const drawPreview = (context) => {
    context.save();
    context.setLineDash([5, 5]);
    context.strokeStyle = color;
    context.fillStyle = fillColor;
    context.lineWidth = strokeWidth;

    const width = currentPos.x - startPos.x;
    const height = currentPos.y - startPos.y;

    switch (activeTool) {
      case 'rectangle':
        context.strokeRect(startPos.x, startPos.y, width, height);
        break;
      case 'circle':
        const radius = Math.abs(width) / 2;
        context.beginPath();
        context.arc(startPos.x + width / 2, startPos.y + height / 2, radius, 0, 2 * Math.PI);
        context.stroke();
        break;
      case 'line':
        context.beginPath();
        context.moveTo(startPos.x, startPos.y);
        context.lineTo(currentPos.x, currentPos.y);
        context.stroke();
        break;
      case 'triangle':
        context.beginPath();
        context.moveTo(startPos.x + width / 2, startPos.y);
        context.lineTo(startPos.x, startPos.y + height);
        context.lineTo(startPos.x + width, startPos.y + height);
        context.closePath();
        context.stroke();
        break;
    }

    context.restore();
  };

  // Get object bounds
  const getObjectBounds = (obj) => {
    switch (obj.type) {
      case 'rectangle':
        return { x: obj.x, y: obj.y, width: obj.width, height: obj.height };
      case 'circle':
        return { x: obj.x, y: obj.y, width: obj.radius * 2, height: obj.radius * 2 };
      case 'text':
        ctx.font = `${obj.fontSize}px ${obj.fontFamily}`;
        const metrics = ctx.measureText(obj.text);
        return {
          x: obj.x,
          y: obj.y - obj.fontSize,
          width: metrics.width,
          height: obj.fontSize
        };
      case 'triangle':
        return { x: obj.x, y: obj.y, width: obj.width, height: obj.height };
      case 'star':
      case 'hexagon':
        return { x: obj.x, y: obj.y, width: obj.size * 2, height: obj.size * 2 };
      case 'line':
        return {
          x: Math.min(obj.x1, obj.x2),
          y: Math.min(obj.y1, obj.y2),
          width: Math.abs(obj.x2 - obj.x1),
          height: Math.abs(obj.y2 - obj.y1)
        };
      default:
        return { x: obj.x || 0, y: obj.y || 0, width: 100, height: 100 };
    }
  };

  // Mouse event handlers
  // Mouse event handlers
  const handleMouseDown = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setStartPos({ x, y });
    setCurrentPos({ x, y });

    if (activeTool === 'select') {
      const clickedObject = findObjectAtPosition(x, y);
      if (clickedObject) {
        setSelectedObject(clickedObject);
        const bounds = getObjectBounds(clickedObject);
        setDragOffset({ x: x - bounds.x, y: y - bounds.y });
      } else {
        setSelectedObject(null);
      }
    } else {
      setIsDrawing(true);

      if (activeTool === 'brush' || activeTool === 'eraser') {
        const newStroke = {
          id: Date.now(),
          type: activeTool,
          points: [{ x, y }],
          stroke: activeTool === 'eraser' ? 'transparent' : color,
          strokeWidth: brushSize,
          visible: true
        };
        setObjects(prev => [...prev, newStroke]);
      }
    }
  };

  const handleMouseMove = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x, y });


    setCurrentPos({ x, y });

    if (isDrawing && (activeTool === 'brush' || activeTool === 'eraser')) {
      setObjects(prev => {
        const newObjects = [...prev];
        const lastObject = newObjects[newObjects.length - 1];
        if (lastObject && lastObject.type === activeTool) {
          lastObject.points.push({ x, y });
        }
        return newObjects;
      });
      renderCanvas();
    }

    if (!isDrawing && selectedObject && activeTool === 'select' && e.buttons === 1) {
      const newX = x - dragOffset.x;
      const newY = y - dragOffset.y;

      setObjects(prev =>
        prev.map(obj =>
          obj.id === selectedObject.id
            ? { ...obj, x: newX, y: newY }
            : obj
        )
      );

      setSelectedObject(prev => ({ ...prev, x: newX, y: newY }));
      renderCanvas();
    }
  };

  const handleMouseUp = () => {
    if (isDrawing && activeTool !== 'brush' && activeTool !== 'eraser') {
      const width = currentPos.x - startPos.x;
      const height = currentPos.y - startPos.y;

      let newObject = {
        id: Date.now(),
        visible: true,
        stroke: color,
        fill: fillColor,
        strokeWidth: strokeWidth
      };

      switch (activeTool) {
        case 'rectangle':
          newObject = {
            ...newObject,
            type: 'rectangle',
            x: Math.min(startPos.x, currentPos.x),
            y: Math.min(startPos.y, currentPos.y),
            width: Math.abs(width),
            height: Math.abs(height)
          };
          break;
        case 'circle':
          const radius = Math.abs(width) / 2;
          newObject = {
            ...newObject,
            type: 'circle',
            x: Math.min(startPos.x, currentPos.x),
            y: Math.min(startPos.y, currentPos.y),
            radius
          };
          break;
        case 'triangle':
          newObject = {
            ...newObject,
            type: 'triangle',
            x: Math.min(startPos.x, currentPos.x),
            y: Math.min(startPos.y, currentPos.y),
            width: Math.abs(width),
            height: Math.abs(height)
          };
          break;
        case 'line':
          newObject = {
            ...newObject,
            type: 'line',
            x1: startPos.x,
            y1: startPos.y,
            x2: currentPos.x,
            y2: currentPos.y
          };
          break;
        case 'star':
          newObject = {
            ...newObject,
            type: 'star',
            x: Math.min(startPos.x, currentPos.x),
            y: Math.min(startPos.y, currentPos.y),
            size: Math.abs(width) / 2
          };
          break;
        case 'hexagon':
          newObject = {
            ...newObject,
            type: 'hexagon',
            x: Math.min(startPos.x, currentPos.x),
            y: Math.min(startPos.y, currentPos.y),
            size: Math.abs(width) / 2
          };
          break;
      }

      if (Math.abs(width) > 5 || Math.abs(height) > 5) {
        setObjects(prev => [...prev, newObject]);
        saveToHistory();
      }
    }

    setIsDrawing(false);
    renderCanvas(); // ✅ Always re-render on mouse up
  };

  // Find object at position
  const findObjectAtPosition = (x, y) => {
    for (let i = objects.length - 1; i >= 0; i--) {
      const obj = objects[i];
      const bounds = getObjectBounds(obj);

      if (x >= bounds.x && x <= bounds.x + bounds.width &&
        y >= bounds.y && y <= bounds.y + bounds.height) {
        return obj;
      }
    }
    return null;
  };

  // Add text
  const addText = () => {
    const newText = {
      id: Date.now(),
      type: 'text',
      x: 100,
      y: 100,
      text: 'Double click to edit',
      fontSize: fontSize,
      fontFamily: fontFamily,
      fill: color,
      visible: true
    };
    setObjects(prev => [...prev, newText]);
    setSelectedObject(newText);
    saveToHistory();
    renderCanvas();
  };

  // History management
  const saveToHistory = () => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.stringify(objects));
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const prevState = JSON.parse(history[historyIndex - 1]);
      setObjects(prevState);
      setHistoryIndex(historyIndex - 1);
      setSelectedObject(null);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const nextState = JSON.parse(history[historyIndex + 1]);
      setObjects(nextState);
      setHistoryIndex(historyIndex + 1);
      setSelectedObject(null);
    }
  };

  // Object operations
  const deleteAll = () => {
    setObjects([]);              // Clear all drawn objects
    setSelectedObject(null);     // Clear any selection
    setClipboard(null);          // Optional: clear clipboard
    saveToHistory();             // Optional: save action to undo stack
    renderCanvas();              // Re-render canvas
  };


  const duplicateSelected = () => {
    if (selectedObject) {
      const newObject = {
        ...selectedObject,
        id: Date.now(),
        x: selectedObject.x + 20,
        y: selectedObject.y + 20
      };
      setObjects(prev => [...prev, newObject]);
      setSelectedObject(newObject);
      saveToHistory();
      renderCanvas();
    }
  };
  const copyAll = () => {
    if (objects.length > 0) {
      const copied = objects.map(obj => ({
        ...obj,
        ...(obj.points ? { points: obj.points.map(p => ({ ...p })) } : {})
      }));
      setClipboard(copied);
    }
  };



  const paste = () => {
    if (clipboard && Array.isArray(clipboard)) {
      const offset = 20;
      const newObjects = clipboard.map(obj => {
        const newObj = { ...obj, id: Date.now() + Math.random() };

        if (obj.points) {
          newObj.points = obj.points.map(p => ({
            x: p.x + offset,
            y: p.y + offset
          }));
        } else if ('x' in obj && 'y' in obj) {
          newObj.x += offset;
          newObj.y += offset;
        } else if ('x1' in obj && 'x2' in obj) {
          newObj.x1 += offset;
          newObj.y1 += offset;
          newObj.x2 += offset;
          newObj.y2 += offset;
        }

        return newObj;
      });

      setObjects(prev => [...prev, ...newObjects]);
      setSelectedObject(null); // or set to first pasted item if needed
      saveToHistory();
      renderCanvas();
    }
  };


  // Layer operations
  const toggleObjectVisibility = (obj) => {
    setObjects(prev => prev.map(o =>
      o.id === obj.id ? { ...o, visible: !o.visible } : o
    ));
    renderCanvas();
  };

  const bringToFront = () => {
    if (selectedObject) {
      setObjects(prev => {
        const filtered = prev.filter(obj => obj.id !== selectedObject.id);
        return [...filtered, selectedObject];
      });
      renderCanvas();
    }
  };

  const sendToBack = () => {
    if (selectedObject) {
      setObjects(prev => {
        const filtered = prev.filter(obj => obj.id !== selectedObject.id);
        return [selectedObject, ...filtered];
      });
      renderCanvas();
    }
  };

  // Canvas operations
  const zoomIn = () => {
    const newZoom = Math.min(zoom + 25, 500);
    setZoom(newZoom);
  };

  const zoomOut = () => {
    const newZoom = Math.max(zoom - 25, 25);
    setZoom(newZoom);
  };
  const newFile = () => {
    if (window.confirm("Start a new file? This will clear all your work.")) {
      setObjects([]);               // Clear all drawn objects
      setSelectedObject(null);      // Deselect anything
      setClipboard(null);           // Clear clipboard
      setHistory([]);               // Reset undo history
      // setRedoStack([]);             // Reset redo stack
      renderCanvas();               // Re-render the cleared canvas
    }
  };


  const resetZoom = () => {
    setZoom(100);
  };

  const exportCanvas = (format = 'png') => {
    const canvas = canvasRef.current;
    const dataURL = canvas.toDataURL(`image/${format}`, 1.0);
    const link = document.createElement('a');
    link.download = `canvas-export.${format}`;
    link.href = dataURL;
    link.click();
  };

  const clearCanvas = () => {
    setObjects([]);
    setSelectedObject(null);
    saveToHistory();
    renderCanvas();
  };

  // Re-render when objects change
  useEffect(() => {

    renderCanvas();
  }, [objects, selectedObject, renderCanvas]);

  // UI Components
  const ToolButton = ({ icon: Icon, isActive, onClick, title, disabled = false }) => (
    <button
      className={`p-2 rounded-lg transition-all duration-200 ${disabled
        ? darkMode
          ? 'bg-gray-800 text-gray-500 cursor-not-allowed hover:text-white hover:bg-gray-600'
          : 'text-gray-500 cursor-not-allowed'
        : isActive
          ? 'bg-blue-600 text-white shadow-lg'
          : darkMode
            ? 'bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white'
            : 'text-gray-600 hover:bg-gray-100'
        }`}
      onClick={onClick}
      disabled={disabled}
      title={title}
    >
      <Icon size={18} />
    </button>
  );

  const ColorPicker = ({ value, onChange, label }) => (
    <div className="flex flex-col space-y-2">
      <label className={`text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
        {label}
      </label>
      <div className="flex items-center space-x-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 rounded border cursor-pointer"
        />
        <div className="flex flex-wrap gap-1">
          {colorPresets.slice(0, 8).map(color => (
            <button
              key={color}
              className="w-4 h-4 rounded border hover:scale-110 transition-transform"
              style={{ backgroundColor: color }}
              onClick={() => onChange(color)}
            />
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className={`flex flex-col h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Top Toolbar */}
      <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b px-4 py-3 flex items-center justify-between`}>
        <div className="flex items-center space-x-4">
          {/* File Operations */}
          <div className="flex items-center space-x-1">
            <ToolButton
              icon={File}
              onClick={newFile}
              title="New File"
            />
            <ToolButton
              icon={Folder}
              onClick={() => alert("Open functionality not implemented yet.")}
              title="Open"
            />
            <ToolButton
              icon={Save}
              onClick={() => exportCanvas('png')}
              title="Export PNG"
            />
            <ToolButton
              icon={Download}
              onClick={() => exportCanvas('svg')}
              title="Export SVG"
            />
          </div>


          <div className={`w-px h-6 ${darkMode ? 'bg-gray-600' : 'bg-gray-300'}`} />

          {/* Edit Operations */}
          <div className="flex items-center space-x-1">
            <ToolButton
              icon={Undo}
              onClick={undo}
              title="Undo (Ctrl+Z)"
              disabled={historyIndex <= 0}
            />

            <ToolButton
              icon={Redo}
              onClick={redo}
              title="Redo (Ctrl+Y)"
              disabled={historyIndex >= history.length - 1}
            />
            <ToolButton
              icon={Trash2} // Or use a different icon like Lucide's `Trash`
              onClick={deleteAll}
              title="Delete All"
            />

            <ToolButton
              icon={Copy}
              onClick={copyAll}
              title="Copy"
              disabled={objects.length === 0}
            />

            <ToolButton
              icon={Clipboard}
              onClick={paste}
              title="Paste"
              disabled={!clipboard || clipboard.length === 0}
            />
          </div>

          <div className={`w-px h-6 ${darkMode ? 'bg-gray-600' : 'bg-gray-300'}`} />

          {/* Zoom Controls */}
          <div className="flex items-center space-x-1">
            <ToolButton icon={ZoomOut} onClick={zoomOut} title="Zoom Out" />
            <span className={`px-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              {zoom}%
            </span>
            <ToolButton icon={ZoomIn} onClick={zoomIn} title="Zoom In" />
            <ToolButton icon={Maximize2} onClick={resetZoom} title="Reset Zoom" />
          </div>

          <div className={`w-px h-6 ${darkMode ? 'bg-gray-600' : 'bg-gray-300'}`} />

          {/* View Options */}
          <div className="flex items-center space-x-1">
            <ToolButton
              icon={Grid}
              isActive={gridVisible}
              onClick={() => setGridVisible(!gridVisible)}
              title="Toggle Grid"
            />
            <ToolButton
              icon={Layers}
              isActive={showLayersPanel}
              onClick={() => setShowLayersPanel(!showLayersPanel)}
              title="Toggle Layers Panel"

            />
            <ToolButton
              icon={RefreshCw}
              onClick={() => {
                setObjects([]);
                setSelectedObject(null);
                renderCanvas();
              }}
              title="Reset Canvas"
            />

          </div>
        </div>

        {/* Document Title */}
        <div className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Advanced Canvas Editor
        </div>

        {/* Right Controls */}
        <div className="flex items-center space-x-2">
          <ToolButton
            icon={darkMode ? Sun : Moon}
            onClick={() => setDarkMode(!darkMode)}
            title="Toggle Dark Mode"
          />
          <ToolButton icon={Share2} onClick={() => { }} title="Share" />
          <ToolButton icon={Settings} onClick={() => { }} title="Settings" />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Toolbar */}
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-r p-3 flex flex-col space-y-2 w-16`}>
          <ToolButton
            icon={MousePointer}
            isActive={activeTool === 'select'}
            onClick={() => setActiveTool('select')}
            title="Select Tool (V)"
          />

          <div className={`border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} my-2`} />

          <ToolButton
            icon={Type}
            isActive={activeTool === 'text'}
            onClick={() => { setActiveTool('text'); addText(); }}
            title="Text Tool (T)"
          />

          <ToolButton
            icon={Square}
            isActive={activeTool === 'rectangle'}
            onClick={() => setActiveTool('rectangle')}
            title="Rectangle"
          />

          <ToolButton
            icon={Circle}
            isActive={activeTool === 'circle'}
            onClick={() => setActiveTool('circle')}
            title="Circle"
          />

          <ToolButton
            icon={Triangle}
            isActive={activeTool === 'triangle'}
            onClick={() => setActiveTool('triangle')}
            title="Triangle"
          />

          <ToolButton
            icon={Minus}
            isActive={activeTool === 'line'}
            onClick={() => setActiveTool('line')}
            title="Line"
          />

          <ToolButton
            icon={Star}
            isActive={activeTool === 'star'}
            onClick={() => setActiveTool('star')}
            title="Star"
          />

          <ToolButton
            icon={Hexagon}
            isActive={activeTool === 'hexagon'}
            onClick={() => setActiveTool('hexagon')}
            title="Hexagon"
          />

          <div className={`border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} my-2`} />

          <ToolButton
            icon={Droplet}
            isActive={activeTool === 'brush'}
            onClick={() => setActiveTool('brush')}
            title="Brush"
          />

          <ToolButton
            icon={Eraser}
            isActive={activeTool === 'eraser'}
            onClick={() => setActiveTool('eraser')}
            title="Eraser"
          />
        </div>
        {/* File Actions */}





        {/* Canvas Area */}
        {/* Canvas Area */}
        <div className="flex-1 overflow-auto bg-gray-100 flex items-center justify-center">
          {/* scaled wrapper MUST be relative */}
          <div
            className="relative"
            style={{ transform: `scale(${zoom / 100})` }}
          >
            <canvas
              ref={canvasRef}
              className={`shadow-lg ${darkMode ? 'bg-gray-900' : 'bg-white'} ${activeTool === 'eraser'
                ? 'cursor-none'
                : activeTool === 'brush'
                  ? 'cursor-default'
                  : 'cursor-crosshair'
                }`}
              width={canvasSize.width}
              height={canvasSize.height}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            />


            {/* rectangular eraser preview */}
            {activeTool === 'eraser' && (
              <div
                className="pointer-events-none border border-red-500 bg-white/40 absolute"
                style={{
                  width: brushSize,
                  height: brushSize,
                  left: mousePos.x - brushSize / 2,
                  top: mousePos.y - brushSize / 2,
                }}
              />
            )}
          </div>
        </div>


        {/* Right Panels */}
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-l w-64 flex flex-col`}>
          {/* Properties Panel */}
          <div className={`p-4 ${darkMode ? 'border-gray-700' : 'border-gray-200'} border-b`}>
            <h3 className={`font-medium mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Properties
            </h3>

            <div className="space-y-4">
              <label className={`block mb-2 font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Stroke Color</label>
              <div className='flex items-center space-x-4'>
                <input
                  type='color'
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                />

                {/* Text input showing current color */}
                <input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="border p-2 rounded w-full"
                />
              </div>
              <label className={`block mb-2 font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Fill Color</label>
              <div className='flex items-center space-x-4'>
                <input
                  type='color'
                  value={fillColor}
                  onChange={(e) => setFillColor(e.target.value)}
                />
                <input
                  type="text"
                  value={fillColor}
                  onChange={(e) => setFillColor(e.target.value)}
                  className="border p-2 rounded w-full"
                />
              </div>

              <div className="flex flex-col space-y-2">
                <label className={`text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Stroke Width
                </label>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={strokeWidth}
                  onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {strokeWidth}px
                </div>
              </div>
              {activeTool === 'brush' || activeTool === 'eraser' ? (
                <div className="flex flex-col space-y-2">
                  <label className={`text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {activeTool === 'brush' ? 'Brush Size' : 'Eraser Size'}
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="100"
                    value={brushSize}
                    onChange={(e) => setBrushSize(parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {brushSize}px
                  </div>
                </div>
              ) : null}






              {activeTool === 'text' || selectedObject?.type === 'text' ? (
                <>
                  <div className="flex flex-col space-y-2">
                    <label className={`text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Font Size
                    </label>
                    <input
                      type="range"
                      min="8"
                      max="72"
                      value={fontSize}
                      onChange={(e) => setFontSize(parseInt(e.target.value))}
                      className="w-full"
                    />
                    <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {fontSize}px
                    </div>
                  </div>

                  <div className="flex flex-col space-y-2">
                    <label className={`text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Font Family
                    </label>
                    <select
                      value={fontFamily}
                      onChange={(e) => setFontFamily(e.target.value)}
                      className={`text-sm rounded p-2 ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} border`}
                    >
                      <option value="Arial">Arial</option>
                      <option value="Helvetica">Helvetica</option>
                      <option value="Times New Roman">Times New Roman</option>
                      <option value="Courier New">Courier New</option>
                      <option value="Georgia">Georgia</option>
                      <option value="Verdana">Verdana</option>
                    </select>
                  </div>

                  <div className="flex space-x-2">
                    <ToolButton
                      icon={Bold}
                      isActive={selectedObject?.fontWeight === 'bold'}
                      onClick={() => {
                        if (selectedObject?.type === 'text') {
                          setObjects(prev => prev.map(obj =>
                            obj.id === selectedObject.id
                              ? { ...obj, fontWeight: obj.fontWeight === 'bold' ? 'normal' : 'bold' }
                              : obj
                          ));
                          setSelectedObject(prev => ({
                            ...prev,
                            fontWeight: prev.fontWeight === 'bold' ? 'normal' : 'bold'
                          }));
                        }
                      }}
                      title="Bold"
                      disabled={!selectedObject || selectedObject.type !== 'text'}
                    />
                    <ToolButton
                      icon={Italic}
                      isActive={selectedObject?.fontStyle === 'italic'}
                      onClick={() => {
                        if (selectedObject?.type === 'text') {
                          setObjects(prev => prev.map(obj =>
                            obj.id === selectedObject.id
                              ? { ...obj, fontStyle: obj.fontStyle === 'italic' ? 'normal' : 'italic' }
                              : obj
                          ));
                          setSelectedObject(prev => ({
                            ...prev,
                            fontStyle: prev.fontStyle === 'italic' ? 'normal' : 'italic'
                          }));
                        }
                      }}
                      title="Italic"
                      disabled={!selectedObject || selectedObject.type !== 'text'}
                    />
                  </div>
                </>
              ) : null}
            </div>
          </div>

          {/* Layers Panel */}
          {showLayersPanel && (
            <div className="flex-1 p-4 overflow-auto">
              <h3 className={`font-medium mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Layers
              </h3>

              <div className="space-y-2">
                {objects.length === 0 ? (
                  <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    No layers yet
                  </div>
                ) : (
                  [...objects].reverse().map((obj) => (
                    <div
                      key={obj.id}
                      className={`p-2 rounded flex items-center justify-between ${selectedObject?.id === obj.id
                        ? 'bg-blue-600 text-white'
                        : darkMode
                          ? 'hover:bg-gray-700'
                          : 'hover:bg-gray-100'
                        } cursor-pointer`}
                      onClick={() => {
                        setSelectedObject(selectedObject === obj ? null : obj);
                        if (selectedObject) {
                          console.log(selectedObject)
                          console.log(selectedObject.toObject());
                        } else {
                          console.warn('No object is selected.');
                        }

                      }}
                    >
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleObjectVisibility(obj);
                          }}
                          className={`p-1 rounded ${selectedObject?.id === obj.id
                            ? `${darkMode ? 'text-gray bg-gray-700' : 'text-black bg-white'} hover:bg-blue-700`
                            : darkMode
                              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                              : 'bg-white text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                          {obj.visible ? <Eye className={`${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'hover:bg-gray-100'}`} size={14} /> :
                            <EyeOff className={`${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-white hover:bg-gray-100'}`} size={14} />}
                        </button>
                        <span className={`text-sm truncate ${darkMode ? 'text-gray-300' : 'text-black-600'}`}>
                          {obj.type.charAt(0).toUpperCase() + obj.type.slice(1)} {obj.id}
                        </span>
                      </div>
                      {selectedObject?.id === obj.id && (
                        <div className="flex space-x-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              bringToFront();
                            }}
                            className={`p-1 rounded hover:bg-blue-700  ${darkMode && 'text-black bg-gray-700'} text-white`}
                            title="Bring to front"
                          >
                            <ChevronUp className={`${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'text-black bg-white hover:bg-gray-100'}`} size={14} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              sendToBack();
                            }}
                            className={`p-1 rounded ${darkMode && 'bg-gray-700'} hover:bg-blue-700 text-white`}
                            title="Send to back"
                          >
                            <ChevronDown className={`${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'text-black bg-white hover:bg-gray-100'}`} size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdvancedCanvasEditor;