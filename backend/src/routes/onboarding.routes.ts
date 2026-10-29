import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { handleSingleUpload, uploadMemoryDocument } from '../middleware/upload.js';
import {
  getOnboardingStatus,
  selectRole,
  saveDraft,
  getDraft,
  uploadDocument,
  serveDocument,
  submitFarmerApplication,
  submitWorkerApplication,
} from '../controllers/onboarding.controller.js';

const router = Router();

// All onboarding endpoints require an authenticated user
router.use(requireAuth);

// 1. Authoritative onboarding status
router.get('/status', getOnboardingStatus);

// 2. Initial role selection
router.post('/select-role', selectRole);

// 3. Draft management
router.get('/draft', getDraft);
router.post('/draft', saveDraft);

// 4. Document upload (in-memory buffer directly streamed to Cloudinary)
router.post(
  '/upload',
  handleSingleUpload('file', uploadMemoryDocument),
  uploadDocument
);

// Secure access-controlled document retrieval / redirection
router.get('/documents/:filename', serveDocument);

// 5. Verification Application Submissions
router.post('/submit-farmer', submitFarmerApplication);
router.post('/submit-worker', submitWorkerApplication);

export default router;
