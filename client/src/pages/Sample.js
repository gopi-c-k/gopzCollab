import React, { useRef, useEffect, useState } from 'react';
import { ChromePicker } from 'react-color';
import {
  Edit, Image, Type, Square, Circle, Triangle, Minus, ArrowRight, Trash2, Layers,
  ChevronUp, ChevronDown, Download, Save, Undo, Redo, Bold, Italic, Underline,
  AlignLeft, AlignCenter, AlignRight, Palette, Lock, Unlock, Users, Unlink,
  Sliders, Code, Link, Copy, Clipboard, Scissors, Eye, EyeOff, Grid, Ruler,
  ZoomIn, ZoomOut, Maximize2, Plus, Search, Folder, File, Share2, Settings,
  HelpCircle, Sun, Moon, RotateCcw, FlipHorizontal, FlipVertical, MousePointer,
  Move, Hexagon, Star, Zap, Eraser, Droplet, RefreshCw,
} from 'lucide-react';
import {
  fabric,
  Canvas,
  Textbox,
  Rect,
  Polygon,
  Circle as fabricCircle,
  Triangle as fabricTriangle,
  Line,
  Group,
  Object as FabricObject,
  IText,
  Path,
  Image as FabricImage,
  Point,
  util
} from 'fabric';

const AdvancedCanvasEditor = () => {
  const canvasRef = useRef(null);
  const [activeTool, setActiveTool] = useState('select');
  const [color, setColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [fontFamily, setFontFamily] = useState('Arial');
  const [fontSize, setFontSize] = useState(24);
  const [brushSize, setBrushSize] = useState(10);
  const [zoom, setZoom] = useState(100);
  const [gridVisible, setGridVisible] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [showLayersPanel, setShowLayersPanel] = useState(true);
  const [showPropertiesPanel, setShowPropertiesPanel] = useState(true);
  const [canvasSize] = useState({ width: 1200, height: 800 });
  const [clipboard, setClipboard] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [fillColor, setFillColor] = useState('#ffffff');
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Initialize canvas
  useEffect(() => {
    const canvas = new Canvas(canvasRef.current, {
      width: 1450,
      height: 550,
      backgroundColor: '#f8f9fa',
      preserveObjectStacking: true,
      selection: true,
      selectionColor: 'rgba(0, 161, 255, 0.3)',
      selectionBorderColor: '#00a1ff',
      selectionLineWidth: 1,
      selectionDashArray: [5, 5],
      selectionFullyContained: false,
      defaultCursor: 'default',
      hoverCursor: 'move',
      moveCursor: 'move',
      allowTouchScrolling: true,
    });

    // Add event listeners
    canvas.on('object:added', () => saveToHistory(canvas));
    canvas.on('object:modified', () => saveToHistory(canvas));
    canvas.on('object:removed', () => saveToHistory(canvas));
    canvas.on('selection:created', (e) => {
      if (e.selected && e.selected.length === 1) {
        const obj = e.selected[0];
        setColor(obj.stroke || '#000000');
        setFillColor(obj.fill || '#ffffff');
        setStrokeWidth(obj.strokeWidth || 2);
      }
    });
    canvas.on('mouse:move', (e) => {
      setMousePos({
        x: e.absolutePointer?.x || 0,
        y: e.absolutePointer?.y || 0
      });
    });

    // Add test rectangle
    const rect = new Rect({
      left: 100,
      top: 100,
      width: 100,
      height: 100,
      fill: '#ff0000',
      stroke: '#000000',
      strokeWidth: 1,
      selectable: true,
    });
    canvas.add(rect);
    canvas.renderAll();
    saveToHistory(canvas);

    return () => {
      canvas.dispose();
    };
  }, [darkMode]);

  const saveToHistory = (canvas) => {
    const json = canvas.toJSON();
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.stringify(json));
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const loadFromHistory = (index) => {
    if (index >= 0 && index < history.length) {
      const canvas = canvasRef.current;
      canvas.loadFromJSON(JSON.parse(history[index]), () => {
        canvas.renderAll();
      });
    }
  };

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      loadFromHistory(newIndex);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      loadFromHistory(newIndex);
    }
  };

  const handleMouseDown = (e) => {
    console.log('Gopi')
    const canvas = canvasRef.current;
    const pointer = canvas.getPointer(e.e);
    
    if (activeTool === 'select') {
      // Selection is handled by Fabric.js
      return;
    }

    let shape;
    switch (activeTool) {
      case 'rectangle':
        shape = new Rect({
          left: pointer.x,
          top: pointer.y,
          width: 0,
          height: 0,
          fill: fillColor,
          stroke: color,
          strokeWidth,
          selectable: true,
        });
        break;
      case 'circle':
        shape = new fabricCircle({
          left: pointer.x,
          top: pointer.y,
          radius: 0,
          fill: fillColor,
          stroke: color,
          strokeWidth,
          selectable: true,
        });
        break;
      case 'triangle':
        shape = new fabricTriangle({
          left: pointer.x,
          top: pointer.y,
          width: 0,
          height: 0,
          fill: fillColor,
          stroke: color,
          strokeWidth,
          selectable: true,
        });
        break;
      case 'line':
        shape = new Line([pointer.x, pointer.y, pointer.x, pointer.y], {
          stroke: color,
          strokeWidth,
          selectable: true,
        });
        break;
      case 'text':
        shape = new Textbox('Click to edit', {
          left: pointer.x,
          top: pointer.y,
          fontFamily,
          fontSize,
          fill: color,
          width: 200,
          selectable: true,
        });
        break;
    }

    if (shape) {
      canvas.add(shape);
      canvas.setActiveObject(shape);
      canvas.renderAll();
    }
  };

  const deleteSelected = () => {
    const canvas = canvasRef.current;
    const activeObjects = canvas.getActiveObjects();
    if (activeObjects && activeObjects.length > 0) {
      canvas.remove(...activeObjects);
      canvas.discardActiveObject();
      canvas.renderAll();
      saveToHistory(canvas);
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    canvas.clear();
    canvas.backgroundColor = darkMode ? '#111827' : '#ffffff';
    canvas.renderAll();
    saveToHistory(canvas);
  };

  const exportCanvas = (format = 'png') => {
    const canvas = canvasRef.current;
    const dataURL = canvas.toDataURL({
      format: format,
      quality: 1.0
    });
    const link = document.createElement('a');
    link.download = `canvas-export.${format}`;
    link.href = dataURL;
    link.click();
  };

  // ToolButton component remains the same as in your original code
  const ToolButton = ({ icon: Icon, isActive, onClick, title, disabled = false }) => (
    <button
      className={`p-2 rounded-lg transition-all duration-200 ${
        disabled
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

  return (
    <div className={`flex flex-col h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Top Toolbar */}
      <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b px-4 py-3 flex items-center justify-between`}>
        <div className="flex items-center space-x-4">
          {/* File Operations */}
          <div className="flex items-center space-x-1">
            <ToolButton
              icon={File}
              onClick={() => clearCanvas()}
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
              onClick={() => exportCanvas('jpeg')}
              title="Export JPEG"
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
              icon={Trash2}
              onClick={deleteSelected}
              title="Delete Selected"
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
            onClick={() => setActiveTool('text')}
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
        </div>

        {/* Canvas Area */}
        <div className="flex-1 overflow-auto flex items-center justify-center">
          <div
            className="relative"
            style={{ transform: `scale(${zoom / 100})` }}
          >
            <canvas
              ref={canvasRef}
              className={`shadow-lg`}
              width={canvasSize.width}
              height={canvasSize.height}
              onMouseDown={handleMouseDown}
            />
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
              <div>
                <label className={`block mb-2 font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Stroke Color</label>
                <input
                  type="color"
                  value={color}
                  onChange={(e) => {
                    setColor(e.target.value);
                    const canvas = canvasRef.current;
                    const activeObject = canvas.getActiveObject();
                    if (activeObject) {
                      activeObject.set('stroke', e.target.value);
                      canvas.renderAll();
                    }
                  }}
                  className="w-full"
                />
              </div>

              <div>
                <label className={`block mb-2 font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Fill Color</label>
                <input
                  type="color"
                  value={fillColor}
                  onChange={(e) => {
                    setFillColor(e.target.value);
                    const canvas = canvasRef.current;
                    const activeObject = canvas.getActiveObject();
                    if (activeObject) {
                      activeObject.set('fill', e.target.value);
                      canvas.renderAll();
                    }
                  }}
                  className="w-full"
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
                  onChange={(e) => {
                    const width = parseInt(e.target.value);
                    setStrokeWidth(width);
                    const canvas = canvasRef.current;
                    const activeObject = canvas.getActiveObject();
                    if (activeObject) {
                      activeObject.set('strokeWidth', width);
                      canvas.renderAll();
                    }
                  }}
                  className="w-full"
                />
                <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {strokeWidth}px
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedCanvasEditor;