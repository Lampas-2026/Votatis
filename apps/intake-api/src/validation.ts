export const ALLOWED_MIME_LIST = ["image/jpeg", "image/png", "image/gif", "image/webp"] as const;
export const ALLOWED_MIME = new Set<string>(ALLOWED_MIME_LIST);
export const MAX_FILE_BYTES = 15 * 1024 * 1024; // 15MB
export const MAX_ATTACHMENTS = 10;

/**
 * 바이트 시그니처(magic bytes)로 실제 이미지 타입을 판별한다.
 * Content-Type 헤더는 신뢰하지 않는다(위조·polyglot 방어). finalize 에서 사용.
 */
export function detectImageType(bytes: Uint8Array): string | null {
  const at = (sig: number[], offset = 0) => sig.every((b, i) => bytes[offset + i] === b);
  if (at([0xff, 0xd8, 0xff])) return "image/jpeg";
  if (at([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  if (at([0x47, 0x49, 0x46, 0x38])) return "image/gif"; // GIF8
  if (at([0x52, 0x49, 0x46, 0x46]) && at([0x57, 0x45, 0x42, 0x50], 8)) return "image/webp"; // RIFF....WEBP
  return null;
}
