import { v2 as cloudinary } from 'cloudinary';
import path from 'path';
import dotenv from 'dotenv';

// Ensure environment variables are loaded from parent root and backend local .env
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

/**
 * Dynamically resolves Cloudinary credentials from individual variables
 * or standard CLOUDINARY_URL connection strings.
 */
export function resolveCloudinaryCredentials() {
  let cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  let apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  let apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

  // Support CLOUDINARY_URL connection string: cloudinary://api_key:api_secret@cloud_name
  if ((!cloudName || !apiKey || !apiSecret) && process.env.CLOUDINARY_URL) {
    try {
      const url = new URL(process.env.CLOUDINARY_URL);
      cloudName = url.hostname;
      apiKey = url.username;
      apiSecret = url.password;
    } catch {
      // ignore parse failure
    }
  }

  return { cloudName, apiKey, apiSecret };
}

/**
 * Configures Cloudinary instance dynamically with current environment variables.
 */
export function configureCloudinary(): boolean {
  const { cloudName, apiKey, apiSecret } = resolveCloudinaryCredentials();
  if (cloudName && apiKey && apiSecret) {
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });
    return true;
  }
  return false;
}

/**
 * Checks if Cloudinary is configured with valid credentials in the current environment.
 */
export function isCloudinaryConfigured(): boolean {
  return configureCloudinary();
}

// Initial configuration attempt on module load
configureCloudinary();

export default cloudinary;
