import {
  Sparkles,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  MousePointer,
  Crop,
} from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Separator } from "./ui/separator";
import type { OutputFrame } from "../types";

interface RefineSidebarProps {
  gridDimensions: { cols: number; rows: number };
  ignoredCount: number;
  outputFrame: OutputFrame | null;
  onAutoFitFrame: () => void;
  onClearIgnored: () => void;
  onResetOutputFrame: () => void;
  onBack: () => void;
  onNext: () => void;
}

export function RefineSidebar({
  gridDimensions,
  ignoredCount,
  outputFrame,
  onAutoFitFrame,
  onClearIgnored,
  onResetOutputFrame,
  onBack,
  onNext,
}: RefineSidebarProps) {
  // Calculate output dimensions
  const outputCols = outputFrame
    ? outputFrame.endCol - outputFrame.startCol + 1
    : gridDimensions.cols;
  const outputRows = outputFrame
    ? outputFrame.endRow - outputFrame.startRow + 1
    : gridDimensions.rows;

  return (
    <aside className="w-72 h-full bg-card border-r border-border p-4 flex flex-col gap-4 overflow-y-auto">
      {/* Info Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Sparkles className="h-4 w-4" />
            Pixel Art Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Full grid:</span>
            <span>
              {gridDimensions.cols} × {gridDimensions.rows} px
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Export size:</span>
            <span className={outputFrame ? "text-yellow-500 font-medium" : ""}>
              {outputCols} × {outputRows} px
            </span>
          </div>
          {(outputFrame || ignoredCount > 0) && (
            <p className="text-xs text-muted-foreground italic">
              {outputFrame && "Output frame is active. "}
              {ignoredCount > 0 &&
                `${ignoredCount} pixel${
                  ignoredCount !== 1 ? "s" : ""
                } transparent.`}
            </p>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Pixel Selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <MousePointer className="h-4 w-4" />
            Transparent Pixels
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Click or drag on pixels to toggle them as transparent. Transparent
            pixels won't be drawn in the exported SVG.
          </p>

          {ignoredCount > 0 ? (
            <>
              <p className="text-sm font-medium">
                {ignoredCount} pixel{ignoredCount !== 1 ? "s" : ""} set
                transparent
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={onClearIgnored}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Restore All Pixels
              </Button>
            </>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              No pixels set as transparent
            </p>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Output Frame */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Crop className="h-4 w-4" />
            Output Frame
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Automatically crop the export area to exclude border transparent
            pixels.
          </p>

          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={onAutoFitFrame}
          >
            <Crop className="h-4 w-4 mr-2" />
            Auto-fit to Content
          </Button>

          {outputFrame && (
            <>
              <div className="text-sm bg-muted/50 rounded p-2 space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Region:</span>
                  <span>
                    ({outputFrame.startCol}, {outputFrame.startRow}) → (
                    {outputFrame.endCol}, {outputFrame.endRow})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Size:</span>
                  <span>
                    {outputCols} × {outputRows} px
                  </span>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={onResetOutputFrame}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset to Full Grid
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Navigation */}
      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={onBack}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <Button className="flex-1" onClick={onNext}>
          Preview
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </aside>
  );
}
