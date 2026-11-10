import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { auth, storage } from "./firebase";

const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_BYTES = 32 * 1024 * 1024; // 32 MB
/** Longest edge for photos shown in the app. Verification photos stay original size. */
const LISTING_LONG_EDGE = 1600;
const JPEG_QUALITY = 0.75;
const CACHE_CONTROL = "public, max-age=31536000, immutable";

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

function shouldResize(folder: string): boolean {
  return !isAdminVerificationFolder(folder) && !isUserVerificationFolder(folder);
}

/**
 * Fit a listing photo inside 1600px and encode JPEG. GIFs and already-small
 * JPEGs are uploaded as chosen. Verification folders skip this entirely.
 */
async function prepareListingFile(file: File): Promise<File> {
  if (file.type === "image/gif") return file;

  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  try {
    const longEdge = Math.max(bitmap.width, bitmap.height);
    const alreadySmallJpeg = file.type === "image/jpeg" && longEdge > 0 && longEdge <= LISTING_LONG_EDGE;
    if (alreadySmallJpeg) return file;

    const scale = longEdge > LISTING_LONG_EDGE ? LISTING_LONG_EDGE / longEdge : 1;
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Could not prepare the photo for upload.");
    }
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY);
    });
    if (!blob) {
      throw new Error("Could not prepare the photo for upload.");
    }
    const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], name, { type: "image/jpeg" });
  } finally {
    bitmap.close();
  }
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
 * @param folder Storage folder (e.g. "discounts", "threads/admin", "groups/covers/admin")
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

  const resize = shouldResize(folder);

  try {
    const prepared = resize ? await prepareListingFile(file) : file;
    const ext = prepared.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const path = buildStoragePath(folder, user.uid, ext);
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, prepared, {
      contentType: prepared.type,
      cacheControl: resize ? CACHE_CONTROL : undefined,
    });
    return getDownloadURL(storageRef);
  } catch (error) {
    throw new Error(storageErrorMessage(error));
  }
}
