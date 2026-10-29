/**
 * Comprehensive Automated Test Suite: Cloudinary File Handling & Cloud Storage
 *
 * Tests:
 * 1. Magic byte file signature detection (JPEG, PNG, WebP, PDF)
 * 2. Spoofed extension and disguised binary rejection
 * 3. Buffer validation (file size limits, empty buffers, disallowed MIME types)
 * 4. Cloudinary API authentication and live ping connectivity
 * 5. In-memory buffer streaming upload directly to Cloudinary (zero disk persistence)
 * 6. Cloudinary asset replacement (upload new asset, safe background deletion of old asset)
 * 7. Cloudinary asset deletion (uploader.destroy)
 * 8. Access control and authentication enforcement on upload and document endpoints
 */

import '../config/env.js';
import http from 'http';
import app from '../app.js';
import cloudinary, { isCloudinaryConfigured } from '../config/cloudinary.js';
import {
  detectMimeFromBuffer,
  validateFileBuffer,
  uploadToCloudinary,
  deleteFromCloudinary,
  replaceCloudinaryAsset,
} from '../services/cloudinary.service.js';
import { FileUploadError } from '../utils/errors.js';

let passed = 0;
let failed = 0;

function assert(condition: boolean, desc: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${desc}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${desc}`);
    failed++;
  }
}

// 1x1 transparent PNG buffer (authentic PNG signature)
const SAMPLE_PNG_BUFFER = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

// Minimal authentic JPEG buffer
const SAMPLE_JPEG_BUFFER = Buffer.from([
  0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
  0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43,
  0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
  0xff, 0xd9,
]);

// Minimal authentic PDF buffer
const SAMPLE_PDF_BUFFER = Buffer.from(
  '%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF'
);

// Disguised binary / executable pretending to be an image
const SPOOFED_EXE_BUFFER = Buffer.from([
  0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00, 0x04, 0x00, 0x00, 0x00,
]);

// Helper for testing HTTP requests
function makeRequest(
  server: http.Server,
  method: string,
  path: string,
  headers: Record<string, string> = {},
  body?: any
): Promise<{ status: number; data: any; headers: http.IncomingHttpHeaders }> {
  return new Promise((resolve, reject) => {
    const address = server.address() as any;
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: address.port,
        path,
        method,
        headers,
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          let data = raw;
          try {
            data = JSON.parse(raw);
          } catch {
            // raw string
          }
          resolve({ status: res.statusCode || 500, data, headers: res.headers });
        });
      }
    );
    req.on('error', reject);
    if (body) {
      if (typeof body === 'string') {
        req.write(body);
      } else {
        req.write(JSON.stringify(body));
      }
    }
    req.end();
  });
}

async function runCloudinaryTests() {
  console.log('\n🧪 Starting Production Cloudinary Integration & Security Test Suite...\n');

  // =========================================================================
  // 1. Binary Magic Bytes Detection
  // =========================================================================
  console.log('--- 1. Binary Magic Bytes File Signature Detection ---');

  const pngMime = detectMimeFromBuffer(SAMPLE_PNG_BUFFER);
  assert(pngMime === 'image/png', 'Detects authentic PNG header');

  const jpegMime = detectMimeFromBuffer(SAMPLE_JPEG_BUFFER);
  assert(jpegMime === 'image/jpeg', 'Detects authentic JPEG header');

  const pdfMime = detectMimeFromBuffer(SAMPLE_PDF_BUFFER);
  assert(pdfMime === 'application/pdf', 'Detects authentic PDF header');

  const spoofedMime = detectMimeFromBuffer(SPOOFED_EXE_BUFFER);
  assert(spoofedMime === null, 'Rejects disguised executable pretending to be an image');

  const emptyMime = detectMimeFromBuffer(Buffer.alloc(0));
  assert(emptyMime === null, 'Rejects empty buffer');

  // =========================================================================
  // 2. File Buffer Validation & Policy Enforcement
  // =========================================================================
  console.log('\n--- 2. File Buffer Validation & Policy Enforcement ---');

  // Valid PNG pass
  const validMime = validateFileBuffer(SAMPLE_PNG_BUFFER, 'kebele_id.png', 'image/png');
  assert(validMime === 'image/png', 'Accepts valid PNG buffer within size limits');

  // File too large rejection (> 5MB)
  let sizeRejected = false;
  try {
    const largeBuffer = Buffer.alloc(6 * 1024 * 1024); // 6 MB
    // Set first bytes to valid PNG
    SAMPLE_PNG_BUFFER.copy(largeBuffer, 0, 0, 8);
    validateFileBuffer(largeBuffer, 'large.png', 'image/png', { maxSizeBytes: 5 * 1024 * 1024 });
  } catch (err: any) {
    if (err instanceof FileUploadError && err.code === 'FILE_TOO_LARGE') {
      sizeRejected = true;
    }
  }
  assert(sizeRejected, 'Rejects files exceeding the 5 MB maximum size limit');

  // Spoofed file signature rejection
  let spoofRejected = false;
  try {
    validateFileBuffer(SPOOFED_EXE_BUFFER, 'virus.png', 'image/png');
  } catch (err: any) {
    if (err instanceof FileUploadError && err.code === 'INVALID_FILE_SIGNATURE') {
      spoofRejected = true;
    }
  }
  assert(spoofRejected, 'Rejects spoofed extension with invalid magic byte signature');

  // Disallowed MIME type rejection (e.g., PDF uploaded to image-only endpoint)
  let disallowedRejected = false;
  try {
    validateFileBuffer(SAMPLE_PDF_BUFFER, 'doc.pdf', 'application/pdf', {
      allowedMimes: ['image/jpeg', 'image/png', 'image/webp'],
    });
  } catch (err: any) {
    if (err instanceof FileUploadError && err.code === 'UNSUPPORTED_FILE_TYPE') {
      disallowedRejected = true;
    }
  }
  assert(disallowedRejected, 'Rejects disallowed MIME type on restricted upload paths');

  // =========================================================================
  // 3. Live Cloudinary Connectivity & In-Memory Streaming Uploads
  // =========================================================================
  console.log('\n--- 3. Live Cloudinary API & In-Memory Streaming Uploads ---');

  const isConfigured = isCloudinaryConfigured();
  let livePingSuccess = false;

  if (isConfigured) {
    try {
      const pingRes = await cloudinary.api.ping();
      livePingSuccess = pingRes.status === 'ok';
    } catch (err: any) {
      console.warn('  ⚠️ Cloudinary API ping returned error:', err?.message);
    }
  }

  if (isConfigured && livePingSuccess) {
    assert(isConfigured, 'Cloudinary credentials are validly loaded in process environment');
    assert(livePingSuccess, 'Cloudinary API ping connectivity confirmed (status: ok)');

    let testAsset1PublicId = '';
    let testAsset1SecureUrl = '';
    let testAsset2PublicId = '';

    // Stream upload 1x1 test image directly from memory buffer
    try {
      const uploadRes = await uploadToCloudinary(SAMPLE_PNG_BUFFER, {
        folder: 'agrimarket/tests',
        resourceType: 'image',
        tags: ['automated_test', 'unit_test'],
      });
      testAsset1PublicId = uploadRes.publicId;
      testAsset1SecureUrl = uploadRes.secureUrl;
      assert(
        testAsset1SecureUrl.startsWith('https://res.cloudinary.com/'),
        'Direct in-memory buffer streaming succeeded and returned HTTPS URL'
      );
      assert(
        testAsset1PublicId.startsWith('agrimarket/tests/'),
        'Asset correctly placed in target Cloudinary folder (agrimarket/tests)'
      );
    } catch (err: any) {
      console.error('Upload error:', err);
      assert(false, `In-memory streaming upload failed: ${err?.message}`);
    }

    // =========================================================================
    // 4. Asset Replacement Lifecycle (Upload new, delete old)
    // =========================================================================
    console.log('\n--- 4. Asset Replacement Lifecycle ---');

    if (testAsset1PublicId) {
      try {
        const replaceRes = await replaceCloudinaryAsset(testAsset1PublicId, SAMPLE_PNG_BUFFER, {
          folder: 'agrimarket/tests',
          resourceType: 'image',
          tags: ['automated_test', 'replaced_asset'],
        });
        testAsset2PublicId = replaceRes.publicId;
        assert(Boolean(testAsset2PublicId), 'Replaced asset uploaded new version successfully');
        assert(testAsset2PublicId !== testAsset1PublicId, 'New asset generated distinct public ID');
      } catch (err: any) {
        assert(false, `Asset replacement failed: ${err?.message}`);
      }
    }

    // =========================================================================
    // 5. Asset Deletion Lifecycle
    // =========================================================================
    console.log('\n--- 5. Asset Deletion Lifecycle ---');

    const assetToDelete = testAsset2PublicId || testAsset1PublicId;
    if (assetToDelete) {
      try {
        const deleteRes = await deleteFromCloudinary(assetToDelete, 'image');
        assert(deleteRes.success, 'Cloudinary asset deleted successfully via uploader.destroy');
      } catch (err: any) {
        assert(false, `Asset deletion failed: ${err?.message}`);
      }
    }
  } else {
    console.log('  ℹ️ Notice: External Cloudinary credentials not present or offline (CI mode).');
  }

  // =========================================================================
  // 5b. Resilient In-Memory Asset Streaming Fallback
  // =========================================================================
  console.log('\n--- Resilient In-Memory Asset Storage Fallback ---');
  let memAsset1Id = '';
  let memAsset2Id = '';

  try {
    const uploadRes = await uploadToCloudinary(SAMPLE_PNG_BUFFER, {
      folder: 'agrimarket/tests',
      resourceType: 'image',
      tags: ['automated_test', 'memory_fallback'],
    });
    memAsset1Id = uploadRes.publicId;
    assert(Boolean(uploadRes.publicId), 'Resilient streaming upload succeeds without crashing');
    assert(uploadRes.bytes === SAMPLE_PNG_BUFFER.length, 'Resilient asset byte count matches buffer');
  } catch (err: any) {
    assert(false, `Resilient streaming failed: ${err?.message}`);
  }

  if (memAsset1Id) {
    try {
      const replaceRes = await replaceCloudinaryAsset(memAsset1Id, SAMPLE_PNG_BUFFER, {
        folder: 'agrimarket/tests',
        resourceType: 'image',
      });
      memAsset2Id = replaceRes.publicId;
      assert(Boolean(replaceRes.publicId), 'Replaces asset in resilient store successfully');
    } catch (err: any) {
      assert(false, `Resilient replacement failed: ${err?.message}`);
    }
  }

  const memAssetToDelete = memAsset2Id || memAsset1Id;
  if (memAssetToDelete) {
    try {
      const deleteRes = await deleteFromCloudinary(memAssetToDelete, 'image');
      assert(deleteRes.success, 'Deletes asset from resilient store successfully');
    } catch (err: any) {
      assert(false, `Resilient deletion failed: ${err?.message}`);
    }
  }

  // =========================================================================
  // 6. Security & Authorization Gates on Endpoints
  // =========================================================================
  console.log('\n--- 6. Security & Role-Based Access Control on Upload Routes ---');

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));

  try {
    // Unauthenticated document upload
    const unauthUpload = await makeRequest(server, 'POST', '/api/onboarding/upload', {
      'content-type': 'application/json',
    });
    assert(unauthUpload.status === 401, 'POST /api/onboarding/upload rejects unauthenticated requests (401)');

    // Unauthenticated document retrieval
    const unauthDoc = await makeRequest(
      server,
      'GET',
      '/api/onboarding/documents/1793212897459-ed22721f-cb73-409e-99eb-bdb8cd07c3ba.png'
    );
    assert(unauthDoc.status === 401, 'GET /api/onboarding/documents/:filename rejects unauthenticated access (401)');

    // Unauthenticated avatar upload
    const unauthAvatar = await makeRequest(server, 'POST', '/api/auth/profile/avatar', {
      'content-type': 'application/json',
    });
    assert(unauthAvatar.status === 401, 'POST /api/auth/profile/avatar rejects unauthenticated requests (401)');

    // Unauthenticated delivery proof upload
    const unauthProof = await makeRequest(server, 'POST', '/api/worker/deliveries/upload-proof', {
      'content-type': 'application/json',
    });
    assert(unauthProof.status === 401, 'POST /api/worker/deliveries/upload-proof rejects unauthenticated requests (401)');
  } finally {
    server.close();
  }

  // =========================================================================
  // Summary
  // =========================================================================
  console.log(`\n======================================================`);
  console.log(`Cloudinary Test Results: ${passed} PASSED, ${failed} FAILED`);
  console.log(`======================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runCloudinaryTests().catch((err) => {
  console.error('Fatal error in Cloudinary test suite:', err);
  process.exit(1);
});

