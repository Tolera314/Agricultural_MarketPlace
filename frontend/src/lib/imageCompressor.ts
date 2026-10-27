/**
 * Client-Side Image Compression Utility for AgriMarket.
 * Specially designed for rural / low-bandwidth mobile connections.
 * Resizes 8-15 MB camera photos of Kebele IDs, Fayda IDs, and land deeds
 * down to crisp, readable ~300KB-800KB images while preserving legal text legibility.
 * Passes PDFs through without modification.
 */

export interface CompressionResult {
  file: File;
  originalSizeBytes: number;
  compressedSizeBytes: number;
  savingsPercentage: number;
  isCompressed: boolean;
}

export async function compressDocumentImage(
  file: File,
  maxDimension: number = 1600,
  quality: number = 0.82
): Promise<CompressionResult> {
  const originalSize = file.size;

  // 1. Pass through PDFs untouched
  if (file.type === 'application/pdf') {
    return {
      file,
      originalSizeBytes: originalSize,
      compressedSizeBytes: originalSize,
      savingsPercentage: 0,
      isCompressed: false,
    };
  }

  // 2. Pass through if already very small (< 400 KB)
  if (originalSize <= 400 * 1024) {
    return {
      file,
      originalSizeBytes: originalSize,
      compressedSizeBytes: originalSize,
      savingsPercentage: 0,
      isCompressed: false,
    };
  }

  // 3. Process image via browser Canvas
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Proportional scale down if exceeds max dimension
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          // Fallback if canvas context fails
          return resolve({
            file,
            originalSizeBytes: originalSize,
            compressedSizeBytes: originalSize,
            savingsPercentage: 0,
            isCompressed: false,
          });
        }

        // Draw with high quality smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to standard JPEG or WebP blob
        const outputMime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        canvas.toBlob(
          (blob) => {
            if (!blob || blob.size >= originalSize) {
              // If compression didn't save space, use original
              return resolve({
                file,
                originalSizeBytes: originalSize,
                compressedSizeBytes: originalSize,
                savingsPercentage: 0,
                isCompressed: false,
              });
            }

            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), {
              type: outputMime,
              lastModified: Date.now(),
            });

            const savings = Math.round(((originalSize - blob.size) / originalSize) * 100);

            resolve({
              file: compressedFile,
              originalSizeBytes: originalSize,
              compressedSizeBytes: blob.size,
              savingsPercentage: savings,
              isCompressed: true,
            });
          },
          outputMime,
          quality
        );
      };

      img.onerror = () => {
        // Fallback on image decode error
        resolve({
          file,
          originalSizeBytes: originalSize,
          compressedSizeBytes: originalSize,
          savingsPercentage: 0,
          isCompressed: false,
        });
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      resolve({
        file,
        originalSizeBytes: originalSize,
        compressedSizeBytes: originalSize,
        savingsPercentage: 0,
        isCompressed: false,
      });
    };

    reader.readAsDataURL(file);
  });
}
