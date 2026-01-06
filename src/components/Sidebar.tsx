import { useRef } from "react";
import { Upload, Grid3X3, Download, Loader2, RotateCcw } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Separator } from "./ui/separator";
import { Slider } from "./ui/slider";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import type { Dimensions, GridConfig } from "../types";

interface SidebarProps {
  onImageLoad: (file: File) => void;
  isLoading: boolean;
  error: string | null;
  dimensions: Dimensions;
  hasImage: boolean;
  gridConfig: GridConfig;
  onGridConfigChange: (config: Partial<GridConfig>) => void;
  showPreview: boolean;
  onShowPreviewChange: (show: boolean) => void;
  onExport: () => void;
  onReset: () => void;
  ignoredCount: number;
}

export function Sidebar({
  onImageLoad,
  isLoading,
  error,
  dimensions,
  hasImage,
  gridConfig,
  onGridConfigChange,
  showPreview,
  onShowPreviewChange,
  onExport,
  onReset,
  ignoredCount,
}: SidebarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImageLoad(file);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <aside className="w-72 h-full bg-card border-r border-border p-4 flex flex-col gap-4 overflow-y-auto">
      {/* Upload Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Upload className="h-4 w-4" />
            Upload Image
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <Button
            variant="outline"
            className="w-full"
            onClick={handleButtonClick}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              "Choose File"
            )}
          </Button>

          {error && <p className="text-sm text-destructive">{error}</p>}

          {hasImage && (
            <p className="text-sm text-muted-foreground">
              {dimensions.width} × {dimensions.height} px
            </p>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Grid Settings Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Grid3X3 className="h-4 w-4" />
            Grid Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
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
              disabled={!hasImage}
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
              disabled={!hasImage}
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
              disabled={!hasImage}
            />
          </div>

          <Separator />

          {/* Show Preview Toggle */}
          <div className="flex items-center justify-between">
            <Label htmlFor="showPreview">Show Preview</Label>
            <Switch
              id="showPreview"
              checked={showPreview}
              onCheckedChange={onShowPreviewChange}
              disabled={!hasImage}
            />
          </div>

          {/* Ignored Pixels Info */}
          {ignoredCount > 0 && (
            <p className="text-sm text-muted-foreground">
              {ignoredCount} pixel{ignoredCount !== 1 ? "s" : ""} ignored
            </p>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Export Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Download className="h-4 w-4" />
            Export
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button className="w-full" disabled={!hasImage} onClick={onExport}>
            Download SVG
          </Button>
          <Button
            variant="outline"
            className="w-full"
            disabled={!hasImage}
            onClick={onReset}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </CardContent>
      </Card>
    </aside>
  );
}
