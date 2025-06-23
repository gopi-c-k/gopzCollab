import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as fabric from 'fabric';
import {
  Type,
  Square,
  Circle,
  Triangle,
  Minus,
  Pencil,
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
  Italic, Paintbrush2, Sparkles,
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
  PencilRuler,
  Droplet,
  RefreshCw,
} from 'lucide-react';

const AdvancedCanvasEditor = () => {
  const canvasRef = useRef(null);
  const [activeTool, setActiveTool] = useState('');
  const [color, setColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [fontFamily, setFontFamily] = useState('Arial');
  const [fontSize, setFontSize] = useState(24);
  const [isDrawing, setIsDrawing] = useState(true);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [objects, setObjects] = useState([]);
  const [selectedObject, setSelectedObject] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [zoom, setZoom] = useState(100);
  const [gridVisible, setGridVisible] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [showLayersPanel, setShowLayersPanel] = useState(true);
  const [brushSize, setBrushSize] = useState(10);
  const [canvasSize] = useState({ width: 1200, height: 800 });
  const [clipboard, setClipboard] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const eraserSize = brushSize || 20; // or a fixed value like 20
  const [fillColor, setFillColor] = useState(darkMode ? '#ffffff' : '#ffffff');
  const fabricCanvasRef = useRef(null);
  const [currentShape, setCurrentShape] = useState(null);
  const [shapeVersion, setShapeVersion] = useState(0);
  const gridLinesRef = useRef([]);
  const objectMapRef = useRef({});
  const [nameInput, setNameInput] = useState('');
  const [brushType, setBrushType] = useState('Pencil'); // Pencil, Spray, Circle
  const [brushColor, setBrushColor] = useState('#000000');





  useEffect(() => {
    const canvas = new fabric.Canvas(canvasRef.current, {
      width: canvasSize.width,
      height: canvasSize.height,
      backgroundColor: '#f8f9fa',
      preserveObjectStacking: true,
      selection: true,
      selectionColor: 'transparent',
      selectionBorderColor: '#00a1ff',
      selectionLineWidth: 1,
      selectionDashArray: [5, 5],
      selectionFullyContained: false,
      defaultCursor: 'default',
      hoverCursor: 'move',
      moveCursor: 'move',
      allowTouchScrolling: true,
    });
    fabricCanvasRef.current = canvas;
    // Add event listeners
    canvas.on('object:added', () => saveToHistory(canvas));
    canvas.on('object:modified', () => saveToHistory(canvas));
    canvas.on('object:removed', () => saveToHistory(canvas));
    const handleSelect = (e) => {
      if (e.selected && e.selected.length === 1) {
        const obj = objectMapRef.current[e.selected[0].id];
        setSelectedObject(obj);
      }
    };

    canvas.on('selection:created', handleSelect);
    canvas.on('selection:updated', handleSelect);
    canvas.on('selection:cleared', () => setSelectedObject(null));
    canvas.on('mouse:move', (e) => {
      setMousePos({
        x: e.absolutePointer?.x || 0,
        y: e.absolutePointer?.y || 0
      });
    });
    canvas.renderAll();
    saveToHistory(canvas);
    return () => {
      canvas.dispose();
    };
  }, []);

  // Brush
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const handlePathCreated = (e) => {
      const path = e.path;
      const id = `id-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      path.id = id;
      path.name = `brush-${id}`;
      path.selectable = true;
      objectMapRef.current[id] = path;
      setObjects(prev => [...prev, path]);
    };

    canvas.on('path:created', handlePathCreated);

    return () => {
      canvas.off('path:created', handlePathCreated);
    };
  }, []);

  // Draw grid
  useEffect(() => {
    const canvas = fabricCanvasRef.current;

    const drawFabricGrid = (canvas, gridSize = 20, color = '#ccc') => {
      const width = canvas.getWidth();
      const height = canvas.getHeight();

      // Remove old grid lines if any
      gridLinesRef.current.forEach(line => canvas.remove(line));
      gridLinesRef.current = [];

      if (!gridVisible) {
        canvas.renderAll();
        return;
      }

      const lines = [];

      for (let i = 0; i <= width; i += gridSize) {
        const line = new fabric.Line([i, 0, i, height], {
          stroke: color,
          selectable: false,
          evented: false,
          excludeFromExport: true,
        });
        lines.push(line);
      }

      for (let i = 0; i <= height; i += gridSize) {
        const line = new fabric.Line([0, i, width, i], {
          stroke: color,
          selectable: false,
          evented: false,
          excludeFromExport: true,
        });
        lines.push(line);
      }
      gridLinesRef.current = lines;
      lines.forEach(line => canvas.add(line));

      canvas._objects = [...lines, ...canvas._objects.filter(obj => !lines.includes(obj))];
      canvas.renderAll();
    };

    if (canvas) {
      drawFabricGrid(canvas, 20, darkMode ? '#444' : '#ddd');
    }

  }, [gridVisible, darkMode]);



  const handleMouseDown = (e) => {
    if (activeTool === 'brush' || activeTool === 'eraser') return;

    const canvas = fabricCanvasRef.current;
    const pointer = canvas.getPointer(e.e);
    const id = `id-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const name = activeTool + '-' + id;
    const commonProps = {
      left: pointer.x,
      top: pointer.y,
      stroke: color,
      fill: activeTool === 'line' ? null : fillColor,
      strokeWidth,
      selectable: true,
      hasControls: true,
      id,
      name: name,
    };

    setStartPos(pointer);
    let shape;

    switch (activeTool) {
      case 'rectangle':
        shape = new fabric.Rect({
          ...commonProps,
          width: 0,
          height: 0,
        });
        break;
      case 'circle':
        shape = new fabric.Circle({
          ...commonProps,
          radius: 1,
          originX: 'center',
          originY: 'center',
        });
        break;
      case 'triangle':
        shape = new fabric.Triangle({
          ...commonProps,
          width: 0,
          height: 0,
        });
        break;
      case 'line':
        shape = new fabric.Line([pointer.x, pointer.y, pointer.x, pointer.y], {
          ...commonProps,
        });
        break;
      case 'text':
        shape = new fabric.Textbox('Click to edit', {
          ...commonProps,
          fontFamily,
          fontSize,
          width: 200,
        });
        break;
      case 'star':
      case 'hexagon':
        const sides = activeTool === 'star' ? 5 : 6;
        const initialRadius = 1; // temporary, will be updated on move
        shape = new fabric.Polygon(
          createRegularPolygonPoints(sides, initialRadius),
          {
            ...commonProps,
            originX: 'center',
            originY: 'center',
          }
        );
        break;

    }

    if (shape) {
      canvas.add(shape);
      canvas.setActiveObject(shape);
      setCurrentShape(shape);
      objectMapRef.current[id] = shape;
      setShapeVersion(shapeVersion + 1);
    }

    setIsDrawing(true);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing || !currentShape) return;

    const canvas = fabricCanvasRef.current;
    const pointer = canvas.getPointer(e.e);
    const shape = currentShape;

    switch (activeTool) {
      case 'rectangle':
      case 'triangle':
        shape.set({
          width: Math.abs(pointer.x - startPos.x),
          height: Math.abs(pointer.y - startPos.y),
          left: Math.min(pointer.x, startPos.x),
          top: Math.min(pointer.y, startPos.y),
        });
        break;
      case 'circle':
        const dx = pointer.x - startPos.x;
        const dy = pointer.y - startPos.y;
        const radius = Math.sqrt(dx * dx + dy * dy) / 2;
        shape.set({
          radius,
          left: startPos.x,
          top: startPos.y,
        });
        break;
      case 'line':
        shape.set({
          x2: pointer.x,
          y2: pointer.y,
        });
        break;
      case 'star':
      case 'hexagon':
        const dxh = pointer.x - startPos.x;
        const dyh = pointer.y - startPos.y;
        const radiush = Math.sqrt(dxh * dxh + dyh * dyh) / 2;

        const updatedPoints = createRegularPolygonPoints(
          activeTool === 'star' ? 5 : 6,
          radiush
        );

        shape.set({
          points: updatedPoints,
          left: startPos.x,
          top: startPos.y,
        });
        break;

    }
    canvas.renderAll();
  };

  // Finalize shape
  const handleMouseUp = () => {
    setIsDrawing(false);
    setCurrentShape(null);
  };
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    canvas.on('mouse:down', handleMouseDown);
    canvas.on('mouse:move', handleMouseMove);
    canvas.on('mouse:up', handleMouseUp);

    return () => {
      canvas.off('mouse:down', handleMouseDown);
      canvas.off('mouse:move', handleMouseMove);
      canvas.off('mouse:up', handleMouseUp);
    };
  }, [activeTool, isDrawing, currentShape, startPos]);



  function createRegularPolygonPoints(sides, radius) {
    const angle = (2 * Math.PI) / sides;
    const points = [];
    for (let i = 0; i < sides; i++) {
      points.push({
        x: radius * Math.cos(i * angle),
        y: radius * Math.sin(i * angle)
      });
    }
    return points;
  }
  useEffect(() => {
    const list = Object.entries(objectMapRef.current).map(([id, obj]) => ({
      id,
      type: obj.type,
      name: obj.name,
      visible: obj.visible ?? true,
    }));
    setObjects(list);
  }, [shapeVersion]);
  // History management
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
      setSelectedObject(null);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      loadFromHistory(newIndex);
      setSelectedObject(null);
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


  // Canvas operations
  const zoomIn = () => {
    const newZoom = Math.min(zoom + 25, 500);
    setZoom(newZoom);
  };

  const zoomOut = () => {
    const newZoom = Math.max(zoom - 25, 25);
    setZoom(newZoom);
  };

  const resetZoom = () => {
    setZoom(100);
  };

  const exportCanvas = (format = 'png') => {
    const canvas = canvasRef.current;
    gridLinesRef.current.forEach(line => line.set({ visible: false }));
    fabricCanvasRef.current.renderAll();
    const dataURL = canvas.toDataURL(`image/${format}`, 1.0);
    const link = document.createElement('a');
    link.download = `canvas-export.${format}`;
    link.href = dataURL;
    link.click();
    gridLinesRef.current.forEach(line => line.set({ visible: true }));
    fabricCanvasRef.current.renderAll();
  };


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
  const ZoomOverlayButton = ({ icon: Icon, isActive, onClick, title, disabled = false }) => (
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
      <Icon size={12} />
    </button>
  );
  const resetCanvas = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    canvas.clear();
    canvas.renderAll();
  }

  const selectObjectById = (id) => {
    if (selectedObject) {
      const canvas = fabricCanvasRef.current;
      const obj = objectMapRef.current[id];


      if (canvas && obj) {
        canvas.discardActiveObject();
        canvas.setActiveObject(obj);
        canvas.renderAll();
        setSelectedObject(obj);
        setActiveTool('select')
      }
    }
  };

  const toggleObjectVisibility = (id) => {
    const canvas = fabricCanvasRef.current;
    const obj = objectMapRef.current[id];

    if (canvas && obj) {
      obj.set('visible', !obj.visible);
      obj.dirty = true;
      canvas.renderAll();
      setShapeVersion(shapeVersion + 1);
    }
  };
  const handleNameUpdate = (id, newName) => {
    const obj = objectMapRef.current[id];
    if (obj) {
      obj.name = newName;
      setShapeVersion(shapeVersion + 1);
    }
  };
  const updateObjectProp = (prop, value) => {
    if (!selectedObject) return;
    const selectedObjectUsage = objectMapRef.current[selectedObject.id]
    selectedObjectUsage.set(prop, value);
    if (['width', 'height', 'left', 'top', 'radius'].includes(prop)) {
      selectedObjectUsage.setCoords();
    }

    fabricCanvasRef.current.renderAll();
    setSelectedObject({ ...selectedObjectUsage }); // trigger re-render
  };
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    canvas.isDrawingMode = activeTool === 'brush';

    if (activeTool === 'brush') {
      switch (brushType) {
        case 'Spray':
          canvas.freeDrawingBrush = new fabric.SprayBrush(canvas);
          break;
        case 'Circle':
          canvas.freeDrawingBrush = new fabric.CircleBrush(canvas);
          break;
        case 'Pencil':
        default:
          canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
      }

      canvas.freeDrawingBrush.color = brushColor;
      canvas.freeDrawingBrush.width = brushSize;
    }
  }, [activeTool, brushType, brushColor, brushSize]);


  return (
    <div className={`flex flex-col h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Top Toolbar */}
      <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b px-4 py-3 flex items-center justify-between`}>
        <div className="flex items-center space-x-4">
          {/* File Operations */}
          <div className="flex items-center space-x-1">
            <PencilRuler className="w-8 h-8 text-blue-500" />
            <img
              alt="Logo"
              src={`${process.env.PUBLIC_URL}/assets/images/Logo.png`}
              className='w-44'
            />
            <h1 className={`font-semibold text-2xl ${darkMode ? 'text-white' : 'text-gray-900'}`}>Design Tool</h1>
          </div>


          <div className={`w-px h-6 ${darkMode ? 'bg-gray-600' : 'bg-gray-300'}`} />

          {/* Edit Operations */}
          <div className="flex items-center space-x-1">
            <ToolButton
              icon={Undo}
              onClick={() => undo()}
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
              // onClick={deleteAll}
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
              // onClick={paste}
              title="Paste"
              disabled={!clipboard || clipboard.length === 0}
            />
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
                resetCanvas();
              }}
              title="Reset Canvas"
            />

          </div>
        </div>


        {/* Right Controls */}
        <div className="flex items-center space-x-2">
          <ToolButton
            icon={darkMode ? Sun : Moon}
            onClick={() => setDarkMode(!darkMode)}
            title="Toggle Dark Mode"
          />
          <ToolButton icon={Share2} onClick={() => { }} title="Share" />
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
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Toolbar */}
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-r p-3 flex flex-col space-y-2 w-16`}>
          <ToolButton
            icon={MousePointer}
            isActive={activeTool === 'select'}
            onClick={() => { activeTool === 'select' ? setActiveTool('') : setActiveTool('select') }}
            title="Select Tool (V)"
          />

          <div className={`border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} my-2`} />

          <ToolButton
            icon={Type}
            isActive={activeTool === 'text'}
            onClick={() => {
              if (activeTool === 'text') {
                setActiveTool("");
              } else {
                setActiveTool('text');
                // addText();
              }
            }}
            title="Text Tool (T)"
          />

          <ToolButton
            icon={Square}
            isActive={activeTool === 'rectangle'}
            onClick={() => { activeTool === 'rectangle' ? setActiveTool('') : setActiveTool('rectangle') }}
            title="Rectangle"
          />

          <ToolButton
            icon={Circle}
            isActive={activeTool === 'circle'}
            onClick={() => { activeTool === 'cirlce' ? setActiveTool('') : setActiveTool('circle') }}
            title="Circle"
          />

          <ToolButton
            icon={Triangle}
            isActive={activeTool === 'triangle'}
            onClick={() => { activeTool === 'triangle' ? setActiveTool('') : setActiveTool('triangle') }}
            title="Triangle"
          />

          <ToolButton
            icon={Minus}
            isActive={activeTool === 'line'}
            onClick={() => { activeTool === 'line' ? setActiveTool('') : setActiveTool('line') }}
            title="Line"
          />

          <ToolButton
            icon={Star}
            isActive={activeTool === 'star'}
            onClick={() => { activeTool === 'star' ? setActiveTool('') : setActiveTool('star') }}
            title="Star"
          />

          <ToolButton
            icon={Hexagon}
            isActive={activeTool === 'hexagon'}
            onClick={() => { activeTool === 'hexagon' ? setActiveTool('') : setActiveTool('hexagon') }}
            title="Hexagon"
          />

          <div className={`border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} my-2`} />

          <ToolButton
            icon={Paintbrush2}
            isActive={activeTool === 'brush'}
            onClick={() => { activeTool === 'brush' ? setActiveTool('') : setActiveTool('brush') }}
            title="Brush"
          />
          {activeTool === 'brush' && (
            <>
              <ToolButton
                icon={Pencil}
                isActive={brushType === 'Pencil'}
                onClick={() => { brushType === 'Pencil' ? setBrushType('') : setBrushType('Pencil') }}
                title="Pencil"
              />
              <ToolButton
                icon={Sparkles}
                isActive={brushType === 'Spray'}
                onClick={() => { brushType === 'Spray' ? setBrushType('') : setBrushType('Spray') }}
                title="Spray"
              />
              <ToolButton
                icon={Circle}
                isActive={brushType === 'Circle'}
                onClick={() => { brushType === 'Cirlce' ? setBrushType('') : setBrushType('Circle') }}
                title="Circle"
              />
            </>
          )}

          <ToolButton
            icon={Eraser}
            isActive={activeTool === 'eraser'}
            onClick={() => setActiveTool('eraser')}
            title="Eraser"
          />
        </div>
        {/* Canvas Area */}
        <div className={`flex-1 overflow-auto bg-gray-100 ${darkMode && 'bg-red-900'}flex items-center justify-center`}>
          <div
            className="relative"
            style={{ transform: `scale(${zoom / 100})` }}
          >
            <canvas
              ref={canvasRef}
              className={`shadow-lg ${activeTool === 'eraser'
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
            />

            {/* Eraser preview */}
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

          {/* Zoom Controls */}
          <div className={`fixed bottom-4 right-80 flex items-center space-x-2 bg-white ${darkMode && 'dark:bg-gray-800'} p-2 rounded  ${darkMode ? 'bg-gray-800 shadow-lg shadow-black/40' : 'bg-white shadow-md shadow-gray-300'}`}>
            <ZoomOverlayButton icon={ZoomOut} onClick={zoomOut} title="Zoom Out" />
            <span className={`px-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              {zoom}%
            </span>
            <ZoomOverlayButton icon={ZoomIn} onClick={zoomIn} title="Zoom In" />
            <ZoomOverlayButton icon={Maximize2} onClick={resetZoom} title="Reset Zoom" />
          </div>

          {/* Mouse Position Tracker */}
          <div
            className={`fixed bottom-0 left-16 bg-white text-sm px-3 py-1 rounded shadow-md shadow-black/20 text-gray-700 ${darkMode && 'dark:text-gray-300 dark:bg-gray-800'}`}
          >
            X: {Math.floor(mousePos.x)}, Y: {Math.floor(mousePos.y)}
          </div>
        </div>



        {/* Right Panels */}
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-l w-64 flex flex-col`}>
          {/* Properties Panel */}
          <div className={`p-4 ${darkMode ? 'border-gray-700' : 'border-gray-200'} border-b`}>
            {selectedObject ? (
              <div className="space-y-4 max-h-[45vh] overflow-y-auto pr-2">
                <h3 className={`font-medium mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Properties: {selectedObject?.name || selectedObject.type}
                </h3>
                {/* Name */}
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Name</label>
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    onBlur={() => {
                      handleNameUpdate(selectedObject.id, nameInput);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleNameUpdate(selectedObject.id, nameInput);
                      }
                    }}
                    className="border p-2 rounded w-full"
                  />
                </div>
                {/* Position */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>X</label>
                    <input
                      type="number"
                      value={selectedObject.left ?? 0}
                      onChange={(e) => updateObjectProp('left', parseFloat(e.target.value))}
                      className="border p-2 rounded w-full"
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Y</label>
                    <input
                      type="number"
                      value={selectedObject.top ?? 0}
                      onChange={(e) => updateObjectProp('top', parseFloat(e.target.value))}
                      className="border p-2 rounded w-full"
                    />
                  </div>
                </div>

                {/* Size */}
                {selectedObject.type === 'circle' ? (
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Radius</label>
                    <input
                      type="number"
                      value={selectedObject.radius ?? 0}
                      onChange={(e) => updateObjectProp('radius', parseFloat(e.target.value))}
                      className="border p-2 rounded w-full"
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Width</label>
                      <input
                        type="number"
                        value={selectedObject.width ?? 0}
                        onChange={(e) => updateObjectProp('width', parseFloat(e.target.value))}
                        className="border p-2 rounded w-full"
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Height</label>
                      <input
                        type="number"
                        value={selectedObject.height ?? 0}
                        onChange={(e) => updateObjectProp('height', parseFloat(e.target.value))}
                        className="border p-2 rounded w-full"
                      />
                    </div>
                  </div>
                )}

                {/* Fill color */}
                {selectedObject.type !== 'path' && (<div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Fill Color</label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="color"
                      value={selectedObject.fill || '#000000'}
                      onChange={(e) => updateObjectProp('fill', e.target.value)}
                    />
                    <input
                      type="text"
                      value={selectedObject.fill || '#000000'}
                      onChange={(e) => updateObjectProp('fill', e.target.value)}
                      className="border p-2 rounded w-full"
                    />
                  </div>
                </div>)}

                {/* Stroke color & width */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Stroke</label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="color"
                      value={selectedObject.stroke || '#000000'}
                      onChange={(e) => updateObjectProp('stroke', e.target.value)}
                    />
                    <input
                      type="text"
                      value={selectedObject.stroke || '#000000'}
                      onChange={(e) => updateObjectProp('stroke', e.target.value)}
                      className="border p-2 rounded w-full"
                    />
                  </div>
                  <div className="mt-2">
                    <label className={`text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Stroke Width</label>
                    <input
                      type="range"
                      min="1"
                      max="20"
                      value={selectedObject.strokeWidth ?? 1}
                      onChange={(e) => updateObjectProp('strokeWidth', parseFloat(e.target.value))}
                      className="w-full"
                    />
                    <div className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {selectedObject.strokeWidth ?? 1}px
                    </div>
                  </div>
                </div>

                {/* Rotation */}
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Rotation (°)</label>
                  <input
                    type="number"
                    value={selectedObject.angle ?? 0}
                    onChange={(e) => updateObjectProp('angle', parseFloat(e.target.value))}
                    className="border p-2 rounded w-full"
                  />
                </div>

                {/* Opacity */}
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Opacity</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={selectedObject.opacity ?? 1}
                    onChange={(e) => updateObjectProp('opacity', parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <div className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {Math.round((selectedObject.opacity ?? 1) * 100)}%
                  </div>
                </div>

                {/* Lock toggle */}
                <div className="flex items-center space-x-2 mt-2">
                  <input
                    type="checkbox"
                    checked={selectedObject.lockMovementX && selectedObject.lockMovementY}
                    onChange={(e) => {
                      const locked = e.target.checked;
                      updateObjectProp('lockMovementX', locked);
                      updateObjectProp('lockMovementY', locked);
                      updateObjectProp('selectable', !locked);
                      updateObjectProp('hasControls', !locked);
                    }}
                  />
                  <label className={`text-sm ${darkMode ? 'text-white' : 'text-gray-700'}`}>Lock Position</label>
                </div>
              </div>
            ) : (<div className="space-y-4">
              <h3 className={`font-medium mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Properties
              </h3>
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
                  value={selectedObject ? selectedObject.fill : fillColor}
                  onChange={(e) => {
                    const newColor = e.target.value;
                    if (activeTool !== "") {
                      setFillColor(newColor);
                    } else {
                      const canvas = fabricCanvasRef.current;
                      canvas.backgroundColor = newColor;
                      canvas.renderAll();
                    }
                  }}
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
            </div>)}
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
                        if (selectedObject?.id === obj.id) {
                          setSelectedObject(null);
                          fabricCanvasRef.current.discardActiveObject();
                          fabricCanvasRef.current.renderAll();
                        } else {
                          setSelectedObject(obj);
                          selectObjectById(obj.id);
                        }
                      }}

                    >
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleObjectVisibility(obj.id);
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
                        <span
                          className={`text-sm truncate cursor-text ${darkMode ? 'text-gray-300' : 'text-black-600'}`}
                        >
                          {obj.name || `${obj.type.charAt(0).toUpperCase() + obj.type.slice(1)} ${obj.id}`}
                        </span>
                        {selectedObject?.id === obj.id && (
                          <div className="flex space-x-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                // bringToFront();
                              }}
                              className={`p-1 rounded hover:bg-blue-700  ${darkMode && 'text-black bg-gray-700'} text-white`}
                              title="Bring to front"
                            >
                              <ChevronUp className={`${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'text-black bg-white hover:bg-gray-100'}`} size={14} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                // sendToBack();
                              }}
                              className={`p-1 rounded ${darkMode && 'bg-gray-700'} hover:bg-blue-700 text-white`}
                              title="Send to back"
                            >
                              <ChevronDown className={`${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'text-black bg-white hover:bg-gray-100'}`} size={14} />
                            </button>
                          </div>
                        )}
                      </div>
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