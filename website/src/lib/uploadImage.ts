import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { auth, storage } from "./firebase";

const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_BYTES = 32 * 1024 * 1024; // 32 MB

function sanitizeStorageFolder(folder: string): string {
  return folder
    .split("/")
    .map((segment) => segment.replace(/[^a-z0-9_-]/gi, ""))
    .filter(Boolean)
    .join("/");
}

function isAdminVerificationFolder(folder: string): boolean {
  return folder.startsWith("verification/admin/");
}

function isUserVerificationFolder(folder: string): boolean {
  return (
    folder === "verification/identity" ||
    folder.startsWith("verification/identity/") ||
    folder === "verification/work-credential" ||
    folder.startsWith("verification/work-credential/")
  );
}

function buildStoragePath(folder: string, uid: string, ext: string): string {
  const safeFolder = sanitizeStorageFolder(folder);
  const filePart = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  if (isAdminVerificationFolder(safeFolder)) {
    return `${safeFolder}/${filePart}`;
  }
  if (isUserVerificationFolder(safeFolder)) {
    return `${safeFolder}/${uid}/${filePart}`;
  }
  return `${safeFolder}/${filePart}`;
}

function storageErrorMessage(error: unknown): string {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code?: string }).code)
      : "";
  if (code === "storage/unauthorized") {
    return "Upload was blocked by Firebase Storage rules. Ask an engineer to publish the latest storage rules.";
  }
  if (code === "storage/unauthenticated") {
    return "You must be signed in to upload images.";
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "Image upload failed. Please try again.";
}

/**
 * Uploads an image to Firebase Storage and returns the public download URL.
 *
 * @param file Browser File chosen via <input type="file">
 * @param folder Storage folder (e.g. "discounts", "verification/identity", "verification/admin/identity")
 */
export async function uploadImage(file: File, folder: string): Promise<string> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("You must be signed in to upload images.");
  }
  if (!ALLOWED_MIME.includes(file.type)) {
    throw new Error(
      `Unsupported image type: ${file.type || "unknown"}. Use JPG, PNG, WEBP, or GIF.`,
    );
  }
  if (file.size > MAX_BYTES) {
    throw new Error(
      `Image is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Max 32 MB.`,
    );
  }

  await user.getIdToken(true);

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = buildStoragePath(folder, user.uid, ext);

  try {
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file, { contentType: file.type });
    return getDownloadURL(storageRef);
  } catch (error) {
    throw new Error(storageErrorMessage(error));
  }
}
