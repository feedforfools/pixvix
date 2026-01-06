import { Grid3X3, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Separator } from "./ui/separator";
import { Slider } from "./ui/slider";
import { Label } from "./ui/label";
import type { Dimensions, GridConfig } from "../types";

interface GridSidebarProps {
  dimensions: Dimensions;
  gridConfig: GridConfig;
  onGridConfigChange: (config: Partial<GridConfig>) => void;
  gridDimensions: { cols: number; rows: number };
  onBack: () => void;
  onNext: () => void;
}

export function GridSidebar({
  dimensions,
  gridConfig,
  onGridConfigChange,
  gridDimensions,
  onBack,
  onNext,
}: GridSidebarProps) {
  return (
    <aside className="w-72 h-full bg-card border-r border-border p-4 flex flex-col gap-4 overflow-y-auto">
      {/* Info Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Grid3X3 className="h-4 w-4" />
            Grid Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Working area: {dimensions.width} × {dimensions.height} px
          </p>
          <p className="text-sm text-muted-foreground">
            Output: {gridDimensions.cols} × {gridDimensions.rows} pixels
          </p>
        </CardContent>
      </Card>

      <Separator />

      {/* Grid Configuration */}
      <Card>
        <CardContent className="space-y-5 pt-4">
          {/* Grid Size */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="gridSize">Grid Size</Label>
              <span className="text-sm text-muted-foreground">
                {gridConfig.gridSize}px
              </span>
            </div>
            <Slider
              id="gridSize"
              min={1}
              max={100}
              step={1}
              value={[gridConfig.gridSize]}
              onValueChange={([value]) =>
                onGridConfigChange({ gridSize: value })
              }
            />
          </div>

          {/* Offset X */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="offsetX">Offset X</Label>
              <span className="text-sm text-muted-foreground">
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
              <Label htmlFor="offsetY">Offset Y</Label>
              <span className="text-sm text-muted-foreground">
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
          </div>
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
          Next
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </aside>
  );
}
