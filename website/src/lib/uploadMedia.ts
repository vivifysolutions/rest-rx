import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { auth, storage } from "./firebase";

const ALLOWED_VIDEO = ["video/mp4", "video/quicktime", "video/webm"];
const ALLOWED_AUDIO = [
  "audio/mpeg",
  "audio/mp4",
  "audio/wav",
  "audio/x-m4a",
  "audio/aac",
  "audio/x-wav",
];
const MAX_BYTES = 100 * 1024 * 1024; // 100 MB

export type MediaKind = "video" | "audio";

function allowedMime(kind: MediaKind, mime: string): boolean {
  const list = kind === "video" ? ALLOWED_VIDEO : ALLOWED_AUDIO;
  return list.includes(mime);
}

/**
 * Upload audio or video for a Discover resource to Firebase Storage.
 * Files are stored under `resources/media/`.
 */
export async function uploadResourceMedia(
  file: File,
  kind: MediaKind,
): Promise<string> {
  if (!auth.currentUser) {
    throw new Error("You must be signed in to upload media.");
  }
  if (!allowedMime(kind, file.type)) {
    throw new Error(
      kind === "video"
        ? `Unsupported video type: ${file.type || "unknown"}. Use MP4, MOV, or WEBM.`
        : `Unsupported audio type: ${file.type || "unknown"}. Use MP3, M4A, WAV, or AAC.`,
    );
  }
  if (file.size > MAX_BYTES) {
    throw new Error(
      `File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Max 100 MB.`,
    );
  }

  await auth.currentUser.getIdToken(true);

  const ext = file.name.split(".").pop()?.toLowerCase() ?? (kind === "video" ? "mp4" : "mp3");
  const path = `resources/media/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file, { contentType: file.type });
  return getDownloadURL(storageRef);
}
