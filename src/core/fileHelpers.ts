/**
 * Reads a File object and returns a DataURL string.
 * Used for loading images from file input.
 */
export function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Failed to read file as DataURL"));
      }
    };

    reader.onerror = () => {
      reject(new Error("Error reading file"));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Loads an HTMLImageElement from a DataURL string.
 * Waits for the image to fully load before resolving.
 */
export function loadImageFromDataURL(
  dataURL: string
): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      resolve(img);
    };

    img.onerror = () => {
      reject(new Error("Failed to load image"));
    };

    img.src = dataURL;
  });
}

/**
 * Validates that a file is an image type.
 */
export function isValidImageFile(file: File): boolean {
  return file.type.startsWith("image/");
}
