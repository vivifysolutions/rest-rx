import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { auth, storage } from "./firebase";

const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB

/**
 * Uploads an image to Firebase Storage and returns the public download URL.
 * Mirrors the mobile app's `uploadThreadImage` pattern.
 *
 * @param file Browser File chosen via <input type="file">
 * @param folder Storage folder (e.g. "discounts", "events", "resources", "retreats")
 */
export async function uploadImage(file: File, folder: string): Promise<string> {
  if (!auth.currentUser) {
    throw new Error("You must be signed in to upload images.");
  }
  if (!ALLOWED_MIME.includes(file.type)) {
    throw new Error(
      `Unsupported image type: ${file.type || "unknown"}. Use JPG, PNG, WEBP, or GIF.`,
    );
  }
  if (file.size > MAX_BYTES) {
    throw new Error(
      `Image is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Max 8 MB.`,
    );
  }

  // Force a fresh ID token so Storage rules accept the request.
  await auth.currentUser.getIdToken(true);

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const safeFolder = folder.replace(/[^a-z0-9_-]/gi, "");
  const path = `${safeFolder}/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}.${ext}`;

  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file, { contentType: file.type });
  return getDownloadURL(storageRef);
}
