import { useState, useCallback, useRef, useMemo } from "react";
import { StepIndicator } from "./StepIndicator";
import { UploadSidebar } from "./UploadSidebar";
import { CropSidebar } from "./CropSidebar";
import { GridSidebar } from "./GridSidebar";
import { RefineSidebar } from "./RefineSidebar";
import { ExportSidebar } from "./ExportSidebar";
import { PixelCanvas } from "./PixelCanvas";
import { useImageLoader } from "../hooks/useImageLoader";
import {
  sampleGrid,
  getGridDimensions,
  getMinimalBoundingFrame,
} from "../core/gridSampler";
import { generateSvg, downloadSvg, downloadPng } from "../core/svgGenerator";
import type {
  GridConfig,
  WorkflowStep,
  CropRegion,
  OutputFrame,
  PixelColor,
} from "../types";

const DEFAULT_GRID_SIZE = 8;

export function Layout() {
  const { originalImage, dimensions, isLoading, error, loadImage } =
    useImageLoader();

  // Workflow state
  const [currentStep, setCurrentStep] = useState<WorkflowStep>("upload");
  const [completedSteps, setCompletedSteps] = useState<Set<WorkflowStep>>(
    new Set()
  );

  // Crop state
  const [cropRegion, setCropRegion] = useState<CropRegion | null>(null);
  const [croppedImage, setCroppedImage] = useState<HTMLImageElement | null>(
    null
  );

  // Grid state
  const [gridConfig, setGridConfig] = useState<GridConfig>({
    gridSize: DEFAULT_GRID_SIZE,
    offsetX: 0,
    offsetY: 0,
  });

  // Refine state
  const [ignoredPixels, setIgnoredPixels] = useState<Set<string>>(new Set());
  const [outputFrame, setOutputFrame] = useState<OutputFrame | null>(null);

  // Grid preview state
  const [showGridPreview, setShowGridPreview] = useState(false);

  // Ref to hidden canvas for cropping and export
  const workCanvasRef = useRef<HTMLCanvasElement>(null);

  // Get the working image (cropped or original)
  const workingImage = croppedImage || originalImage;
  const workingDimensions = croppedImage
    ? { width: croppedImage.naturalWidth, height: croppedImage.naturalHeight }
    : dimensions;

  // Calculate grid dimensions
  const gridDimensions = workingImage
    ? getGridDimensions(
        workingImage.naturalWidth,
        workingImage.naturalHeight,
        gridConfig
      )
    : { cols: 0, rows: 0 };

  // Sample colors whenever working image or grid config changes
  const sampledColors = useMemo((): (PixelColor | null)[][] | null => {
    if (!workingImage) {
      return null;
    }

    // Create a temporary canvas for sampling
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const { naturalWidth, naturalHeight } = workingImage;
    canvas.width = naturalWidth;
    canvas.height = naturalHeight;
    ctx.drawImage(workingImage, 0, 0);

    const imageData = ctx.getImageData(0, 0, naturalWidth, naturalHeight);
    return sampleGrid(imageData, gridConfig);
  }, [workingImage, gridConfig]);

  // Count originally transparent pixels (alpha = 0)
  const originallyTransparentCount = (() => {
    if (!sampledColors) return 0;
    let count = 0;
    for (let row = 0; row < sampledColors.length; row++) {
      for (let col = 0; col < sampledColors[row].length; col++) {
        const color = sampledColors[row][col];
        if (color === null || color.a === 0) {
          count++;
        }
      }
    }
    return count;
  })();

  // Total transparent = user-toggled + originally transparent (excluding overlap)
  const totalTransparentCount = (() => {
    if (!sampledColors) return ignoredPixels.size;
    let count = originallyTransparentCount;
    // Add user-toggled pixels that aren't originally transparent
    for (const key of ignoredPixels) {
      const [col, row] = key.split("-").map(Number);
      const color = sampledColors[row]?.[col];
      // Only count if not already originally transparent
      if (color !== null && color !== undefined && color.a !== 0) {
        count++;
      }
    }
    return count;
  })();

  // Calculate ignored pixels within the output frame
  const ignoredInFrame = (() => {
    if (!outputFrame) return ignoredPixels.size;
    let count = 0;
    for (const key of ignoredPixels) {
      const [col, row] = key.split("-").map(Number);
      if (
        col >= outputFrame.startCol &&
        col <= outputFrame.endCol &&
        row >= outputFrame.startRow &&
        row <= outputFrame.endRow
      ) {
        count++;
      }
    }
    return count;
  })();

  // Handlers
  const handleGridConfigChange = useCallback((partial: Partial<GridConfig>) => {
    setGridConfig((prev) => {
      const newConfig = { ...prev, ...partial };
      if (partial.gridSize !== undefined) {
        newConfig.offsetX = Math.min(prev.offsetX, partial.gridSize - 1);
        newConfig.offsetY = Math.min(prev.offsetY, partial.gridSize - 1);
      }
      return newConfig;
    });
    // Clear output frame when grid changes
    setOutputFrame(null);
  }, []);

  const handleTogglePixel = useCallback((key: string) => {
    setIgnoredPixels((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  }, []);

  const handleImageLoad = useCallback(
    (file: File) => {
      // Reset all state on new image
      setCropRegion(null);
      setCroppedImage(null);
      setGridConfig({
        gridSize: DEFAULT_GRID_SIZE,
        offsetX: 0,
        offsetY: 0,
      });
      setIgnoredPixels(new Set());
      setOutputFrame(null);
      setShowGridPreview(false);
      setCompletedSteps(new Set());
      // Stay on upload step - user will click Continue
      loadImage(file);
    },
    [loadImage]
  );

  const handleResetCrop = useCallback(() => {
    setCropRegion(null);
  }, []);

  const handleCropChange = useCallback((crop: CropRegion | null) => {
    setCropRegion(crop);
  }, []);

  const handleClearIgnored = useCallback(() => {
    setIgnoredPixels(new Set());
  }, []);

  const handleResetOutputFrame = useCallback(() => {
    setOutputFrame(null);
  }, []);

  const handleAutoFitFrame = useCallback(() => {
    if (!workingImage) return;

    const canvas = workCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { naturalWidth, naturalHeight } = workingImage;
    canvas.width = naturalWidth;
    canvas.height = naturalHeight;
    ctx.drawImage(workingImage, 0, 0);

    const imageData = ctx.getImageData(0, 0, naturalWidth, naturalHeight);
    const colors = sampleGrid(imageData, gridConfig);

    const frame = getMinimalBoundingFrame(
      gridDimensions.cols,
      gridDimensions.rows,
      ignoredPixels,
      colors
    );
    setOutputFrame(frame);
  }, [
    workingImage,
    gridConfig,
    gridDimensions.cols,
    gridDimensions.rows,
    ignoredPixels,
  ]);

  // Apply crop and move to grid step
  const applyCropAndContinue = useCallback(() => {
    if (!originalImage) return;

    if (cropRegion) {
      const canvas = workCanvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Set canvas to crop size
      canvas.width = cropRegion.width;
      canvas.height = cropRegion.height;

      // Draw cropped region
      ctx.drawImage(
        originalImage,
        cropRegion.x,
        cropRegion.y,
        cropRegion.width,
        cropRegion.height,
        0,
        0,
        cropRegion.width,
        cropRegion.height
      );

      // Create new image from cropped canvas
      const croppedDataUrl = canvas.toDataURL();
      const img = new Image();
      img.onload = () => {
        setCroppedImage(img);
        setCompletedSteps((prev) => new Set([...prev, "crop"]));
        setCurrentStep("grid");
      };
      img.src = croppedDataUrl;
    } else {
      // No crop, just proceed
      setCompletedSteps((prev) => new Set([...prev, "crop"]));
      setCurrentStep("grid");
    }
  }, [originalImage, cropRegion]);

  const handleExportSvg = useCallback(() => {
    if (!workingImage) return;

    const canvas = workCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { naturalWidth, naturalHeight } = workingImage;
    canvas.width = naturalWidth;
    canvas.height = naturalHeight;
    ctx.drawImage(workingImage, 0, 0);

    const imageData = ctx.getImageData(0, 0, naturalWidth, naturalHeight);
    const colors = sampleGrid(imageData, gridConfig);

    const svg = generateSvg(
      colors,
      gridConfig,
      naturalWidth,
      naturalHeight,
      ignoredPixels,
      outputFrame
    );
    downloadSvg(svg, "pixvix-export.svg");
  }, [workingImage, gridConfig, ignoredPixels, outputFrame]);

  const handleExportPng = useCallback(
    (width: number, height: number) => {
      if (!sampledColors) return;

      downloadPng(
        sampledColors,
        ignoredPixels,
        "pixvix-export.png",
        outputFrame,
        width,
        height
      );
    },
    [sampledColors, ignoredPixels, outputFrame]
  );

  // Step navigation
  const handleStepClick = useCallback((step: WorkflowStep) => {
    setCurrentStep(step);
  }, []);

  const goToStep = useCallback(
    (step: WorkflowStep, markCompleted?: WorkflowStep) => {
      if (markCompleted) {
        setCompletedSteps((prev) => new Set([...prev, markCompleted]));
      }
      setCurrentStep(step);
    },
    []
  );

  // Render sidebar based on current step
  const renderSidebar = () => {
    switch (currentStep) {
      case "upload":
        return (
          <UploadSidebar
            onImageLoad={handleImageLoad}
            isLoading={isLoading}
            error={error}
            dimensions={dimensions}
            hasImage={originalImage !== null}
            onNext={() => goToStep("crop", "upload")}
          />
        );
      case "crop":
        return (
          <CropSidebar
            dimensions={dimensions}
            cropRegion={cropRegion}
            onResetCrop={handleResetCrop}
            onBack={() => goToStep("upload")}
            onNext={applyCropAndContinue}
          />
        );
      case "grid":
        return (
          <GridSidebar
            dimensions={workingDimensions}
            gridConfig={gridConfig}
            onGridConfigChange={handleGridConfigChange}
            gridDimensions={gridDimensions}
            showPreview={showGridPreview}
            onShowPreviewChange={setShowGridPreview}
            onBack={() => goToStep("crop")}
            onNext={() => goToStep("refine", "grid")}
          />
        );
      case "refine":
        return (
          <RefineSidebar
            gridDimensions={gridDimensions}
            ignoredCount={totalTransparentCount}
            outputFrame={outputFrame}
            onAutoFitFrame={handleAutoFitFrame}
            onClearIgnored={handleClearIgnored}
            onResetOutputFrame={handleResetOutputFrame}
            onBack={() => goToStep("grid")}
            onNext={() => goToStep("export", "refine")}
          />
        );
      case "export":
        return (
          <ExportSidebar
            gridDimensions={gridDimensions}
            outputFrame={outputFrame}
            ignoredCount={ignoredPixels.size}
            ignoredInFrame={ignoredInFrame}
            onExportSvg={handleExportSvg}
            onExportPng={handleExportPng}
            onBack={() => goToStep("refine")}
          />
        );
    }
  };

  // Determine which image to show based on step
  const canvasImage =
    currentStep === "upload" || currentStep === "crop"
      ? originalImage
      : workingImage;

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-background">
      {/* Hidden canvas for cropping and export */}
      <canvas ref={workCanvasRef} className="hidden" />

      {/* Step indicator */}
      <StepIndicator
        currentStep={currentStep}
        onStepClick={handleStepClick}
        completedSteps={completedSteps}
        disabled={!originalImage}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        {renderSidebar()}

        {/* Workspace Area */}
        <main className="flex-1 overflow-hidden">
          <PixelCanvas
            originalImage={canvasImage}
            gridConfig={gridConfig}
            ignoredPixels={ignoredPixels}
            onTogglePixel={handleTogglePixel}
            mode={currentStep}
            cropRegion={cropRegion}
            onCropChange={handleCropChange}
            outputFrame={outputFrame}
            sampledColors={sampledColors}
            showGridPreview={showGridPreview}
          />
        </main>
      </div>
    </div>
  );
}
