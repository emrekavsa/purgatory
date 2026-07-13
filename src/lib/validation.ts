export const MAX_POLL_TITLE_LENGTH = 280;
export const MAX_POLL_OPTION_LENGTH = 120;
export const MAX_COMMENT_LENGTH = 1_000;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const IMAGE_ACCEPT = ALLOWED_IMAGE_TYPES.join(",");

const IMAGE_EXTENSIONS: Record<(typeof ALLOWED_IMAGE_TYPES)[number], string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function hasBytes(bytes: Uint8Array, expected: number[], offset = 0) {
  return expected.every((value, index) => bytes[offset + index] === value);
}

function hasAscii(bytes: Uint8Array, expected: string, offset: number) {
  return [...expected].every(
    (character, index) => bytes[offset + index] === character.charCodeAt(0),
  );
}

export async function validateImageFile(file: File) {
  if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return "Please upload a JPG, PNG, or WebP image.";
  }

  if (file.size <= 0 || file.size > MAX_IMAGE_BYTES) {
    return "Images must be smaller than 5 MB.";
  }

  const bytes = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  const isJpeg =
    file.type === "image/jpeg" && hasBytes(bytes, [0xff, 0xd8, 0xff]);
  const isPng =
    file.type === "image/png" &&
    hasBytes(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const isWebp =
    file.type === "image/webp" &&
    hasAscii(bytes, "RIFF", 0) &&
    hasAscii(bytes, "WEBP", 8);

  return isJpeg || isPng || isWebp
    ? null
    : "The selected file is not a valid image.";
}

export function getImageExtension(file: File) {
  return IMAGE_EXTENSIONS[file.type as keyof typeof IMAGE_EXTENSIONS] ?? null;
}
