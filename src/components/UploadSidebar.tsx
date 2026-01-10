import { useRef } from "react";
import {
  Upload,
  ImageIcon,
  Loader2,
  FileImage,
  Sparkles,
  Info,
} from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import type { Dimensions } from "../types";

interface UploadSidebarProps {
  onImageLoad: (file: File) => void;
  isLoading: boolean;
  error: string | null;
  dimensions: Dimensions;
  hasImage: boolean;
  onNext: () => void;
}

export function UploadSidebar({
  onImageLoad,
  isLoading,
  error,
  dimensions,
  hasImage,
  onNext,
}: UploadSidebarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImageLoad(file);
    }
    // Reset input value so the same file can be selected again after reset
    e.target.value = "";
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      onImageLoad(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <aside className="w-72 h-full bg-card border-r border-border p-4 flex flex-col gap-4 overflow-y-auto">
      {/* Welcome Section */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Welcome to Pixvix
        </h2>
        <p className="text-sm text-muted-foreground">
          Convert pixel art images to scalable SVG or PNG format. Upload an
          image to get started.
        </p>
      </div>

      {/* Upload Area */}
      <Card
        className="border-dashed border-2 hover:border-primary/50 transition-colors cursor-pointer"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={handleButtonClick}
      >
        <CardContent className="pt-6 pb-6 flex flex-col items-center gap-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            {isLoading ? (
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            ) : (
              <Upload className="h-8 w-8 text-primary" />
            )}
          </div>

          <div className="text-center space-y-1">
            <p className="text-sm font-medium">
              {isLoading ? "Loading..." : "Drop image here"}
            </p>
            <p className="text-xs text-muted-foreground">
              or click to browse files
            </p>
          </div>

          <Button variant="outline" size="sm" disabled={isLoading}>
            <ImageIcon className="h-4 w-4 mr-2" />
            Choose File
          </Button>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <p className="text-sm text-destructive bg-destructive/10 p-2 rounded">
          {error}
        </p>
      )}

      {/* Image Info (when loaded) */}
      {hasImage && (
        <Card>
          <CardContent className="pt-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <FileImage className="h-4 w-4" />
              Image Loaded
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              <span className="text-muted-foreground">Width:</span>
              <span className="font-mono text-right">{dimensions.width}px</span>
              <span className="text-muted-foreground">Height:</span>
              <span className="font-mono text-right">
                {dimensions.height}px
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tips Section */}
      <div className="flex gap-2 text-xs text-muted-foreground px-1">
        <Info className="h-4 w-4 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p>Works best with pixel art or low-res images.</p>
          <p>Supports PNG, JPG, GIF, and WebP formats.</p>
          <p>Transparent pixels are preserved in export.</p>
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Navigation */}
      <Button className="w-full" disabled={!hasImage} onClick={onNext}>
        Continue to Crop
      </Button>
    </aside>
  );
}
