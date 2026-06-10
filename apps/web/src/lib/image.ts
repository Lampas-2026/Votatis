// 클라이언트 이미지 최적화: canvas 로 리사이즈 후 WebP 재인코딩.
// 긴 변이 MAX_EDGE 를 넘으면 비율 유지 축소, 이미 작으면 원본 크기 유지.
// 실패(디코딩/toBlob 등) 시 원본을 그대로 반환해 제출 흐름이 끊기지 않게 한다.
//
// 주의: canvas 재인코딩은 EXIF 를 제거한다. EXIF 는 exif.ts 로 원본에서 별도 추출해
// 메타로 전송하므로 여기서는 EXIF 를 다루지 않는다.

const MAX_EDGE = 1920;
const WEBP_QUALITY = 0.8;

export interface OptimizeResult {
  optimized: File;
  originalSize: number;
  optimizedSize: number;
}

/** 파일명 확장자를 .webp 로 교체 (a.jpg -> a.webp, 확장자 없으면 .webp 추가) */
function toWebpName(name: string): string {
  const dot = name.lastIndexOf(".");
  const base = dot > 0 ? name.slice(0, dot) : name;
  return `${base}.webp`;
}

/** createImageBitmap 우선, 실패 시 <img>+objectURL 폴백으로 비트맵 크기와 그릴 소스를 얻는다. */
async function decode(
  file: File,
): Promise<{ source: CanvasImageSource; width: number; height: number; cleanup: () => void }> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file);
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        cleanup: () => bitmap.close(),
      };
    } catch {
      /* 폴백으로 진행 */
    }
  }

  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("image decode failed"));
      el.src = url;
    });
    return {
      source: img,
      width: img.naturalWidth,
      height: img.naturalHeight,
      cleanup: () => URL.revokeObjectURL(url),
    };
  } catch (err) {
    URL.revokeObjectURL(url);
    throw err;
  }
}

export async function optimizeImage(file: File): Promise<OptimizeResult> {
  const passthrough: OptimizeResult = {
    optimized: file,
    originalSize: file.size,
    optimizedSize: file.size,
  };

  let handle: Awaited<ReturnType<typeof decode>> | null = null;
  try {
    handle = await decode(file);
    const { source, width, height } = handle;
    if (!width || !height) return passthrough;

    const longest = Math.max(width, height);
    const scale = longest > MAX_EDGE ? MAX_EDGE / longest : 1;
    const targetW = Math.round(width * scale);
    const targetH = Math.round(height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return passthrough;
    ctx.drawImage(source, 0, 0, targetW, targetH);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), "image/webp", WEBP_QUALITY);
    });
    if (!blob) return passthrough;

    const optimized = new File([blob], toWebpName(file.name), { type: "image/webp" });
    return { optimized, originalSize: file.size, optimizedSize: optimized.size };
  } catch {
    return passthrough;
  } finally {
    handle?.cleanup();
  }
}
