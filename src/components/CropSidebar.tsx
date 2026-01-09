import { Crop, RotateCcw, ChevronRight, ChevronLeft, Info } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import type { Dimensions, CropRegion } from "../types";

interface CropSidebarProps {
  dimensions: Dimensions;
  cropRegion: CropRegion | null;
  onResetCrop: () => void;
  onBack: () => void;
  onNext: () => void;
}

export function CropSidebar({
  dimensions,
  cropRegion,
  onResetCrop,
  onBack,
  onNext,
}: CropSidebarProps) {
  const hasCrop = cropRegion !== null;
  const cropDimensions = cropRegion
    ? { width: cropRegion.width, height: cropRegion.height }
    : dimensions;

  return (
    <aside className="w-72 h-full bg-card border-r border-border p-4 flex flex-col gap-4 overflow-y-auto">
      {/* Main Crop Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Crop className="h-4 w-4" />
            Crop Image
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Click and drag on the canvas to select a crop region, or skip to use
            the full image.
          </p>

          {/* Dimensions Info */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <span className="text-muted-foreground">Original:</span>
            <span className="font-mono text-right">
              {dimensions.width} × {dimensions.height}
            </span>
            {hasCrop && (
              <>
                <span className="text-muted-foreground">Cropped:</span>
                <span className="font-mono text-right text-primary">
                  {cropDimensions.width} × {cropDimensions.height}
                </span>
              </>
            )}
          </div>

          {/* Crop Status & Reset */}
          {hasCrop && (
            <div className="pt-2 border-t border-border space-y-3">
              <p className="text-sm text-green-500 font-medium">
                ✓ Crop region selected
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={onResetCrop}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset Crop
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Help hint */}
      <div className="flex gap-2 text-xs text-muted-foreground px-1">
        <Info className="h-4 w-4 shrink-0 mt-0.5" />
        <p>
          Hold <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Shift</kbd>{" "}
          and drag to pan. Use scroll wheel to zoom.
        </p>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Navigation */}
      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={onBack}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <Button className="flex-1" onClick={onNext}>
          {hasCrop ? "Apply Crop" : "Skip"}
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </aside>
  );
}
