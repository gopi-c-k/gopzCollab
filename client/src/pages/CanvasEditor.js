import React, { useRef, useEffect, useState, useCallback, version } from 'react';
import * as fabric from 'fabric';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket'
import * as awareness from 'y-protocols/awareness';
import { IndexeddbPersistence } from 'y-indexeddb';
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
    Star,
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
    PencilRuler,
    Droplet,
    RefreshCw,
} from 'lucide-react';
import { useLocation } from 'react-router-dom';
import Message from '../components/Message';
import { useNavigate } from "react-router-dom";



const AdvancedCanvasEditor = () => {
    const location = useLocation();
    const { session } = location.state || {};
    const navigate = useNavigate();
    const { name, profilePic, session_id, userId } = session;
    const roomName = session_id;
    const userName = name;
    const canvasRef = useRef(null);
    let syncCompleted = false;
    const [activeTool, setActiveTool] = useState('');
    const [color, setColor] = useState('#000000');
    const [strokeWidth, setStrokeWidth] = useState(2);
    const [fontFamily, setFontFamily] = useState('Arial');
    const [fontSize, setFontSize] = useState(24);
    const [isDrawing, setIsDrawing] = useState(true);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });
    const [objects, setObjects] = useState([]);
    const [selectedObject, setSelectedObject] = useState(null);
    const [zoom, setZoom] = useState(100);
    const [gridVisible, setGridVisible] = useState(false);
    const [darkMode, setDarkMode] = useState(true);
    const [showLayersPanel, setShowLayersPanel] = useState(true);
    const [brushSize, setBrushSize] = useState(10);
    const [canvasSize] = useState({ width: 1200, height: 800 });
    const [clipboard, setClipboard] = useState(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [fillColor, setFillColor] = useState(darkMode ? '#ffffff' : '#ffffff');
    const fabricCanvasRef = useRef(null);
    const [currentShape, setCurrentShape] = useState(null);
    const [shapeVersion, setShapeVersion] = useState(0);
    const gridLinesRef = useRef([]);
    const objectMapRef = useRef({});
    const [nameInput, setNameInput] = useState('');
    const [brushType, setBrushType] = useState('Pencil');
    const [brushColor, setBrushColor] = useState('#000000');
    const [selectedObjects, setSelectedObjects] = useState([]);
    const [history, setHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const historyRef = useRef([]);
    const historyIndexRef = useRef(-1);
    const [canvas, setCanvas] = useState(null);
    const [collaborators, setCollaborators] = useState({});
    const [isSynced, setIsSynced] = useState(false);

    // YJS setup
    const ydocRef = useRef(new Y.Doc());
    const ymapRef = useRef(ydocRef.current.getMap('canvasState'));
    const awarenessRef = useRef(new awareness.Awareness(ydocRef.current));
    const indexeddbProviderRef = useRef(null);
    const providerRef = useRef(null);

    // Initialize YJS and collaboration
    useEffect(() => {
        const ydoc = ydocRef.current;
        const ymap = ymapRef.current;

        try {
            if (process.env.REACT_APP_SOCKET_URL) {
                providerRef.current = new WebsocketProvider(
                    process.env.REACT_APP_SOCKET_URL,
                    roomName,
                    ydoc,
                    {
                        connect: true,
                        awareness: awarenessRef.current,
                        WebSocketPolyfill: WebSocket
                    }
                );

                providerRef.current.on('status', event => {
                    // console.log('WebSocket status:', event.status);
                });

                providerRef.current.on('sync', (isSynced) => {
                    if (isSynced) {
                        syncCompleted = true;

                        const canvas = fabricCanvasRef.current;
                        if (canvas) {
                            canvas.clear();
                            rebuildCanvasFromYMap(ymap, canvas, objectMapRef);
                        } else {
                            console.warn('⚠️ Canvas not ready at sync time. Will rebuild later.');
                        }
                    }
                });

            } else {
                console.error('REACT_APP_SOCKET_URL is not defined');
            }

            indexeddbProviderRef.current = new IndexeddbPersistence(roomName, ydoc);
            awarenessRef.current.setLocalStateField('user', {
                name: userName,
                color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
                cursor: { x: 0, y: 0 }
            });

            // Listen for awareness changes
            awarenessRef.current.on('change', () => {
                const states = awarenessRef.current.getStates();
                const collaboratorsMap = {};

                states.forEach((state, clientId) => {
                    if (clientId !== awarenessRef.current.clientID && state.user) {
                        collaboratorsMap[clientId] = state.user;
                    }
                });

                setCollaborators(collaboratorsMap);
            });
            initializeCanvasWithYjs();

        } catch (error) {
            console.error('Error initializing YJS collaboration:', error);
        }

        return () => {
            if (providerRef.current) {
                providerRef.current.disconnect();
                providerRef.current.destroy();
            }
            if (indexeddbProviderRef.current) {
                indexeddbProviderRef.current.destroy();
            }
        };
    }, [roomName, userName]);
    const ydoc = ydocRef.current;
    const ymap = ymapRef.current;
    const initializeCanvasWithYjs = useCallback(() => {

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
        setCanvas(canvas);
        const loadInitialState = () => {
            const canvasJson = ymap.get('canvas');
            if (canvasJson) {
                canvas.loadFromJSON(canvasJson, () => {
                    rebuildObjectMap();
                    canvas.renderAll();
                    setIsSynced(true);
                });
            } else {
                setIsSynced(true);
            }
        };

        // Set up YJS listeners
        ymap.observe(event => {
            if (event.keys.has('canvas')) {
                if (event.transaction.origin === ydoc.clientID) return;

                const canvasJson = ymap.get('canvas');
                if (canvasJson) {
                    canvas.loadFromJSON(canvasJson, () => {
                        rebuildObjectMap();
                        canvas.renderAll();
                    });
                }
            }
            if (event.keys.has('object')) {
                const objectAvailableStr = ymap.get('object');

                try {
                    const jsonObject = JSON.parse(objectAvailableStr);

                    if (ydoc.clientID !== jsonObject.changer) {

                        if (jsonObject.deleted) {
                            const obj = objectMapRef.current[jsonObject.id]
                            canvas.remove(obj);
                            delete objectMapRef.current[jsonObject.id];
                            saveToHistory();
                            updateShapeVersion();
                        }

                        const existingObject = canvas.getObjects().find(obj => obj.id === jsonObject.id);

                        if (existingObject) {

                            Object.keys(jsonObject).forEach((key) => {
                                if (key === 'type' || key === 'version') return;

                                if (key in existingObject) {
                                    existingObject.set(key, jsonObject[key]);
                                } else {
                                    existingObject[key] = jsonObject[key];
                                }
                            });

                            canvas.requestRenderAll();
                            saveToHistory();
                            updateShapeVersion();
                        }
                        else {
                            if (jsonObject.type) jsonObject.type = jsonObject.type.toLowerCase();
                            let shape = null;
                            let { type, path, ...optionsWithoutType } = jsonObject;
                            switch (jsonObject.type) {
                                case 'rect':
                                    shape = new fabric.Rect({
                                        ...optionsWithoutType
                                    });
                                    break;

                                case 'circle':
                                    shape = new fabric.Circle({
                                        ...optionsWithoutType
                                    });
                                    break;

                                case 'triangle':
                                    shape = new fabric.Triangle({
                                        ...optionsWithoutType
                                    });
                                    break;
                                case 'textbox':
                                    shape = new fabric.Text(jsonObject.text || '', {
                                        ...optionsWithoutType
                                    });
                                    break;
                                case 'line':
                                    shape = new fabric.Line(
                                        [optionsWithoutType.x1, optionsWithoutType.y1, optionsWithoutType.x2, optionsWithoutType.y2],
                                        optionsWithoutType
                                    );
                                    break;

                                case 'polygon':
                                case 'star':
                                case 'hexagon':
                                    shape = new fabric.Polygon(jsonObject.points, {
                                        ...optionsWithoutType,
                                    });
                                    break;
                                case 'group': {
                                    const shapes = jsonObject.objects.map(({ type, ...shapeJson }, index) => {
                                        try {
                                            switch (type) {
                                                case 'Rect':
                                                    return new fabric.Rect({
                                                        ...shapeJson
                                                    });
                                                case 'Circle':
                                                    return new fabric.Circle({
                                                        ...shapeJson
                                                    });
                                                default:
                                                    console.warn(`⚠️ Unsupported shape type "${type}" at index ${index} in group: ${jsonObject.id}`);
                                                    return null;
                                            }
                                        } catch (err) {
                                            console.error(`❌ Error creating shape of type "${type}" at index ${index}`, err, shapeJson);
                                            return null;
                                        }
                                    }).filter(obj => obj !== null);

                                    const { layoutManager, objects, type, ...safeGroupProps } = jsonObject;

                                    shape = new fabric.Group(shapes, {
                                        ...safeGroupProps
                                    });

                                    break;
                                }
                                case 'path':
                                    if (jsonObject.path) {
                                        const { path, ...optionsWithoutType } = jsonObject;
                                        shape = new fabric.Path(path, {
                                            ...optionsWithoutType
                                        });
                                    } else {
                                        console.warn('Missing path data for fabric.Path:', jsonObject);
                                    }
                                    break;
                                default:
                                    return;
                            }
                            if (shape) {
                                canvas.add(shape);
                                fabricCanvasRef.current.requestRenderAll();
                                objectMapRef.current[jsonObject.id] = shape;
                                saveToHistory();
                                updateShapeVersion();
                            }
                        }
                    }

                } catch (e) {
                    console.error('Failed to parse object from YMap:', e);
                }
            }
            if (event.keys.has('objectOrder')) {
                const orderStr = ymap.get('objectOrder');
                try {
                    const order = JSON.parse(orderStr);
                    const allObjects = canvas.getObjects();

                    const sortedObjects = order
                        .map(id => allObjects.find(obj => obj.id === id))
                        .filter(obj => obj);

                    canvas._objects = sortedObjects;
                    canvas.requestRenderAll();
                } catch (e) {
                    console.error('Failed to parse object order:', e);
                }
            }
        });
        canvas.on('mouse:move', (e) => {
            const pointer = canvas.getPointer(e.e);
            setMousePos({
                x: pointer?.x || 0,
                y: pointer?.y || 0
            });
            if (awarenessRef.current) {
                awarenessRef.current.setLocalStateField('user', {
                    ...awarenessRef.current.getLocalState().user,
                    cursor: { x: pointer.x, y: pointer.y }
                });
            }
        });

        // Initial load
        loadInitialState();

        return () => {
            canvas.dispose();
        };
    }, [canvasSize.width, canvasSize.height, isSynced]);

    const handleCanvasChange = (id, name) => {
        const owner = ydoc.clientID;
        const object = objectMapRef.current[id];

        if (!object || typeof object.toJSON !== 'function') {
            console.warn(`Object with id ${id} not found or not serializable.`);
            return;
        }
        const serialized = object.toJSON();
        if (!serialized.owner) serialized.owner = owner;
        serialized.changer = owner;
        serialized.id = id;
        serialized.name = name;

        const objectJSON = JSON.stringify(serialized, null, 2);

        ymap.set('object', objectJSON);
        ymap.set(id, objectJSON);
    };
    useEffect(() => {
        const canvas = fabricCanvasRef.current;
        if (canvas && syncCompleted) {
            canvas.clear();
            rebuildCanvasFromYMap(ymap, canvas, objectMapRef);
        }
    }, [fabricCanvasRef.current]);

    function rebuildCanvasFromYMap(ymap, canvas, objectMapRef) {
        const objectsToAdd = [];

        // If it's a new session, reconstruct the YMap from backend JSON
        if (session.isNewSession) {
            const jsonObject = JSON.parse(session.content);

            for (const key in jsonObject) {
                ymap.set(key, jsonObject[key]);
            }
        }


        // Loop through YMap (works both for real and temp maps)
        ymap.forEach((value, key) => {
            if (key === 'canvas') return;

            try {
                const jsonObject = JSON.parse(value);
                let shape = null;

                if (jsonObject.type) jsonObject.type = jsonObject.type.toLowerCase();

                switch (jsonObject.type) {
                    case 'rect':
                        shape = new fabric.Rect(jsonObject);
                        break;
                    case 'circle':
                        shape = new fabric.Circle(jsonObject);
                        break;
                    case 'triangle':
                        shape = new fabric.Triangle(jsonObject);
                        break;
                    case 'line':
                        shape = new fabric.Line([jsonObject.x1, jsonObject.y1, jsonObject.x2, jsonObject.y2], jsonObject);
                        break;
                    case 'polygon':
                    case 'star':
                    case 'hexagon':
                        shape = new fabric.Polygon(jsonObject.points, jsonObject);
                        break;
                    case 'textbox':
                        shape = new fabric.Text(jsonObject.text || '', jsonObject);
                        break;
                    case 'path':
                        if (jsonObject.path) shape = new fabric.Path(jsonObject.path, jsonObject);
                        break;
                    case 'group':
                        const groupObjects = (jsonObject.objects || []).map(obj => {
                            try {
                                switch (obj.type) {
                                    case 'rect': return new fabric.Rect(obj);
                                    case 'circle': return new fabric.Circle(obj);
                                    case 'triangle': return new fabric.Triangle(obj);
                                    case 'line': return new fabric.Line([obj.x1, obj.y1, obj.x2, obj.y2], obj);
                                    case 'path': return new fabric.Path(obj.path, obj);
                                    default:
                                        console.warn('Unsupported group sub-object type:', obj.type);
                                        return null;
                                }
                            } catch (err) {
                                console.error('Error creating group object:', obj, err);
                                return null;
                            }
                        }).filter(o => o !== null);

                        shape = new fabric.Group(groupObjects, jsonObject);
                        break;
                    default:
                        console.warn('Unknown object type:', jsonObject.type, jsonObject);
                }

                if (shape) {
                    objectsToAdd.push(shape);
                    objectMapRef.current[shape.id] = shape;
                }
            } catch (e) {
                console.error('❌ Failed parsing or creating object from YMap:', key, e);
            }
        });

        if (objectsToAdd.length > 0) {
            canvas.add(...objectsToAdd);
            saveToHistory();
            updateShapeVersion();
            canvas.requestRenderAll();
        } else {
            console.warn('⚠️ No valid objects found in YMap to add.');
        }
    }

    useEffect(() => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;

        const handleObjectMoving = (e) => {
            const target = e.target;
            if (target) {
                handleCanvasChange(target.id, target.name);
            }
        };

        canvas.on('object:moving', handleObjectMoving);

        return () => {
            canvas.off('object:moving', handleObjectMoving);
        };
    }, []);


    // Render collaborator cursors
    useEffect(() => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;

        // Clear existing cursor objects
        canvas.getObjects().forEach(obj => {
            if (obj.isCollaboratorCursor) {
                canvas.remove(obj);
            }
        });

        // Add cursors for each collaborator
        Object.entries(collaborators).forEach(([clientId, collaborator]) => {
            if (collaborator.cursor) {
                const cursor = new fabric.Circle({
                    left: collaborator.cursor.x,
                    top: collaborator.cursor.y,
                    radius: 5,
                    fill: collaborator.color,
                    originX: 'center',
                    originY: 'center',
                    hasControls: false,
                    hasBorders: false,
                    selectable: false,
                    evented: false,
                    isCollaboratorCursor: true,
                });

                const label = new fabric.Text(collaborator.name, {
                    left: collaborator.cursor.x + 10,
                    top: collaborator.cursor.y - 10,
                    fontSize: 12,
                    fill: collaborator.color,
                    fontFamily: 'Arial',
                    hasControls: false,
                    hasBorders: false,
                    selectable: false,
                    evented: false,
                    isCollaboratorCursor: true,
                });

                canvas.add(cursor);
                canvas.add(label);
            }
        });

        canvas.renderAll();
    }, [collaborators]);

    const rebuildObjectMap = () => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;
        objectMapRef.current = {};
        const objects = canvas._objects;
        objects.forEach((obj) => {
            if (obj.id) {
                objectMapRef.current[obj.id] = obj;
            }
        });
        updateShapeVersion();
    };

    // History management
    const saveToHistory = useCallback(() => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;
        const json = canvas.toJSON(['id', 'selectable', 'evented', 'customData']);
        const currentHistory = historyRef.current.slice(0, historyIndexRef.current + 1);
        currentHistory.push(json);
        const maxHistorySize = 500;
        if (currentHistory.length > maxHistorySize) {
            currentHistory.shift();
        } else {
            historyIndexRef.current = currentHistory.length - 1;
        }

        historyRef.current = currentHistory;
        setHistory([...currentHistory]);
        setHistoryIndex(historyIndexRef.current);
    }, []);

    const undo = useCallback(() => {
        if (historyIndexRef.current <= 0) return;

        const canvas = fabricCanvasRef.current;
        if (!canvas) return;

        const newIndex = historyIndexRef.current - 1;
        const json = historyRef.current[newIndex];

        canvas.off('object:added');
        canvas.off('object:modified');
        canvas.off('object:removed');

        canvas.loadFromJSON(json, () => {
            objectMapRef.current = {};
            canvas.getObjects().forEach(obj => {
                if (obj.id) objectMapRef.current[obj.id] = obj;

                // ✅ Send each object change to Yjs
                if (obj.id && typeof handleCanvasChange === 'function') {
                    handleCanvasChange(obj.id, obj.name || obj.type);
                }
            });

            canvas.calcOffset();
            canvas.discardActiveObject();
            canvas.renderAll();
            canvas.requestRenderAll();

            updateShapeVersion();
            historyIndexRef.current = newIndex;
            setHistoryIndex(newIndex);

            setTimeout(() => {
                canvas.on('object:added', saveToHistory);
                canvas.on('object:modified', saveToHistory);
                canvas.on('object:removed', saveToHistory);
            }, 10);
        });

        rebuildObjectMap();
    }, [handleCanvasChange, saveToHistory]);


    const redo = useCallback(() => {
        if (historyIndexRef.current >= historyRef.current.length - 1) return;

        const canvas = fabricCanvasRef.current;
        if (!canvas) return;

        const newIndex = historyIndexRef.current + 1;
        const json = historyRef.current[newIndex];

        canvas.off('object:added');
        canvas.off('object:modified');
        canvas.off('object:removed');

        canvas.loadFromJSON(json, () => {
            objectMapRef.current = {};
            canvas.getObjects().forEach(obj => {
                if (obj.id) objectMapRef.current[obj.id] = obj;

                // ✅ Broadcast each object after redo
                if (obj.id && typeof handleCanvasChange === 'function') {
                    handleCanvasChange(obj.id, obj.name || obj.type);
                }
            });

            canvas.calcOffset();
            canvas.discardActiveObject();
            canvas.renderAll();
            canvas.requestRenderAll();

            updateShapeVersion();
            historyIndexRef.current = newIndex;
            setHistoryIndex(newIndex);

            setTimeout(() => {
                canvas.on('object:added', saveToHistory);
                canvas.on('object:modified', saveToHistory);
                canvas.on('object:removed', saveToHistory);
            }, 10);
        });

        rebuildObjectMap();
    }, [handleCanvasChange, saveToHistory]);


    // Brush 
    useEffect(() => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;

        const handlePathCreated = (e) => {
            const path = e.path;
            const id = `id-${userName}_${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            path.id = id;
            path.name = `brush-${id}`;
            path.selectable = true;
            objectMapRef.current[id] = path;
            setObjects(prev => [...prev, path]);
            handleCanvasChange(id, path.name);
            saveToHistory();
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
    const yChatArray = ydoc.getArray('chat');

    // Shape creation and manipulation
    const handleMouseDown = (e) => {
        if (activeTool === 'brush') return;

        const canvas = fabricCanvasRef.current;
        const pointer = canvas.getPointer(e.e);
        const id = `id-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const name = `${activeTool}-${id}`;
        const commonProps = {
            left: pointer.x,
            top: pointer.y,
            stroke: color,
            fill: activeTool === 'line' ? null : fillColor,
            strokeWidth,
            selectable: true,
            hasControls: true,
            id,
            name,
            owner: ydoc.clientID
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
                const outerRadius = 50;
                const innerRadius = 25;
                shape = new fabric.Polygon(
                    createStarPoints(5, outerRadius, innerRadius),
                    {
                        ...commonProps,
                        originX: 'center',
                        originY: 'center',
                    }
                );
                break;
            case 'hexagon':
                const hexRadius = 50;
                shape = new fabric.Polygon(
                    createRegularPolygonPoints(6, hexRadius),
                    {
                        ...commonProps,
                        originX: 'center',
                        originY: 'center',
                    }
                );
                break;
            default:
                break;
        }

        if (shape) {
            canvas.add(shape);
            canvas.setActiveObject(shape);
            setCurrentShape(shape);
            objectMapRef.current[id] = shape;
            saveToHistory();
            updateShapeVersion();
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
            case 'hexagon': {
                const dxh = pointer.x - startPos.x;
                const dyh = pointer.y - startPos.y;
                const radius = Math.sqrt(dxh * dxh + dyh * dyh) / 2;

                const updatedPoints = createRegularPolygonPoints(6, radius);
                shape.set({
                    points: updatedPoints,
                    left: startPos.x,
                    top: startPos.y,
                });
                break;
            }
            case 'star': {
                const dxs = pointer.x - startPos.x;
                const dys = pointer.y - startPos.y;
                const outer = Math.sqrt(dxs * dxs + dys * dys) / 2;
                const inner = outer / 2;

                const updatedPoints = createStarPoints(5, outer, inner);
                shape.set({
                    points: updatedPoints,
                    left: startPos.x,
                    top: startPos.y,
                });
                break;
            }
        }
        canvas.renderAll();
    };

    const handleMouseUp = () => {
        setIsDrawing(false);
        if (currentShape && currentShape.id && currentShape.name) {
            handleCanvasChange(currentShape.id, currentShape.name);
        }
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

    // Helper functions 
    function createStarPoints(points, outerRadius, innerRadius) {
        const angle = Math.PI / points;
        const starPoints = [];

        for (let i = 0; i < 2 * points; i++) {
            const r = i % 2 === 0 ? outerRadius : innerRadius;
            const a = i * angle - Math.PI / 2;
            starPoints.push({
                x: Math.cos(a) * r,
                y: Math.sin(a) * r,
            });
        }

        return starPoints;
    }

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

    // Object management
    useEffect(() => {

        const list = Object.entries(objectMapRef.current).map(([id, obj]) => ({
            id,
            type: obj.type,
            name: obj.name,
            visible: obj.visible ?? true,
        }));
        setObjects(list);
    }, [shapeVersion]);

    const updateObjectOrder = () => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;

        const objectOrder = canvas.getObjects().map(obj => obj.id);
        ymap.set('objectOrder', JSON.stringify(objectOrder));
    };


    const bringToFront = () => {
        if (canvas && selectedObject) {
            const objects = canvas._objects;

            const index = objects.indexOf(selectedObject);
            if (index > -1) {
                objects.splice(index, 1);
                objects.push(selectedObject);
                canvas.requestRenderAll();
                saveToHistory();
                updateShapeVersion();
                updateObjectOrder();
            }
        }
    };

    useEffect(() => {
        if (selectedObject) setActiveTool('select');
    }, [selectedObject])

    const sendToBack = () => {
        if (canvas && selectedObject) {
            const objects = canvas._objects;
            const index = objects.indexOf(selectedObject);
            if (index > -1) {
                objects.splice(index, 1);
                objects.unshift(selectedObject);
                canvas.requestRenderAll();
                saveToHistory();
                updateShapeVersion();
                updateObjectOrder();
            }
        }
    };

    const handleCopy = async () => {
        const canvas = fabricCanvasRef.current;
        const activeObject = canvas.getActiveObject();

        if (!activeObject) return;

        const cloned = await activeObject.clone();
        setClipboard(cloned);
    };

    const handlePaste = async () => {
        const canvas = fabricCanvasRef.current;
        if (!clipboard || !canvas) return;

        const clonedObj = await clipboard.clone();

        canvas.discardActiveObject();

        if (clonedObj instanceof fabric.ActiveSelection) {
            clonedObj.canvas = canvas;

            clonedObj.forEachObject((obj) => {
                const newId = generateNewId();
                obj.set({
                    left: (obj.left || 0) + 10,
                    top: (obj.top || 0) + 10,
                    id: newId,
                });

                canvas.add(obj);
                objectMapRef.current[newId] = obj;

                handleCanvasChange(newId, obj.name || obj.type);
            });

            clonedObj.setCoords();
        } else {
            const newId = generateNewId();
            clonedObj.set({
                left: (clonedObj.left || 0) + 10,
                top: (clonedObj.top || 0) + 10,
                id: newId,
            });

            canvas.add(clonedObj);
            objectMapRef.current[newId] = clonedObj;

            handleCanvasChange(newId, clonedObj.name || clonedObj.type);
        }

        updateShapeVersion();
        saveToHistory();

        clipboard.top += 10;
        clipboard.left += 10;

        canvas.setActiveObject(clonedObj);
        canvas.requestRenderAll();
    };


    const generateNewId = () => {
        return `id-cp_${userName}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    };

    const handleDelete = () => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;

        const activeObject = canvas.getActiveObject();
        if (!activeObject) return;

        if (activeObject instanceof fabric.ActiveSelection) {
            activeObject.forEachObject((obj) => {
                canvas.remove(obj);
                if (obj.id) {
                    delete objectMapRef.current[obj.id];
                    ymap.set('object', JSON.stringify({ id: obj.id, deleted: true }));
                    ymap.set(obj.id, null);  // Optional: per-id null marker
                }
            });
        } else {
            canvas.remove(activeObject);
            if (activeObject.id) {
                delete objectMapRef.current[activeObject.id];
                ymap.set('object', JSON.stringify({ id: activeObject.id, deleted: true }));
                ymap.set(activeObject.id, null);
            }
        }

        updateShapeVersion();
        saveToHistory();
        canvas.discardActiveObject();
        canvas.requestRenderAll();
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
            updateShapeVersion();
            saveToHistory();
            handleCanvasChange(obj.id, obj.name);
        }
    };

    const handleNameUpdate = (id, newName) => {
        const obj = objectMapRef.current[id];
        if (obj) {
            obj.name = newName;
            updateShapeVersion();
            saveToHistory();
            handleCanvasChange(obj.id, obj.name);
        }

    };
    const updateShapeVersion = useCallback(() => {
        setShapeVersion(prev => prev + 1);
    }, []);
    const updateObjectProp = (prop, value) => {
        if (!selectedObject) return;
        const selectedObjectUsage = objectMapRef.current[selectedObject.id]
        selectedObjectUsage.set(prop, value);
        if (['width', 'height', 'left', 'top', 'radius'].includes(prop)) {
            selectedObjectUsage.setCoords();
        }

        fabricCanvasRef.current.renderAll();
        setSelectedObject({ ...selectedObjectUsage });
        saveToHistory();
        handleCanvasChange(selectedObjectUsage.id, selectedObjectUsage.name);
    };

    const updateTextProp = (prop, value) => {
        if (canvas && selectedObject && selectedObject.type === 'textbox' && selectedObject.id) {
            const selectedObjectUsage = objectMapRef.current[selectedObject.id]
            selectedObjectUsage.set(prop, value);
            canvas.requestRenderAll();
            setSelectedObject(prev => ({
                ...prev,
                [prop]: value,
            }));

            saveToHistory();
            updateShapeVersion();
            handleCanvasChange(selectedObject.id, selectedObject.name);
        }
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

    // Collaborator status indicator
    const CollaboratorStatus = () => (
        <div className="fixed top-16 right-4 flex items-center space-x-2">
            <div className={`px-2 py-1 rounded-full text-xs ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-800'}`}>
                {Object.keys(collaborators).length + 1} online
            </div>
        </div>
    );
    if (!session) {
        return (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-600"></div>
        </div>);
    }

    return (
        <div className={`flex flex-col h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
            {/* Top Toolbar */}
            <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b px-4 py-3 flex items-center justify-between`}>
                <div className="flex items-center space-x-4">

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
                            onClick={handleDelete}
                            title="Delete All"
                            disabled={selectedObject === null && selectedObjects === null}
                        />

                        <ToolButton
                            icon={Copy}
                            onClick={handleCopy}
                            title="Copy"
                            disabled={objects.length === 0}
                        />

                        <ToolButton
                            icon={Clipboard}
                            onClick={handlePaste}
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
                </div>
                {/* Canvas Area */}
                <div className={`flex-1 overflow-auto bg-gray-100 ${darkMode && 'bg-red-900'}flex items-center justify-center`}>
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
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                        />
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

                    {/* Collaborator status */}
                    <CollaboratorStatus />
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
                                            const isLocked = e.target.checked;

                                            updateObjectProp('lockMovementX', isLocked);
                                            updateObjectProp('lockMovementY', isLocked);
                                            updateObjectProp('selectable', !isLocked);
                                            updateObjectProp('hasControls', !isLocked);
                                        }}
                                    />
                                    <label className={`text-sm ${darkMode ? 'text-white' : 'text-gray-700'}`}>
                                        Lock Position
                                    </label>
                                </div>
                                {/* Text Properties */}
                                {selectedObject?.type === 'textbox' && (
                                    <div className="space-y-4">

                                        {/* Font Size */}
                                        <div>
                                            <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Font Size</label>
                                            <input
                                                type="number"
                                                value={selectedObject.fontSize ?? 16}
                                                onChange={(e) => updateTextProp('fontSize', parseFloat(e.target.value))}
                                                className="border p-2 rounded w-full"
                                            />
                                        </div>

                                        {/* Font Family */}
                                        <div>
                                            <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Font Family</label>
                                            <select
                                                value={selectedObject.fontFamily ?? 'Arial'}
                                                onChange={(e) => updateTextProp('fontFamily', e.target.value)}
                                                className="border p-2 rounded w-full"
                                            >
                                                <option value="Arial">Arial</option>
                                                <option value="Helvetica">Helvetica</option>
                                                <option value="Times New Roman">Times New Roman</option>
                                                <option value="Courier New">Courier New</option>
                                                <option value="Georgia">Georgia</option>
                                                <option value="Verdana">Verdana</option>
                                            </select>
                                        </div>

                                        {/* Bold && Italic */}
                                        <div className="flex space-x-2">
                                            <ToolButton
                                                icon={Bold}
                                                isActive={selectedObject?.fontWeight === 'bold'}
                                                onClick={() => {
                                                    updateTextProp('fontWeight', selectedObject.fontWeight === 'bold' ? 'normal' : 'bold')
                                                }}
                                                title="Bold"
                                                disabled={!selectedObject || selectedObject.type !== 'textbox'}
                                            />
                                            <ToolButton
                                                icon={Italic}
                                                isActive={selectedObject?.fontStyle === 'italic'}
                                                onClick={() => {
                                                    updateTextProp('fontStyle', selectedObject.fontStyle === 'italic' ? 'normal' : 'italic')
                                                }}
                                                title="Italic"
                                                disabled={!selectedObject || selectedObject.type !== 'textbox'}
                                            />
                                        </div>

                                        {/* Text Alignment */}
                                        <div className="flex space-x-2">
                                            <ToolButton
                                                icon={AlignLeft}
                                                isActive={selectedObject?.textAlign === 'left'}
                                                onClick={() => updateTextProp('textAlign', 'left')}
                                                title="Bold"
                                                disabled={!selectedObject || selectedObject.type !== 'textbox'}
                                            />
                                            <ToolButton
                                                icon={AlignCenter}
                                                isActive={selectedObject?.textAlign === 'center'}
                                                onClick={() => updateTextProp('textAlign', 'center')}
                                                title="Italic"
                                                disabled={!selectedObject || selectedObject.type !== 'textbox'}
                                            />
                                            <ToolButton
                                                icon={AlignRight}
                                                isActive={selectedObject?.textAlign === 'right'}
                                                onClick={() => updateTextProp('textAlign', 'right')}
                                                title="Bold"
                                                disabled={!selectedObject || selectedObject.type !== 'textbox'}
                                            />
                                        </div>

                                        {/* Text Value */}
                                        <div>
                                            <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Text</label>
                                            <textarea
                                                value={selectedObject.text ?? ''}
                                                onChange={(e) => updateTextProp('text', e.target.value)}
                                                className="border p-2 rounded w-full"
                                            />
                                        </div>

                                    </div>
                                )}
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
                            {activeTool === 'brush' ? (
                                <div className="flex flex-col space-y-2">
                                    <label className={`text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Brush Size
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
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <div className="fixed bottom-4 right-4 z-50">
                <Message darkMode={darkMode} yChatArray={yChatArray} username={name} />
            </div>
        </div>
    );
};

export default AdvancedCanvasEditor;