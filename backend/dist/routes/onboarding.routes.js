import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import { requireAuth } from '../middleware/requireAuth.js';
import { getOnboardingStatus, selectRole, saveDraft, getDraft, uploadDocument, serveDocument, submitFarmerApplication, submitWorkerApplication, UPLOAD_DIR, } from '../controllers/onboarding.controller.js';
const router = Router();
// Multer Storage Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const unique = crypto.randomUUID();
        cb(null, `${Date.now()}-${unique}${ext}`);
    },
});
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
    fileFilter: (req, file, cb) => {
        const allowedMime = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
        if (allowedMime.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error('Invalid file type. Only JPEG, PNG, WEBP, and PDF documents are supported.'));
        }
    },
});
// All onboarding endpoints require an authenticated user
router.use(requireAuth);
// 1. Authoritative onboarding status
router.get('/status', getOnboardingStatus);
// 2. Initial role selection
router.post('/select-role', selectRole);
// 3. Draft management
router.get('/draft', getDraft);
router.post('/draft', saveDraft);
// 4. Document upload & secure retrieval
router.post('/upload', upload.single('file'), uploadDocument);
router.get('/documents/:filename', serveDocument);
// 5. Verification Application Submissions
router.post('/submit-farmer', submitFarmerApplication);
router.post('/submit-worker', submitWorkerApplication);
export default router;
//# sourceMappingURL=onboarding.routes.js.map