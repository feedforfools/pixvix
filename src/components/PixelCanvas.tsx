import { useRef, useEffect, useCallback, useState } from "react";
import { Plus, Minus, RotateCcw, Maximize2 } from "lucide-react";
import { Button } from "./ui/button";
import type {
  GridConfig,
  CropRegion,
  OutputFrame,
  WorkflowStep,
} from "../types";
import {
  getGridDimensions,
  getCellCenter,
  getPixelColor,
  colorToRgba,
} from "../core/gridSampler";

interface PixelCanvasProps {
  originalImage: HTMLImageElement | null;
  gridConfig: GridConfig;
  ignoredPixels: Set<string>;
  onTogglePixel: (key: string) => void;
  mode: WorkflowStep;
  cropRegion: CropRegion | null;
  onCropChange: (crop: CropRegion | null) => void;
  outputFrame: OutputFrame | null;
}

/** Zoom constraints */
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 32;
const ZOOM_STEP = 1.14;
const WHEEL_ZOOM_FACTOR = 0.01; // Fine-grained wheel zoom sensitivity

/** Target percentage of canvas to fill when auto-fitting */
const TARGET_FIT = 0.7;

/** Grid line thickness in screen pixels (constant regardless of zoom) */
const GRID_LINE_THICKNESS = 1;

/**
 * Generate a unique key for a grid cell.
 */
function getCellKey(col: number, row: number): string {
  return `${col}-${row}`;
}

