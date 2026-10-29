import type { UploadApiResponse, UploadApiOptions } from 'cloudinary';
import crypto from 'crypto';
import cloudinary, { isCloudinaryConfigured, configureCloudinary } from '../config/cloudinary.js';
import { FileUploadError } from '../utils/errors.js';

export interface UploadedAssetResult {
  publicId: string;
  secureUrl: string;
  format: string;
  bytes: number;
  resourceType: string;
  createdAt: string;
}

export interface ValidateFileOptions {
  allowedMimes?: string[];
  maxSizeBytes?: number;
  fieldName?: string;
}

/**
 * Resilient In-Memory Asset Cache for testing, CI, and environments without Cloudinary credentials.
 */
export const inMemoryAssetStore = new Map<
  string,
  { buffer: Buffer; mime: string; bytes: number; createdAt: string }
>();

/**
 * Inspects binary magic numbers (file header signatures) directly from the Buffer
 * to prevent MIME spoofing, disguised binaries, or corrupted uploads.
 */
export function detectMimeFromBuffer(buffer: Buffer): string | null {
  if (!buffer || buffer.length < 4) return null;

  // 1. JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }

  // 2. PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'image/png';
  }

  // 3. WebP: RIFF (bytes 0..3) ... WEBP (bytes 8..11)
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 && // R
    buffer[1] === 0x49 && // I
    buffer[2] === 0x46 && // F
    buffer[3] === 0x46 && // F
    buffer[8] === 0x57 && // W
    buffer[9] === 0x45 && // E
    buffer[10] === 0x42 && // B
    buffer[11] === 0x50 // P
  ) {
    return 'image/webp';
  }

  // 4. PDF: %PDF- (25 50 44 46 2D)
  if (
    buffer.length >= 5 &&
    buffer[0] === 0x25 && // %
    buffer[1] === 0x50 && // P
    buffer[2] === 0x44 && // D
    buffer[3] === 0x46 && // F
    buffer[4] === 0x2d // -
  ) {
    return 'application/pdf';
  }

  return null;
}

/**
 * Validates file buffer size and authentic magic bytes.
 */
export function validateFileBuffer(
  buffer: Buffer,
  originalName: string,
  declaredMimeType: string,
  options: ValidateFileOptions = {}
): string {
  const fieldName = options.fieldName || 'file';
  const maxSize = options.maxSizeBytes || 5 * 1024 * 1024; // 5 MB default
  const allowedMimes = options.allowedMimes || [
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
  ];

  if (!buffer || buffer.length === 0) {
    throw new FileUploadError('The uploaded file is empty.', 'EMPTY_FILE', fieldName);
  }

  if (buffer.length > maxSize) {
    throw new FileUploadError(
      `File exceeds the ${Math.round(maxSize / (1024 * 1024))} MB size limit.`,
      'FILE_TOO_LARGE',
      fieldName
    );
  }

  const detectedMime = detectMimeFromBuffer(buffer);
  if (!detectedMime) {
    throw new FileUploadError(
      'Unrecognized or corrupted file format. Only JPEG, PNG, WebP, and PDF documents are supported.',
      'INVALID_FILE_SIGNATURE',
      fieldName
    );
  }

  if (!allowedMimes.includes(detectedMime)) {
    throw new FileUploadError(
      `Unsupported file type (${detectedMime}). Allowed formats: ${allowedMimes.join(', ')}.`,
      'UNSUPPORTED_FILE_TYPE',
      fieldName
    );
  }

  return detectedMime;
}

/**
 * Uploads a memory buffer directly to Cloudinary without writing to local disk.
 * Falls back safely to resilient in-memory asset caching if Cloudinary credentials
 * are not present in the current runtime environment (e.g. CI runners or local dev).
 */
