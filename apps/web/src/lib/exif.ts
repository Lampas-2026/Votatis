import exifr from "exifr";

/**
 * 첨부 이미지에서 EXIF 요약을 클라이언트에서 추출한다.
 * 원본 바이트는 presigned PUT 으로 R2 에 직접 올라가고, 여기서 뽑은 메타만 API 에 전송한다.
 *
 * 주의(스펙 §7): GPS 등 민감 EXIF 처리는 임시 단계에선 추출값을 그대로 전송한다.
 * 마스킹/선택 전송 정책은 추후 별도로 다룬다.
 */
export interface ExifSummary {
  filename: string;
  /** exifr 가 파싱한 원시 EXIF (파싱 실패/없음이면 null) */
  data: Record<string, unknown> | null;
}

export async function extractExif(file: File): Promise<ExifSummary> {
  try {
    const data = (await exifr.parse(file)) as Record<string, unknown> | undefined;
    return { filename: file.name, data: data ?? null };
  } catch {
    // 손상되었거나 EXIF 없는 이미지 — 제출을 막지 않고 null 로 둔다.
    return { filename: file.name, data: null };
  }
}

export async function extractExifAll(files: File[]): Promise<ExifSummary[]> {
  return Promise.all(files.map(extractExif));
}