export function PixelCanvas({
  originalImage,
  gridConfig,
  ignoredPixels,
  onTogglePixel,
  mode,
  cropRegion,
  onCropChange,
  outputFrame,
}: PixelCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sourceCanvasRef = useRef<HTMLCanvasElement>(null);
  const displayCanvasRef = useRef<HTMLCanvasElement>(null);
  const gridCanvasRef = useRef<HTMLCanvasElement>(null);

  // Zoom and pan state
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const panStartRef = useRef({ x: 0, y: 0 });
  const lastPanOffsetRef = useRef({ x: 0, y: 0 });

  // Crop/selection drag state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(
    null
  );
  const [dragCurrent, setDragCurrent] = useState<{
    x: number;
    y: number;
  } | null>(null);

  // Pixel toggle drag state (for refine mode)
  const [isPixelDragging, setIsPixelDragging] = useState(false);
  const [pixelDragMode, setPixelDragMode] = useState<"add" | "remove" | null>(
    null
  );
  const toggledPixelsRef = useRef<Set<string>>(new Set());

  // Determine what to show based on mode
  const showGrid = mode === "grid" || mode === "refine";
  const showPreview = mode === "refine" || mode === "export";
  const allowPixelToggle = mode === "refine";
  const allowCropDrag = mode === "crop";

  // Prevent browser zoom/pan gestures on the container
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Prevent browser pinch-to-zoom and scroll gestures
    // Must use native event listener with { passive: false } to allow preventDefault
    const preventGesture = (e: Event) => {
      e.preventDefault();
    };

    // Wheel events (pinch zoom on trackpad sends wheel events with ctrlKey)
    const handleNativeWheel = (e: WheelEvent) => {
      e.preventDefault();
    };

    container.addEventListener("wheel", handleNativeWheel, { passive: false });
    container.addEventListener("gesturestart", preventGesture);
    container.addEventListener("gesturechange", preventGesture);
    container.addEventListener("gestureend", preventGesture);

    return () => {
      container.removeEventListener("wheel", handleNativeWheel);
      container.removeEventListener("gesturestart", preventGesture);
      container.removeEventListener("gesturechange", preventGesture);
      container.removeEventListener("gestureend", preventGesture);
    };
  }, []);

  // Calculate fit zoom and reset when image changes
  useEffect(() => {
    if (
      !originalImage ||
      containerSize.width === 0 ||
      containerSize.height === 0
    ) {
      setZoom(1);
      setPanOffset({ x: 0, y: 0 });
      return;
    }

    const { naturalWidth, naturalHeight } = originalImage;
    const targetWidth = containerSize.width * TARGET_FIT;
    const targetHeight = containerSize.height * TARGET_FIT;

    // Calculate zoom to fit image within target area
    const fitZoom = Math.min(
      targetWidth / naturalWidth,
      targetHeight / naturalHeight
    );

    // Clamp to zoom limits
    const clampedZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, fitZoom));

    setZoom(clampedZoom);
    setPanOffset({ x: 0, y: 0 });
  }, [originalImage, containerSize.width, containerSize.height]);

  // Track container size for grid overlay
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateSize = () => {
      setContainerSize({
        width: container.clientWidth,
        height: container.clientHeight,
      });
    };

    updateSize();
    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, []);

  // Draw image (without grid) when dependencies change
  useEffect(() => {
    const sourceCanvas = sourceCanvasRef.current;
    const displayCanvas = displayCanvasRef.current;

    if (!sourceCanvas || !displayCanvas) return;

    const sourceCtx = sourceCanvas.getContext("2d");
    const displayCtx = displayCanvas.getContext("2d");

    if (!sourceCtx || !displayCtx) return;

    if (!originalImage) {
      sourceCanvas.width = 1;
      sourceCanvas.height = 1;
      displayCanvas.width = 1;
      displayCanvas.height = 1;
      return;
    }

    const { naturalWidth, naturalHeight } = originalImage;
    const { gridSize, offsetX, offsetY } = gridConfig;

    // Set source canvas to original image size (for pixel data reading)
    sourceCanvas.width = naturalWidth;
    sourceCanvas.height = naturalHeight;
    sourceCtx.drawImage(originalImage, 0, 0);

    // Get image data from source canvas for sampling
    const imageData = sourceCtx.getImageData(0, 0, naturalWidth, naturalHeight);

    // Set display canvas to original size
    displayCanvas.width = naturalWidth;
    displayCanvas.height = naturalHeight;

    if (showPreview) {
      // Draw sampled preview - fill each grid cell with center pixel color
      const { cols, rows } = getGridDimensions(
        naturalWidth,
        naturalHeight,
        gridConfig
      );

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const key = getCellKey(col, row);
          if (ignoredPixels.has(key)) continue;

          const center = getCellCenter(col, row, gridConfig);
          const color = getPixelColor(imageData, center.x, center.y);

          if (color) {
            displayCtx.fillStyle = colorToRgba(color);
            displayCtx.fillRect(
              col * gridSize + offsetX,
              row * gridSize + offsetY,
              gridSize,
              gridSize
            );
          }
        }
      }
    } else {
      displayCtx.drawImage(originalImage, 0, 0);
    }
  }, [originalImage, gridConfig, showPreview, ignoredPixels, mode]);

  // Draw overlay at screen resolution (grid, crop region, output frame)
  useEffect(() => {
    const gridCanvas = gridCanvasRef.current;
    const container = containerRef.current;
    if (!gridCanvas || !container || !originalImage) return;

    const ctx = gridCanvas.getContext("2d");
    if (!ctx) return;

    const { naturalWidth, naturalHeight } = originalImage;
    const { gridSize, offsetX, offsetY } = gridConfig;

    // Set grid canvas to container size (screen pixels)
    const dpr = window.devicePixelRatio || 1;
    gridCanvas.width = containerSize.width * dpr;
    gridCanvas.height = containerSize.height * dpr;
    ctx.scale(dpr, dpr);

    // Clear previous grid
    ctx.clearRect(0, 0, containerSize.width, containerSize.height);

    // Calculate where the image is positioned on screen
    // Must match CSS: flex centering + transform translate + scale from center
    const displayCanvas = displayCanvasRef.current;
    if (!displayCanvas) return;

    // The canvas element's size before transform
    const canvasWidth = displayCanvas.width; // naturalWidth
    const canvasHeight = displayCanvas.height; // naturalHeight

    // Flex centers the canvas, then transform applies from center
    // After centering: canvas center is at container center
    // After translate: canvas center moves by panOffset
    // After scale from center: canvas expands from its center

    const imageScreenWidth = canvasWidth * zoom;
    const imageScreenHeight = canvasHeight * zoom;

    // The image center in screen coordinates
    const imageCenterX = containerSize.width / 2 + panOffset.x;
    const imageCenterY = containerSize.height / 2 + panOffset.y;

    // Image top-left corner (don't round here - keep sub-pixel precision)
    const imageLeft = imageCenterX - imageScreenWidth / 2;
    const imageTop = imageCenterY - imageScreenHeight / 2;

    // Draw grid lines (only in grid/refine modes)
    if (showGrid) {
      ctx.strokeStyle = "rgba(0, 255, 255, 0.8)";
      ctx.lineWidth = GRID_LINE_THICKNESS;

      // Vertical lines: start at offsetX, then every gridSize
      // Line positions in image coordinates: offsetX, offsetX + gridSize, offsetX + 2*gridSize, ...
      for (let imgX = offsetX; imgX <= naturalWidth; imgX += gridSize) {
        // Don't add 0.5 - it shifts lines relative to the image
        const screenX = imageLeft + imgX * zoom;
        if (screenX >= -1 && screenX <= containerSize.width + 1) {
          ctx.beginPath();
          ctx.moveTo(screenX, Math.max(0, imageTop));
          ctx.lineTo(
            screenX,
            Math.min(containerSize.height, imageTop + imageScreenHeight)
          );
          ctx.stroke();
        }
      }

      // Horizontal lines: start at offsetY, then every gridSize
      for (let imgY = offsetY; imgY <= naturalHeight; imgY += gridSize) {
        const screenY = imageTop + imgY * zoom;
        if (screenY >= -1 && screenY <= containerSize.height + 1) {
          ctx.beginPath();
          ctx.moveTo(Math.max(0, imageLeft), screenY);
          ctx.lineTo(
            Math.min(containerSize.width, imageLeft + imageScreenWidth),
            screenY
          );
          ctx.stroke();
        }
      }
    }

    // Draw crop region (in crop mode)
    if (mode === "crop" && cropRegion) {
      const cropLeft = imageLeft + cropRegion.x * zoom;
      const cropTop = imageTop + cropRegion.y * zoom;
      const cropWidth = cropRegion.width * zoom;
      const cropHeight = cropRegion.height * zoom;

      // Dim outside areas
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      // Top
      ctx.fillRect(imageLeft, imageTop, imageScreenWidth, cropTop - imageTop);
      // Bottom
      ctx.fillRect(
        imageLeft,
        cropTop + cropHeight,
        imageScreenWidth,
        imageTop + imageScreenHeight - cropTop - cropHeight
      );
      // Left
      ctx.fillRect(imageLeft, cropTop, cropLeft - imageLeft, cropHeight);
      // Right
      ctx.fillRect(
        cropLeft + cropWidth,
        cropTop,
        imageLeft + imageScreenWidth - cropLeft - cropWidth,
        cropHeight
      );

      // Crop border
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.strokeRect(cropLeft, cropTop, cropWidth, cropHeight);
    }

    // Draw drag selection (while dragging for crop or output frame)
    if (isDragging && dragStart && dragCurrent) {
      const x1 = Math.min(dragStart.x, dragCurrent.x);
      const y1 = Math.min(dragStart.y, dragCurrent.y);
      const x2 = Math.max(dragStart.x, dragCurrent.x);
      const y2 = Math.max(dragStart.y, dragCurrent.y);
      const w = x2 - x1;
      const h = y2 - y1;

      if (mode === "crop") {
        // Use XOR composite for inverted colors that stand out on any background
        ctx.save();
        ctx.globalCompositeOperation = "difference";
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 4]);
        ctx.strokeRect(x1, y1, w, h);
        ctx.setLineDash([]);
        ctx.restore();

        // Add a second contrasting stroke for extra visibility
        ctx.strokeStyle = "rgba(0, 255, 255, 0.8)";
        ctx.lineWidth = 1;
        ctx.setLineDash([8, 4]);
        ctx.lineDashOffset = 4; // Offset to fill gaps
        ctx.strokeRect(x1, y1, w, h);
        ctx.setLineDash([]);
        ctx.lineDashOffset = 0;
      } else {
        ctx.strokeStyle = "#ffff00";
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(x1, y1, w, h);
        ctx.setLineDash([]);
      }
    }

    if (outputFrame) {
      const { cols, rows } = getGridDimensions(
        naturalWidth,
        naturalHeight,
        gridConfig
      );

      // Use outputFrame if set, otherwise show the full grid bounds
      const frame = outputFrame || {
        startCol: 0,
        startRow: 0,
        endCol: cols - 1,
        endRow: rows - 1,
      };

      const frameLeft =
        imageLeft + (frame.startCol * gridSize + offsetX) * zoom;
      const frameTop = imageTop + (frame.startRow * gridSize + offsetY) * zoom;
      const frameWidth = (frame.endCol - frame.startCol + 1) * gridSize * zoom;
      const frameHeight = (frame.endRow - frame.startRow + 1) * gridSize * zoom;

      // In export mode with outputFrame, dim outside areas
      if (outputFrame) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
        const gridLeft = imageLeft + offsetX * zoom;
        const gridTop = imageTop + offsetY * zoom;
        const gridWidth = cols * gridSize * zoom;
        const gridHeight = rows * gridSize * zoom;

        // Top
        ctx.fillRect(gridLeft, gridTop, gridWidth, frameTop - gridTop);
        // Bottom
        ctx.fillRect(
          gridLeft,
          frameTop + frameHeight,
          gridWidth,
          gridTop + gridHeight - frameTop - frameHeight
        );
        // Left
        ctx.fillRect(gridLeft, frameTop, frameLeft - gridLeft, frameHeight);
        // Right
        ctx.fillRect(
          frameLeft + frameWidth,
          frameTop,
          gridLeft + gridWidth - frameLeft - frameWidth,
          frameHeight
        );
      }

      // Frame border - yellow for output frame
      ctx.strokeStyle = "#ffff00";
      ctx.lineWidth = 2;
      ctx.strokeRect(frameLeft, frameTop, frameWidth, frameHeight);
    }
  }, [
    originalImage,
    gridConfig,
    zoom,
    panOffset,
    containerSize,
    showGrid,
    mode,
    cropRegion,
    outputFrame,
    isDragging,
    dragStart,
    dragCurrent,
  ]);

  // Zoom handlers
  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(prev * ZOOM_STEP, MAX_ZOOM));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => Math.max(prev / ZOOM_STEP, MIN_ZOOM));
  }, []);

  const handleZoomReset = useCallback(() => {
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
  }, []);

  const handleCenter = useCallback(() => {
    setPanOffset({ x: 0, y: 0 });
  }, []);

  // Wheel handler: scroll to pan, ctrl+scroll or pinch to zoom
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (!originalImage) return;

      // Pinch gesture or ctrl+scroll = zoom
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();

        const container = containerRef.current;
        if (!container) return;

        const rect = container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left - rect.width / 2;
        const mouseY = e.clientY - rect.top - rect.height / 2;

        // Use continuous zoom factor based on delta for smoother control
        // Smaller multiplier = less sensitive
        const zoomDelta = -e.deltaY * WHEEL_ZOOM_FACTOR;
        const zoomFactor = Math.exp(zoomDelta); // Smooth exponential scaling
        const newZoom = Math.max(
          MIN_ZOOM,
          Math.min(MAX_ZOOM, zoom * zoomFactor)
        );

        // Adjust pan to zoom towards cursor position
        const zoomRatio = newZoom / zoom;
        const newPanX = mouseX - (mouseX - panOffset.x) * zoomRatio;
        const newPanY = mouseY - (mouseY - panOffset.y) * zoomRatio;

        setZoom(newZoom);
        setPanOffset({ x: newPanX, y: newPanY });
      } else {
        // Regular scroll = pan
        e.preventDefault();
        setPanOffset((prev) => ({
          x: prev.x - e.deltaX,
          y: prev.y - e.deltaY,
        }));
      }
    },
    [originalImage, zoom, panOffset]
  );

  // Helper to convert screen coordinates to grid cell
  const screenToGridCell = useCallback(
    (screenX: number, screenY: number): { col: number; row: number } | null => {
      if (!originalImage) return null;

      const { naturalWidth, naturalHeight } = originalImage;
      const { gridSize, offsetX, offsetY } = gridConfig;

      // Calculate image position on screen
      const centerX = containerSize.width / 2 + panOffset.x;
      const centerY = containerSize.height / 2 + panOffset.y;
      const imageScreenWidth = naturalWidth * zoom;
      const imageScreenHeight = naturalHeight * zoom;
      const imageLeft = centerX - imageScreenWidth / 2;
      const imageTop = centerY - imageScreenHeight / 2;

      // Convert to image coordinates
      const imgX = (screenX - imageLeft) / zoom;
      const imgY = (screenY - imageTop) / zoom;

      // Convert to grid cell
      const col = Math.floor((imgX - offsetX) / gridSize);
      const row = Math.floor((imgY - offsetY) / gridSize);

      // Validate bounds
      const { cols, rows } = getGridDimensions(
        naturalWidth,
        naturalHeight,
        gridConfig
      );
      if (col >= 0 && col < cols && row >= 0 && row < rows) {
        return { col, row };
      }
      return null;
    },
    [originalImage, gridConfig, containerSize, panOffset, zoom]
  );

  // Pan handlers
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!originalImage) return;

      const container = containerRef.current;
      if (!container) return;

      // Middle mouse button or shift+left click for panning
      if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
        e.preventDefault();
        setIsPanning(true);
        panStartRef.current = { x: e.clientX, y: e.clientY };
        lastPanOffsetRef.current = panOffset;
        return;
      }

      // Left click for crop drag in crop mode
      if (e.button === 0 && allowCropDrag) {
        const rect = container.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;
        setIsDragging(true);
        setDragStart({ x: screenX, y: screenY });
        setDragCurrent({ x: screenX, y: screenY });
        return;
      }

      // Left click for pixel toggle drag in refine mode
      if (e.button === 0 && allowPixelToggle) {
        const rect = container.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;
        const cell = screenToGridCell(screenX, screenY);

        if (cell) {
          const key = getCellKey(cell.col, cell.row);
          // Determine mode: if pixel is currently visible, we're adding to ignored (removing pixel)
          // if pixel is ignored, we're removing from ignored (restoring pixel)
          const mode = ignoredPixels.has(key) ? "remove" : "add";
          setPixelDragMode(mode);
          setIsPixelDragging(true);
          toggledPixelsRef.current = new Set([key]);
          onTogglePixel(key);
        }
        return;
      }
    },
    [
      originalImage,
      panOffset,
      allowCropDrag,
      allowPixelToggle,
      screenToGridCell,
      ignoredPixels,
      onTogglePixel,
    ]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const container = containerRef.current;
      if (!container) return;

      if (isPanning) {
        const dx = e.clientX - panStartRef.current.x;
        const dy = e.clientY - panStartRef.current.y;
        setPanOffset({
          x: lastPanOffsetRef.current.x + dx,
          y: lastPanOffsetRef.current.y + dy,
        });
        return;
      }

      // Handle pixel toggle drag in refine mode
      if (isPixelDragging && pixelDragMode) {
        const rect = container.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;
        const cell = screenToGridCell(screenX, screenY);

        if (cell) {
          const key = getCellKey(cell.col, cell.row);
          // Only toggle if we haven't already toggled this pixel in this drag
          if (!toggledPixelsRef.current.has(key)) {
            const isCurrentlyIgnored = ignoredPixels.has(key);
            // Only toggle if it matches our drag mode
            if (
              (pixelDragMode === "add" && !isCurrentlyIgnored) ||
              (pixelDragMode === "remove" && isCurrentlyIgnored)
            ) {
              toggledPixelsRef.current.add(key);
              onTogglePixel(key);
            }
          }
        }
        return;
      }

      if (isDragging) {
        const rect = container.getBoundingClientRect();
        setDragCurrent({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      }
    },
    [
      isPanning,
      isDragging,
      isPixelDragging,
      pixelDragMode,
      screenToGridCell,
      ignoredPixels,
      onTogglePixel,
    ]
  );

  const handleMouseUp = useCallback(() => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }

    if (isPixelDragging) {
      setIsPixelDragging(false);
      setPixelDragMode(null);
      toggledPixelsRef.current.clear();
      return;
    }

    if (isDragging && dragStart && dragCurrent && originalImage) {
      const container = containerRef.current;
      if (!container) return;

      const { naturalWidth, naturalHeight } = originalImage;
      // const { gridSize, offsetX, offsetY } = gridConfig;

      // Calculate image position on screen
      const centerX = containerSize.width / 2 + panOffset.x;
      const centerY = containerSize.height / 2 + panOffset.y;
      const imageScreenWidth = naturalWidth * zoom;
      const imageScreenHeight = naturalHeight * zoom;
      const imageLeft = centerX - imageScreenWidth / 2;
      const imageTop = centerY - imageScreenHeight / 2;

      // Convert screen coords to image coords
      const x1 = Math.min(dragStart.x, dragCurrent.x);
      const y1 = Math.min(dragStart.y, dragCurrent.y);
      const x2 = Math.max(dragStart.x, dragCurrent.x);
      const y2 = Math.max(dragStart.y, dragCurrent.y);

      const imgX1 = Math.max(0, Math.floor((x1 - imageLeft) / zoom));
      const imgY1 = Math.max(0, Math.floor((y1 - imageTop) / zoom));
      const imgX2 = Math.min(naturalWidth, Math.ceil((x2 - imageLeft) / zoom));
      const imgY2 = Math.min(naturalHeight, Math.ceil((y2 - imageTop) / zoom));

      const width = imgX2 - imgX1;
      const height = imgY2 - imgY1;

      // Only create region if it has meaningful size
      if (width > 5 && height > 5) {
        if (allowCropDrag) {
          onCropChange({ x: imgX1, y: imgY1, width, height });
        }
      }

      setIsDragging(false);
      setDragStart(null);
      setDragCurrent(null);
    }
  }, [
    isPanning,
    isDragging,
    isPixelDragging,
    dragStart,
    dragCurrent,
    originalImage,
    gridConfig,
    containerSize,
    panOffset,
    zoom,
    allowCropDrag,
    onCropChange,
  ]);

  // Canvas click is now handled by mouseDown/mouseUp for drag support
  const handleCanvasClick = useCallback(
    (_e: React.MouseEvent<HTMLCanvasElement>) => {
      // Pixel toggle is handled by drag handlers now
    },
    []
  );

  // Prevent context menu on middle click
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    if (e.button === 1) {
      e.preventDefault();
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden select-none"
      style={{
        // Checkered transparent background pattern
        backgroundImage: `
          linear-gradient(45deg, #404040 25%, transparent 25%),
          linear-gradient(-45deg, #404040 25%, transparent 25%),
          linear-gradient(45deg, transparent 75%, #404040 75%),
          linear-gradient(-45deg, transparent 75%, #404040 75%)
        `,
        backgroundSize: "20px 20px",
        backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
        backgroundColor: "#303030",
        cursor: isPanning
          ? "grabbing"
          : originalImage
          ? "crosshair"
          : "default",
        // Prevent browser touch gestures (pinch zoom, pan)
        touchAction: "none",
      }}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onContextMenu={handleContextMenu}
    >
      {/* Hidden source canvas for reading pixel data */}
      <canvas ref={sourceCanvasRef} className="hidden" />

      {/* Canvas container for centering and transforms */}
      <div className="absolute inset-0 flex items-center justify-center">
        {originalImage ? (
          <canvas
            ref={displayCanvasRef}
            className="cursor-crosshair"
            style={{
              imageRendering: "pixelated",
              transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
              transformOrigin: "center center",
            }}
            onClick={handleCanvasClick}
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-muted-foreground gap-4">
            <div className="w-24 h-24 border-2 border-dashed border-muted-foreground/50 rounded-lg flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="opacity-50"
              >
                <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                <circle cx="9" cy="9" r="2" />
                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
              </svg>
            </div>
            <p className="text-sm">Upload an image to start</p>
          </div>
        )}
      </div>

      {/* Grid overlay canvas - drawn at screen resolution for crisp lines */}
      {originalImage && (
        <canvas
          ref={gridCanvasRef}
          className="absolute inset-0 pointer-events-none"
          style={{
            width: containerSize.width,
            height: containerSize.height,
          }}
        />
      )}

      {/* Zoom controls - bottom right corner */}
      {originalImage && (
        <div className="absolute bottom-4 right-4 flex flex-row gap-1 bg-card/90 backdrop-blur-sm rounded-lg p-1 border border-border shadow-lg">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleZoomOut}
            title="Zoom out"
          >
            <Minus className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleZoomIn}
            title="Zoom in"
          >
            <Plus className="h-4 w-4" />
          </Button>
          <div className="w-px bg-border my-1" />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleCenter}
            title="Center image"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleZoomReset}
            title="Reset zoom"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