export async function uploadToCloudinary(
  buffer: Buffer,
  options: {
    folder: string;
    publicId?: string;
    resourceType?: 'image' | 'raw' | 'auto';
    tags?: string[];
  }
): Promise<UploadedAssetResult> {
  const detectedMime = detectMimeFromBuffer(buffer);
  const isPdf = detectedMime === 'application/pdf';
  const format: string = isPdf ? 'pdf' : (detectedMime?.split('/')[1] || 'jpg');
  const safeId = options.publicId || `${Date.now()}-${crypto.randomUUID()}`;
  const fullPublicId = `${options.folder}/${safeId}`;

  // 1. Live Cloudinary upload if configured
  if (isCloudinaryConfigured()) {
    configureCloudinary();
    const uploadOptions: UploadApiOptions = {
      folder: options.folder,
      resource_type: options.resourceType || 'auto',
      tags: options.tags || ['agrimarket'],
      overwrite: true,
    };

    if (options.publicId) {
      uploadOptions.public_id = options.publicId;
    }

    return new Promise((resolve) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error?: any, result?: UploadApiResponse) => {
          if (error || !result) {
            console.warn('[Cloudinary Warning] Upload failed, falling back to memory buffer:', error?.message);
            inMemoryAssetStore.set(fullPublicId, {
              buffer,
              mime: detectedMime || 'application/octet-stream',
              bytes: buffer.length,
              createdAt: new Date().toISOString(),
            });
            return resolve({
              publicId: fullPublicId,
              secureUrl: `/api/onboarding/documents/${safeId}.${format}`,
              format,
              bytes: buffer.length,
              resourceType: options.resourceType || (isPdf ? 'raw' : 'image'),
              createdAt: new Date().toISOString(),
            });
          }

          resolve({
            publicId: result.public_id,
            secureUrl: result.secure_url,
            format: result.format || result.resource_type,
            bytes: result.bytes,
            resourceType: result.resource_type,
            createdAt: result.created_at,
          });
        }
      );

      uploadStream.end(buffer);
    });
  }

  // 2. Resilient In-Memory Buffer Fallback (for CI, test, or environments without live cloud credentials)
  inMemoryAssetStore.set(fullPublicId, {
    buffer,
    mime: detectedMime || 'application/octet-stream',
    bytes: buffer.length,
    createdAt: new Date().toISOString(),
  });

  return {
    publicId: fullPublicId,
    secureUrl: `/api/onboarding/documents/${safeId}.${format}`,
    format,
    bytes: buffer.length,
    resourceType: options.resourceType || (isPdf ? 'raw' : 'image'),
    createdAt: new Date().toISOString(),
  };
}

/**
 * Safely deletes an asset from Cloudinary or in-memory cache by its publicId.
 */
export async function deleteFromCloudinary(
  publicId: string,
  resourceType: 'image' | 'raw' | 'video' = 'image'
): Promise<{ success: boolean; result: string }> {
  if (!publicId) {
    return { success: false, result: 'empty_id' };
  }

  if (inMemoryAssetStore.has(publicId)) {
    inMemoryAssetStore.delete(publicId);
    return { success: true, result: 'ok' };
  }

  if (!isCloudinaryConfigured()) {
    return { success: true, result: 'ok' };
  }

  try {
    configureCloudinary();
    return await new Promise<{ success: boolean; result: string }>((resolve) => {
      cloudinary.uploader.destroy(
        publicId,
        {
          resource_type: resourceType,
          invalidate: true,
        },
        (error: any, res: any) => {
          if (error) {
            console.warn(`[Cloudinary Warning] Failed to delete asset ${publicId}:`, error?.message || error);
            resolve({ success: false, result: error?.message || 'error' });
          } else {
            const isSuccess = res?.result === 'ok' || res?.result === 'not found';
            resolve({
              success: isSuccess,
              result: res?.result || 'ok',
            });
          }
        }
      );
    });
  } catch (err: any) {
    console.warn(`[Cloudinary Warning] Failed to delete asset ${publicId}:`, err?.message || err);
    return { success: false, result: err?.message || 'error' };
  }
}

/**
 * Replaces an existing asset:
 * 1. Uploads the new asset to Cloudinary or memory first.
 * 2. If successful and oldPublicId was provided, safely deletes the old asset.
 */
export async function replaceCloudinaryAsset(
  oldPublicId: string | null | undefined,
  newBuffer: Buffer,
  options: {
    folder: string;
    publicId?: string;
    resourceType?: 'image' | 'raw' | 'auto';
    tags?: string[];
  }
): Promise<UploadedAssetResult> {
  // 1. Upload new asset
  const uploaded = await uploadToCloudinary(newBuffer, options);

  // 2. Best-effort deletion of previous asset after new upload succeeded
  if (oldPublicId && oldPublicId !== uploaded.publicId) {
    deleteFromCloudinary(oldPublicId, (options.resourceType as any) || 'image').catch((err) => {
      console.warn(`[Cloudinary Warning] Background deletion of old asset ${oldPublicId} failed:`, err?.message);
    });
  }

  return uploaded;
}

/**
 * Generates a signed, time-limited private delivery URL for sensitive verification documents.
 */
export function generateSignedDeliveryUrl(
  publicId: string,
  options: {
    format?: string;
    resourceType?: 'image' | 'raw';
    expiresInSeconds?: number;
  } = {}
): string {
  if (!isCloudinaryConfigured()) {
    const filename = publicId.split('/').pop() || publicId;
    return `/api/onboarding/documents/${filename}`;
  }

  const expiresInSeconds = options.expiresInSeconds || 3600; // 1 hour
  const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;

  return cloudinary.utils.private_download_url(publicId, options.format || 'jpg', {
    resource_type: options.resourceType || 'image',
    type: 'upload',
    expires_at: expiresAt,
  });
}

