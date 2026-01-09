import {
  Grid3X3,
  ChevronLeft,
  ChevronRight,
  Info,
  Eye,
  Sliders,
} from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Separator } from "./ui/separator";
import { Slider } from "./ui/slider";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import type { Dimensions, GridConfig } from "../types";

interface GridSidebarProps {
  dimensions: Dimensions;
  gridConfig: GridConfig;
  onGridConfigChange: (config: Partial<GridConfig>) => void;
  gridDimensions: { cols: number; rows: number };
  showPreview: boolean;
  onShowPreviewChange: (show: boolean) => void;
  onBack: () => void;
  onNext: () => void;
}

export function GridSidebar({
  dimensions,
  gridConfig,
  onGridConfigChange,
  gridDimensions,
  showPreview,
  onShowPreviewChange,
  onBack,
  onNext,
}: GridSidebarProps) {
  // Max grid size is half the smallest dimension (min 1)
  const maxGridSize = Math.max(
    1,
    Math.floor(Math.min(dimensions.width, dimensions.height) / 8)
  );

  return (
    <aside className="w-72 h-full bg-card border-r border-border p-4 flex flex-col gap-4 overflow-y-auto">
      {/* Intro Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Grid3X3 className="h-4 w-4" />
            Configure Sampling Grid
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Set the grid size to match your pixel art. Each grid cell becomes
            one pixel in the output.
          </p>

          {/* Dimensions Summary */}
          <div className="bg-muted/50 rounded-lg p-3 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Input area:</span>
              <span className="font-mono">
                {dimensions.width} × {dimensions.height}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Output size:</span>
              <span className="font-mono text-primary font-medium">
                {gridDimensions.cols} × {gridDimensions.rows} px
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid Configuration */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Sliders className="h-4 w-4" />
            Grid Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Grid Size */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="gridSize">Grid Size</Label>
              <span className="text-sm font-mono text-muted-foreground">
                {gridConfig.gridSize}px
              </span>
            </div>
            <Slider
              id="gridSize"
              min={1}
              max={maxGridSize}
              step={1}
              value={[gridConfig.gridSize]}
              onValueChange={([value]) =>
                onGridConfigChange({ gridSize: value })
              }
            />
            <p className="text-xs text-muted-foreground">
              Size of each grid cell in source pixels
            </p>
          </div>

          <Separator />

          {/* Offset X */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="offsetX">Horizontal Offset</Label>
              <span className="text-sm font-mono text-muted-foreground">
                {gridConfig.offsetX}px
              </span>
            </div>
            <Slider
              id="offsetX"
              min={0}
              max={gridConfig.gridSize - 1}
              step={1}
              value={[gridConfig.offsetX]}
              onValueChange={([value]) =>
                onGridConfigChange({ offsetX: value })
              }
            />
          </div>

          {/* Offset Y */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="offsetY">Vertical Offset</Label>
              <span className="text-sm font-mono text-muted-foreground">
                {gridConfig.offsetY}px
              </span>
            </div>
            <Slider
              id="offsetY"
              min={0}
              max={gridConfig.gridSize - 1}
              step={1}
              value={[gridConfig.offsetY]}
              onValueChange={([value]) =>
                onGridConfigChange({ offsetY: value })
              }
            />
            <p className="text-xs text-muted-foreground">
              Shift the grid to align with your artwork
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Preview Toggle */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="preview" className="font-medium">
                Preview Result
              </Label>
            </div>
            <Switch
              id="preview"
              checked={showPreview}
              onCheckedChange={onShowPreviewChange}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Show how the sampled pixels will look
          </p>
        </CardContent>
      </Card>

      {/* Help hint */}
      <div className="flex gap-2 text-xs text-muted-foreground px-1">
        <Info className="h-4 w-4 shrink-0 mt-0.5" />
        <p>
          Adjust grid size until the cyan lines align with the pixel boundaries
          of your artwork.
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
          Continue
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </aside>
  );
}
