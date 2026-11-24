import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

// Uploaded images are stored on this computer's disk, in <project>/uploads,
// and served by src/app/uploads/[file]/route.ts. To move them to a storage
// service (e.g. Cloudflare R2 or S3) later, only this file needs to change.
const UPLOAD_DIR = path.join(process.cwd(), "uploads");
const URL_PREFIX = "/uploads/";

// Only names this file creates, so a request can't reach other files.
const FILE_NAME = /^[0-9a-f-]{36}\.webp$/;

// Largest file accepted before resizing.
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
// Longest side after resizing. Smaller images are kept at their size.
const MAX_SIDE = 1600;

// Resizes the image, converts it to WebP and saves it. Returns its URL.
// Throws when the file isn't an image sharp can read.
export async function saveImage(file: File) {
  const input = Buffer.from(await file.arrayBuffer());
  const output = await sharp(input)
    // Applies the phone camera's rotation, then drops the photo's metadata.
    .rotate()
    .resize(MAX_SIDE, MAX_SIDE, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();

  const name = `${randomUUID()}.webp`;
  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, name), output);
  return `${URL_PREFIX}${name}`;
}

// Removes an uploaded image. Links to images elsewhere are left alone.
export async function deleteImage(url: string) {
  const name = url.slice(URL_PREFIX.length);
  if (!url.startsWith(URL_PREFIX) || !FILE_NAME.test(name)) return;
  await unlink(path.join(UPLOAD_DIR, name)).catch(() => {});
}

// The file's bytes, or null when the name isn't an upload or doesn't exist.
export async function readImage(name: string) {
  if (!FILE_NAME.test(name)) return null;
  return readFile(path.join(UPLOAD_DIR, name)).catch(() => null);
}
