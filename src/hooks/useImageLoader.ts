import { useState, useCallback } from "react";
import {
  readFileAsDataURL,
  loadImageFromDataURL,
  isValidImageFile,
} from "../core/fileHelpers";
import type { Dimensions } from "../types";

interface UseImageLoaderReturn {
  originalImage: HTMLImageElement | null;
  dimensions: Dimensions;
  isLoading: boolean;
  error: string | null;
  loadImage: (file: File) => Promise<void>;
  clearImage: () => void;
}

export function useImageLoader(): UseImageLoaderReturn {
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(
    null
  );
  const [dimensions, setDimensions] = useState<Dimensions>({
    width: 0,
    height: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadImage = useCallback(async (file: File) => {
    // Validate file type
    if (!isValidImageFile(file)) {
      setError("Please select a valid image file");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const dataURL = await readFileAsDataURL(file);
      const img = await loadImageFromDataURL(dataURL);

      setOriginalImage(img);
      setDimensions({ width: img.naturalWidth, height: img.naturalHeight });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load image");
      setOriginalImage(null);
      setDimensions({ width: 0, height: 0 });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearImage = useCallback(() => {
    setOriginalImage(null);
    setDimensions({ width: 0, height: 0 });
    setError(null);
  }, []);

  return {
    originalImage,
    dimensions,
    isLoading,
    error,
    loadImage,
    clearImage,
  };
}
