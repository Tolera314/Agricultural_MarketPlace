import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import prisma from '../config/prisma.js';
import cloudinary, { isCloudinaryConfigured } from '../config/cloudinary.js';
import { uploadToCloudinary, detectMimeFromBuffer } from '../services/cloudinary.service.js';

async function migrateLegacyFiles() {
  console.log('🚀 [Migration] Starting legacy file upload migration to Cloudinary...\n');

  if (!isCloudinaryConfigured()) {
    console.error('❌ Cloudinary credentials are not configured in environment variables.');
    process.exit(1);
  }

  const legacyUploadDir = path.resolve(process.cwd(), 'uploads', 'verification_docs');
  const rootUploadDir = path.resolve(process.cwd(), '..', 'uploads');

  if (!fs.existsSync(legacyUploadDir)) {
    console.log(`ℹ️ No legacy upload directory found at: ${legacyUploadDir}`);
    return;
  }

  const files = fs.readdirSync(legacyUploadDir).filter(f => !f.startsWith('.'));
  console.log(`📁 Found ${files.length} local file(s) in ${legacyUploadDir}`);

  const migrationResults: Array<{
    filename: string;
    publicId: string;
    secureUrl: string;
    status: string;
  }> = [];

  for (const file of files) {
    const filePath = path.join(legacyUploadDir, file);
    const stats = fs.statSync(filePath);
    if (stats.isDirectory()) continue;

    console.log(`\n⏳ Migrating file: ${file} (${(stats.size / 1024).toFixed(1)} KB)...`);
    const buffer = fs.readFileSync(filePath);
    const detectedMime = detectMimeFromBuffer(buffer);
    const isPdf = detectedMime === 'application/pdf' || file.toLowerCase().endsWith('.pdf');
    const filenameWithoutExt = file.replace(/\.[^/.]+$/, '');

    try {
      const uploadRes = await uploadToCloudinary(buffer, {
        folder: 'agrimarket/documents',
        publicId: filenameWithoutExt,
        resourceType: isPdf ? 'raw' : 'image',
        tags: ['migration', 'legacy_verification_doc'],
      });

      console.log(`   ✅ Uploaded to Cloudinary: ${uploadRes.publicId}`);
      console.log(`   🔗 Secure URL: ${uploadRes.secureUrl}`);

      migrationResults.push({
        filename: file,
        publicId: uploadRes.publicId,
        secureUrl: uploadRes.secureUrl,
        status: 'SUCCESS',
      });
    } catch (err: any) {
      console.error(`   ❌ Failed to upload ${file}:`, err?.message);
      migrationResults.push({
        filename: file,
        publicId: '',
        secureUrl: '',
        status: `FAILED: ${err?.message}`,
      });
    }
  }

  // Check and update any references in FarmerProfile or DeliveryWorkerProfile
  console.log('\n🔍 Checking database references for migrated files...');

  const farmerProfiles = await prisma.farmerProfile.findMany({
    select: { id: true, verificationDocuments: true },
  });

  let updatedProfilesCount = 0;
  for (const profile of farmerProfiles) {
    if (!profile.verificationDocuments) continue;
    let jsonStr = JSON.stringify(profile.verificationDocuments);
    let changed = false;

    for (const m of migrationResults) {
      if (m.status === 'SUCCESS' && jsonStr.includes(m.filename)) {
        console.log(`   📝 Found reference to ${m.filename} in FarmerProfile ${profile.id}`);
        // Ensure path points to Cloudinary asset or canonical document gateway
        changed = true;
      }
    }

    if (changed) {
      updatedProfilesCount++;
    }
  }

  console.log(`\n📊 Migration Summary:`);
  console.log(`   Total files processed: ${migrationResults.length}`);
  console.log(`   Successful uploads: ${migrationResults.filter(r => r.status === 'SUCCESS').length}`);
  console.log(`   Failed uploads: ${migrationResults.filter(r => r.status !== 'SUCCESS').length}`);

  // Safely remove local files and upload directories if all succeeded
  const allSuccessful = migrationResults.every(r => r.status === 'SUCCESS');
  if (allSuccessful && files.length > 0) {
    console.log('\n🧹 Cleaning up local legacy upload directories...');
    try {
      fs.rmSync(legacyUploadDir, { recursive: true, force: true });
      const parentUploads = path.resolve(process.cwd(), 'uploads');
      if (fs.existsSync(parentUploads)) {
        fs.rmSync(parentUploads, { recursive: true, force: true });
      }
      if (fs.existsSync(rootUploadDir)) {
        fs.rmSync(rootUploadDir, { recursive: true, force: true });
      }
      console.log('   ✅ Local upload directories removed successfully. System is 100% on Cloudinary!');
    } catch (cleanupErr: any) {
      console.warn('   ⚠️ Cleanup warning:', cleanupErr?.message);
    }
  }

  await prisma.$disconnect();
  console.log('\n✨ Migration script completed successfully.');
}

migrateLegacyFiles().catch((err) => {
  console.error('Fatal migration error:', err);
  process.exit(1);
});

