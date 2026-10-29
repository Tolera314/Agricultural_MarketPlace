import '../config/env.js';

async function runAudit() {
  try {
    const prisma = (await import('../config/prisma.js')).default;
    const farmers = await prisma.farmerProfile.findMany({ select: { id: true, userId: true, verificationDocuments: true } });
    console.log('FARMERS DOCS:', JSON.stringify(farmers, null, 2));

    const workers = await prisma.deliveryWorkerProfile.findMany({ select: { id: true, userId: true, verificationDocuments: true } });
    console.log('WORKERS DOCS:', JSON.stringify(workers, null, 2));

    const users = await prisma.user.findMany({
      select: { id: true, email: true, phone: true, onboardingDraft: true }
    });
    console.log('USERS WITH DRAFTS:', JSON.stringify(users.filter(u => u.onboardingDraft), null, 2));

    const profiles = await prisma.userProfile.findMany({
      where: { avatarUrl: { not: null } },
      select: { id: true, userId: true, avatarUrl: true }
    });
    console.log('USER PROFILES AVATARS:', JSON.stringify(profiles, null, 2));

    const listingImages = await prisma.listingImage.findMany({
      select: { id: true, listingId: true, url: true }
    });
    console.log('LISTING IMAGES:', JSON.stringify(listingImages, null, 2));

    await prisma.$disconnect();
  } catch (e: any) {
    console.error('ERROR OCCURRED:', e);
  }
}

runAudit();
