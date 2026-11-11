import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut,
  User 
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App singleton
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Google Auth Provider with Google Drive File scope
const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/drive.file');

// In-memory token caching (NOT in localStorage/sessionStorage as mandated)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

export const initDriveAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user && cachedAccessToken) {
      if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
    } else if (!isSigningIn) {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const signInWithGoogleDrive = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to acquire Google Drive access token');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (err) {
    console.error('Google Drive sign in failed:', err);
    throw err;
  } finally {
    isSigningIn = false;
  }
};

export const getDriveAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const logoutGoogleDrive = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};

export interface DriveUploadResult {
  id: string;
  name: string;
  webViewLink?: string;
}

/**
 * Uploads the SellerPro Netlify or source zip file directly into the user's Google Drive
 */
export const uploadZipToGoogleDrive = async (
  zipBlobUrl: string, 
  fileName: string = 'sellerpro-netlify-deploy.zip'
): Promise<DriveUploadResult> => {
  let token = getDriveAccessToken();
  if (!token) {
    const authResult = await signInWithGoogleDrive();
    if (!authResult) {
      throw new Error('Google Drive sign-in required');
    }
    token = authResult.accessToken;
  }

  // Fetch the local zip binary
  const zipResponse = await fetch(zipBlobUrl);
  if (!zipResponse.ok) {
    throw new Error('Failed to load zip file for Google Drive upload');
  }
  const zipBlob = await zipResponse.blob();

  // Create multipart boundary request for Drive v3
  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metadata = {
    name: fileName,
    mimeType: 'application/zip',
    description: 'SellerPro production package ready for Netlify and Google indexing.',
  };

  const metadataPart = delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata);

  // Convert blob to ArrayBuffer to construct multipart body safely
  const zipArrayBuffer = await zipBlob.arrayBuffer();
  const headerBytes = new TextEncoder().encode(
    metadataPart + delimiter + 'Content-Type: application/zip\r\n\r\n'
  );
  const footerBytes = new TextEncoder().encode(closeDelimiter);

  const combinedLength = headerBytes.length + zipArrayBuffer.byteLength + footerBytes.length;
  const multipartBody = new Uint8Array(combinedLength);

  multipartBody.set(headerBytes, 0);
  multipartBody.set(new Uint8Array(zipArrayBuffer), headerBytes.length);
  multipartBody.set(footerBytes, headerBytes.length + zipArrayBuffer.byteLength);

  const driveResponse = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartBody,
    }
  );

  if (!driveResponse.ok) {
    const errorBody = await driveResponse.text();
    throw new Error(`Google Drive upload failed: ${driveResponse.status} ${errorBody}`);
  }

  const resultData = await driveResponse.json();
  return resultData as DriveUploadResult;
};
