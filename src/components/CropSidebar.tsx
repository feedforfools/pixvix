import { useRef } from "react";
import { Upload, Crop, Loader2, RotateCcw, ChevronRight } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Separator } from "./ui/separator";
import type { Dimensions, CropRegion } from "../types";

interface CropSidebarProps {
  onImageLoad: (file: File) => void;
  isLoading: boolean;
  error: string | null;
  dimensions: Dimensions;
  hasImage: boolean;
  cropRegion: CropRegion | null;
  onResetCrop: () => void;
  onNext: () => void;
}

export function CropSidebar({
  onImageLoad,
  isLoading,
  error,
  dimensions,
  hasImage,
  cropRegion,
  onResetCrop,
  onNext,
}: CropSidebarProps) {
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

  const hasCrop = cropRegion !== null;
  const cropDimensions = cropRegion
    ? { width: cropRegion.width, height: cropRegion.height }
    : dimensions;

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
              Original: {dimensions.width} × {dimensions.height} px
            </p>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Crop Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Crop className="h-4 w-4" />
            Crop Region
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {hasImage
              ? "Click and drag on the image to select a crop region, or skip to use the full image."
              : "Upload an image first"}
          </p>

          {hasCrop && (
            <>
              <p className="text-sm">
                Cropped: {cropDimensions.width} × {cropDimensions.height} px
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
            </>
          )}
        </CardContent>
      </Card>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Navigation */}
      <Button className="w-full" disabled={!hasImage} onClick={onNext}>
        {hasCrop ? "Apply Crop & Continue" : "Skip Crop"}
        <ChevronRight className="h-4 w-4 ml-2" />
      </Button>
    </aside>
  );
}
