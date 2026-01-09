import { useState, useCallback, useEffect } from "react";
import {
  Download,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  Image,
  FileCode,
  Grid3X3,
  Info,
} from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Label } from "./ui/label";
import type { OutputFrame } from "../types";

interface ExportSidebarProps {
  gridDimensions: { cols: number; rows: number };
  outputFrame: OutputFrame | null;
  ignoredCount: number;
  ignoredInFrame: number;
  onExportSvg: () => void;
  onExportPng: (width: number, height: number) => void;
  onBack: () => void;
}

export function ExportSidebar({
  gridDimensions,
  outputFrame,
  ignoredCount,
  ignoredInFrame,
  onExportSvg,
  onExportPng,
  onBack,
}: ExportSidebarProps) {
  // Calculate final output dimensions
  const outputCols = outputFrame
    ? outputFrame.endCol - outputFrame.startCol + 1
    : gridDimensions.cols;
  const outputRows = outputFrame
    ? outputFrame.endRow - outputFrame.startRow + 1
    : gridDimensions.rows;

  const totalPixels = outputCols * outputRows;
  const transparentInOutput = outputFrame ? ignoredInFrame : ignoredCount;
  const visiblePixels = totalPixels - transparentInOutput;

  // PNG export panel state
  const [showPngOptions, setShowPngOptions] = useState(false);

  // PNG export dimensions state
  const aspectRatio = outputCols / outputRows;
  const defaultPngWidth = Math.max(outputCols * 10, 100);
  const [pngWidth, setPngWidth] = useState(defaultPngWidth);
  const [pngHeight, setPngHeight] = useState(
    Math.round(defaultPngWidth / aspectRatio)
  );

  // Update dimensions when output dimensions change
  useEffect(() => {
    const newWidth = Math.max(outputCols * 10, 100);
    setPngWidth(newWidth);
    setPngHeight(Math.round(newWidth / aspectRatio));
  }, [outputCols, outputRows, aspectRatio]);

  // Handle width change - maintain aspect ratio
  const handleWidthChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newWidth = parseInt(e.target.value, 10) || 1;
      setPngWidth(newWidth);
      setPngHeight(Math.round(newWidth / aspectRatio));
    },
    [aspectRatio]
  );

  // Handle height change - maintain aspect ratio
  const handleHeightChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newHeight = parseInt(e.target.value, 10) || 1;
      setPngHeight(newHeight);
      setPngWidth(Math.round(newHeight * aspectRatio));
    },
    [aspectRatio]
  );

  // Handle PNG export
  const handlePngExport = useCallback(() => {
    onExportPng(pngWidth, pngHeight);
  }, [onExportPng, pngWidth, pngHeight]);

  // Toggle PNG options panel
  const togglePngOptions = useCallback(() => {
    setShowPngOptions((prev) => !prev);
  }, []);

  // Calculate current scale
  const currentScale = pngWidth / outputCols;

  return (
    <aside className="w-72 h-full bg-card border-r border-border p-4 flex flex-col gap-4 overflow-y-auto">
      {/* Output Summary */}
      <Card>
        <CardContent className="pt-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Grid3X3 className="h-4 w-4" />
            Output Summary
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <span className="text-muted-foreground">Dimensions:</span>
            <span className="font-mono text-right">
              {outputCols} × {outputRows}
            </span>

            <span className="text-muted-foreground">Visible pixels:</span>
            <span className="font-mono text-right text-green-500">
              {visiblePixels}
            </span>

            {transparentInOutput > 0 && (
              <>
                <span className="text-muted-foreground">Transparent:</span>
                <span className="font-mono text-right text-yellow-500">
                  {transparentInOutput}
                </span>
              </>
            )}
          </div>

          {outputFrame && (
            <p className="text-xs text-amber-500 italic">
              Cropped by output frame
            </p>
          )}
        </CardContent>
      </Card>

      {/* Info hint */}
      <div className="flex gap-2 text-xs text-muted-foreground px-1">
        <Info className="h-4 w-4 shrink-0 mt-0.5" />
        <p>
          The yellow border on the canvas shows the area that will be exported.
        </p>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Export Section */}
      <div className="space-y-2">
        {/* PNG Options Panel (appears above buttons when expanded) */}
        {showPngOptions && (
          <Card className="border-primary/30 bg-primary/5 animate-in slide-in-from-bottom-2 duration-200">
            <CardContent className="pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">PNG Size</span>
                <span className="text-xs text-muted-foreground">
                  {currentScale.toFixed(1)}× scale
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="png-width" className="text-xs">
                    Width
                  </Label>
                  <input
                    id="png-width"
                    type="number"
                    min={1}
                    max={8192}
                    value={pngWidth}
                    onChange={handleWidthChange}
                    className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-sm font-mono shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="png-height" className="text-xs">
                    Height
                  </Label>
                  <input
                    id="png-height"
                    type="number"
                    min={1}
                    max={8192}
                    value={pngHeight}
                    onChange={handleHeightChange}
                    className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-sm font-mono shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Aspect ratio locked ({outputCols}:{outputRows})
              </p>

              <Button className="w-full" size="sm" onClick={handlePngExport}>
                <Download className="h-4 w-4 mr-2" />
                Export PNG
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Export Buttons */}
        <div className="flex gap-2">
          <Button className="flex-1" onClick={onExportSvg}>
            <FileCode className="h-4 w-4 mr-2" />
            SVG
          </Button>
          <Button
            className="flex-1"
            variant={showPngOptions ? "secondary" : "outline"}
            onClick={togglePngOptions}
          >
            <Image className="h-4 w-4 mr-2" />
            PNG
            {showPngOptions ? (
              <ChevronDown className="h-4 w-4 ml-1" />
            ) : (
              <ChevronUp className="h-4 w-4 ml-1" />
            )}
          </Button>
        </div>

        {/* Back Button */}
        <Button variant="outline" className="w-full" onClick={onBack}>
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to Refine
        </Button>
      </div>
    </aside>
  );
}
