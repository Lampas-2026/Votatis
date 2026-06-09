import { useEffect, useRef, useState } from "react";
import {
  ALLOWED_MIME,
  ApiError,
  MAX_ATTACHMENTS,
  MAX_FILE_BYTES,
  submitReport,
  type ProgressPhase,
  type Region,
  type Source,
  type SubmissionFinalized,
  type SubmissionInput,
} from "../lib/api";
import { extractExif } from "../lib/exif";
import { optimizeImage } from "../lib/image";
import { loadTurnstile, TURNSTILE_SITEKEY } from "../lib/turnstile";
import RegionAutocomplete, { type RegionEntry } from "./RegionAutocomplete";

// 최근 선거(본투표일 내림차순). API 로 보내는 election 값은 선거명만 사용한다.
const ELECTIONS: { name: string; voteDate: string }[] = [
  { name: "제9회 전국동시지방선거", voteDate: "2026.06.03" },
  { name: "제21대 대통령선거", voteDate: "2025.06.03" },
  { name: "제22대 국회의원선거", voteDate: "2024.04.10" },
  { name: "제8회 전국동시지방선거", voteDate: "2022.06.01" },
  { name: "제20대 대통령선거", voteDate: "2022.03.09" },
  { name: "제21대 국회의원선거", voteDate: "2020.04.15" },
];

// 유형 칩(단일 선택). 선택값은 제출 시 tags 에 포함한다.
const TYPES = ["수치 에러", "봉인", "훼손", "지면", "기타"] as const;

const STEP_TITLES = ["위치·유형", "상세·출처", "첨부·동의", "제보 완료"];
const STEP_PROGRESS = [40, 65, 90, 100];
const BODY_MAX = 2000;

interface SourceRow {
  url: string;
  text: string;
}

interface Attached {
  id: string;
  original: File;
  optimized: File;
  exif: unknown;
  previewUrl: string; // URL.createObjectURL(optimized)
  originalSize: number;
  optimizedSize: number;
}

const progressLabel: Record<ProgressPhase, string> = {
  submitting: "제출 개시 중…",
  uploading: "첨부 업로드 중…",
  finalizing: "확정 및 등록 중…",
};

/** issue_url 끝의 번호를 접수번호로 추출. (/issues/123, /simulate/issues/3) */
function issueNumber(url: string): string | null {
  const m = url.match(/(\d+)\/?$/);
  return m ? m[1] : null;
}

function errorMessageFor(err: unknown): string {
  if (err instanceof ApiError) {
    switch (err.status) {
      case 403:
        return `봇 인증(Turnstile)에 실패했습니다. 위젯을 다시 인증한 뒤 시도해 주세요. (${err.message})`;
      case 429:
        return "요청이 너무 잦습니다. 잠시 후 다시 시도해 주세요. (rate limit)";
      case 400:
        return `입력 또는 첨부가 거부되었습니다: ${err.message}`;
      default:
        return err.message;
    }
  }
  return err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.";
}

const inputClass =
  "mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500";
const labelClass = "block text-sm font-medium text-gray-700";

export default function ReportWizard() {
  const [step, setStep] = useState(0);

  // A-01
  const [election, setElection] = useState(ELECTIONS[0].name);
  const [regionText, setRegionText] = useState("");
  const [regionPick, setRegionPick] = useState<RegionEntry | null>(null);
  const [locationIndependent, setLocationIndependent] = useState(false);
  const [type, setType] = useState<string | null>(null);
  // A-02
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sources, setSources] = useState<SourceRow[]>([{ url: "", text: "" }]);
  // A-03
  const [attached, setAttached] = useState<Attached[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [consent, setConsent] = useState(false);

  const [token, setToken] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SubmissionFinalized | null>(null);

  const stepRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const attachIdRef = useRef(0);
  const attachedRef = useRef<Attached[]>([]);
  attachedRef.current = attached;

  // 언마운트 시 미리보기 objectURL 전체 정리(메모리 누수 방지)
  useEffect(() => {
    return () => {
      for (const a of attachedRef.current) URL.revokeObjectURL(a.previewUrl);
    };
  }, []);

  // 단계 전환 시 새 단계 첫 필드로 포커스 이동(접근성)
  useEffect(() => {
    const el = stepRef.current?.querySelector<HTMLElement>(
      "input, select, textarea, button:not([disabled])",
    );
    el?.focus();
  }, [step]);

  // Turnstile 위젯은 동의 단계(A-03)에서 1회 렌더
  useEffect(() => {
    if (step !== 2) return;
    let cancelled = false;
    loadTurnstile()
      .then((turnstile) => {
        if (cancelled || !widgetRef.current || widgetIdRef.current) return;
        widgetIdRef.current = turnstile.render(widgetRef.current, {
          sitekey: TURNSTILE_SITEKEY,
          callback: (t) => setToken(t),
          "expired-callback": () => setToken(null),
          "error-callback": () => setToken(null),
        });
      })
      .catch(() => setError("Turnstile 위젯을 불러오지 못했습니다."));
    return () => {
      cancelled = true;
    };
  }, [step]);

  function resetTurnstile() {
    setToken(null);
    if (window.turnstile && widgetIdRef.current) window.turnstile.reset(widgetIdRef.current);
  }

  const hasEvidence = sources.some((s) => s.url.trim() || s.text.trim()) || attached.length > 0;
  const hasRegion = regionText.trim() !== "" || regionPick !== null;

  const step0Valid = election.trim() !== "" && (locationIndependent || hasRegion) && type !== null;
  const step1Valid = title.trim() !== "";
  const canSubmit =
    !running && !processing && consent && !!token && hasEvidence && !fileError;

  // 선택분을 기존 목록에 누적. 통과분만 EXIF 추출 + WebP 최적화해 Attached 로 추가한다.
  async function handleFiles(selected: File[]) {
    if (selected.length === 0) return;
    setFileError(null);

    const remaining = MAX_ATTACHMENTS - attachedRef.current.length;
    if (remaining <= 0) {
      setFileError(`첨부는 최대 ${MAX_ATTACHMENTS}개까지 가능합니다.`);
      return;
    }

    let overflow = selected.length > remaining;
    const accepted: File[] = [];
    for (const f of selected) {
      if (accepted.length >= remaining) {
        overflow = true;
        break;
      }
      if (!ALLOWED_MIME.includes(f.type as (typeof ALLOWED_MIME)[number])) {
        setFileError(`허용되지 않는 타입입니다: ${f.name} (${f.type || "unknown"})`);
        continue;
      }
      if (f.size > MAX_FILE_BYTES) {
        setFileError(`파일이 너무 큽니다: ${f.name} (최대 ${MAX_FILE_BYTES / 1024 / 1024}MB)`);
        continue;
      }
      accepted.push(f);
    }

    if (overflow) {
      setFileError(`첨부는 최대 ${MAX_ATTACHMENTS}개까지 가능합니다. 초과분은 제외되었습니다.`);
    }
    if (accepted.length === 0) return;

    setProcessing(true);
    try {
      const items = await Promise.all(
        accepted.map(async (original): Promise<Attached> => {
          const [exif, opt] = await Promise.all([
            extractExif(original),
            optimizeImage(original),
          ]);
          attachIdRef.current += 1;
          return {
            id: `att-${attachIdRef.current}`,
            original,
            optimized: opt.optimized,
            exif,
            previewUrl: URL.createObjectURL(opt.optimized),
            originalSize: opt.originalSize,
            optimizedSize: opt.optimizedSize,
          };
        }),
      );
      setAttached((prev) => [...prev, ...items]);
    } finally {
      setProcessing(false);
    }
  }

  function removeAttached(id: string) {
    setAttached((prev) => {
      const target = prev.find((a) => a.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((a) => a.id !== id);
    });
  }

  function updateSource(i: number, patch: Partial<SourceRow>) {
    setSources((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  }
  function addSource() {
    setSources((prev) => [...prev, { url: "", text: "" }]);
  }
  function removeSource(i: number) {
    setSources((prev) => (prev.length === 1 ? prev : prev.filter((_, idx) => idx !== i)));
  }

  async function submit() {
    if (!canSubmit || !token) return;
    setRunning(true);
    setError(null);
    setProgress(progressLabel.submitting);

    try {
      const uploadFiles = attached.map((a) => a.optimized);
      const exif = attached.map((a) => a.exif);

      const cleanedSources: Source[] = sources
        .filter((s) => s.url.trim() || s.text.trim())
        .map((s) => ({
          ...(s.url.trim() ? { url: s.url.trim() } : {}),
          ...(s.text.trim() ? { text: s.text.trim() } : {}),
        }));

      // 자동완성에서 고른 항목이면 구조화, 매칭 없이 자유 입력이면 coarse 라벨로 sido 에(임시).
      let region: Region | undefined;
      if (locationIndependent) {
        region = { sido: "LOCATION_INDEPENDENT" };
      } else if (regionPick) {
        region = {
          ...(regionPick.sido ? { sido: regionPick.sido } : {}),
          ...(regionPick.sigungu ? { sigungu: regionPick.sigungu } : {}),
          ...(regionPick.umd ? { eup_myeon_dong: regionPick.umd } : {}),
        };
      } else if (regionText.trim()) {
        region = { sido: regionText.trim() };
      }

      const input: SubmissionInput = {
        election: election.trim(),
        title: title.trim(),
        ...(body.trim() ? { body: body.trim() } : {}),
        ...(region ? { region } : {}),
        ...(type ? { tags: [type] } : {}),
        ...(cleanedSources.length ? { sources: cleanedSources } : {}),
        ...(uploadFiles.length
          ? {
              attachments: uploadFiles.map((f) => ({
                filename: f.name,
                mime: f.type,
                size: f.size,
              })),
            }
          : {}),
        ...(exif.length ? { exif } : {}),
        consent,
        turnstile_token: token,
      };

      const finalized = await submitReport(input, uploadFiles, (phase, detail) => {
        setProgress(`${progressLabel[phase]}${detail ? ` (${detail})` : ""}`);
      });

      setResult(finalized);
      setProgress(null);
      setRunning(false);
      setStep(3);
    } catch (err) {
      setError(errorMessageFor(err));
      setProgress(null);
      setRunning(false);
      resetTurnstile(); // 토큰은 1회용 — 실패 시 재인증 유도
    }
  }

  const progressPct = STEP_PROGRESS[step];

  // 전체 이미지 원본합/최적화합 기준 실제 절감률 (절감 없으면 0)
  const totalOriginal = attached.reduce((sum, a) => sum + a.originalSize, 0);
  const totalOptimized = attached.reduce((sum, a) => sum + a.optimizedSize, 0);
  const savingsPct =
    totalOriginal > 0
      ? Math.max(0, Math.round((1 - totalOptimized / totalOriginal) * 100))
      : 0;

  return (
    <div>
      {/* 진행도 */}
      <div className="mb-6">
        <div className="mb-1 flex items-center justify-between text-sm">
          <span className="font-medium text-gray-700">
            {step + 1}/4 · {STEP_TITLES[step]}
          </span>
          <span className="font-semibold text-red-500">작성 완성도 {progressPct}%</span>
        </div>
        <div
          className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200"
          role="progressbar"
          aria-valuenow={progressPct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="작성 완성도"
        >
          <div
            className="h-full rounded-full bg-red-500 transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* 단계 변경 스크린리더 알림 */}
      <p className="sr-only" aria-live="polite">
        {step + 1}단계 {STEP_TITLES[step]}
      </p>

      <div ref={stepRef}>
        {step === 0 && (
          <section className="space-y-5" aria-label="위치·유형">
            <div>
              <label className={labelClass} htmlFor="election">
                선거 <span className="text-red-500">*</span>
              </label>
              <select
                id="election"
                className={inputClass}
                value={election}
                onChange={(e) => setElection(e.target.value)}
              >
                {ELECTIONS.map((e) => (
                  <option key={e.name} value={e.name}>
                    {e.name} (본투표일 {e.voteDate})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass} htmlFor="region">
                위치 <span className="text-red-500">*</span>
              </label>
              <RegionAutocomplete
                id="region"
                className={inputClass}
                placeholder="예: 경기 성남 분당 / 서울 종로구 청운동"
                disabled={locationIndependent}
                onChange={({ text, region }) => {
                  setRegionText(text);
                  setRegionPick(region);
                }}
              />
              <label className="mt-2 flex cursor-pointer items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={locationIndependent}
                  onChange={(e) => setLocationIndependent(e.target.checked)}
                  className="mt-0.5 h-4 w-4"
                />
                <span className="text-gray-700">
                  위치 무관 <span className="text-gray-500">(전국·특정 위치 없음)</span>
                </span>
              </label>
            </div>

            <div>
              <span className={labelClass}>
                유형 <span className="text-red-500">*</span>
              </span>
              <div className="mt-2 flex flex-wrap gap-2">
                {TYPES.map((t) => {
                  const selected = type === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setType(t)}
                      className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                        selected
                          ? "border-red-500 bg-red-500 text-white"
                          : "border-gray-300 bg-white text-gray-700 hover:border-red-300"
                      }`}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {step === 1 && (
          <section className="space-y-5" aria-label="상세·출처">
            <p className="rounded-md bg-gray-50 p-3 text-xs text-gray-500">
              중립적으로 서술해 주세요. 단정 대신 보이는 사실 위주로 적습니다.
            </p>
            <div>
              <label className={labelClass} htmlFor="title">
                제목 <span className="text-red-500">*</span>
              </label>
              <input
                id="title"
                className={inputClass}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="예: 사전투표함 봉인 스티커 훼손"
              />
            </div>

            <div>
              <label className={labelClass} htmlFor="body">
                상세 설명
              </label>
              <textarea
                id="body"
                rows={5}
                maxLength={BODY_MAX}
                className={inputClass}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="언제, 어디서, 무엇을 보았는지 시간순으로 적어주세요."
              />
              <p className="mt-1 text-right text-xs text-gray-400">
                {body.length} / {BODY_MAX}
              </p>
            </div>

            <fieldset className="rounded-md border border-gray-200 p-4">
              <legend className="px-1 text-sm font-medium text-gray-700">출처</legend>
              <p className="mb-3 text-xs text-gray-500">
                웹사이트 URL 또는 직접 입력 텍스트. 출처 또는 첨부(다음 단계) 중 최소 하나가 필요합니다.
              </p>
              <div className="space-y-3">
                {sources.map((s, i) => (
                  <div key={i} className="space-y-2 rounded border border-gray-100 bg-gray-50 p-3">
                    <input
                      className={inputClass}
                      value={s.url}
                      onChange={(e) => updateSource(i, { url: e.target.value })}
                      placeholder="https://news.example.com/…"
                      type="url"
                    />
                    <textarea
                      className={inputClass}
                      value={s.text}
                      onChange={(e) => updateSource(i, { text: e.target.value })}
                      placeholder="또는 직접 입력한 출처/증언"
                      rows={2}
                    />
                    {sources.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSource(i)}
                        className="text-xs text-red-600 hover:underline"
                      >
                        이 출처 삭제
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addSource}
                className="mt-3 text-sm font-medium text-red-600 hover:underline"
              >
                + 출처 추가
              </button>
            </fieldset>
          </section>
        )}

        {step === 2 && (
          <section className="space-y-5" aria-label="첨부·동의">
            <div>
              <label className={labelClass} htmlFor="attachments">
                첨부 자료 (최대 {MAX_ATTACHMENTS}개, 각 {MAX_FILE_BYTES / 1024 / 1024}MB 이하)
              </label>
              <input
                id="attachments"
                ref={fileInputRef}
                type="file"
                multiple
                accept={ALLOWED_MIME.join(",")}
                className="sr-only"
                onChange={(e) => {
                  void handleFiles(Array.from(e.target.files ?? []));
                  e.target.value = "";
                }}
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={processing}
                className="mt-2 flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 px-4 py-8 text-center transition-colors hover:border-red-300 hover:bg-red-50/40 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-500">
                  <span className="material-symbols-outlined" style={{ fontSize: "28px" }} aria-hidden="true">
                    photo_camera
                  </span>
                </span>
                <span className="text-sm font-medium text-gray-700">카메라로 촬영 · 사진 선택</span>
              </button>

              {processing && (
                <p className="mt-2 text-sm text-gray-500" aria-live="polite">
                  이미지 처리 중…
                </p>
              )}
              {fileError && <p className="mt-1 text-sm text-red-600">{fileError}</p>}

              {attached.length > 0 && (
                <ul className="mt-3 grid grid-cols-2 gap-3">
                  {attached.map((a) => (
                    <li key={a.id} className="relative">
                      <img
                        src={a.previewUrl}
                        alt={a.original.name}
                        className="h-28 w-full rounded-lg object-cover"
                      />
                      <span className="absolute bottom-1 left-1 rounded-full bg-gray-700/80 px-1.5 py-0.5 text-[10px] font-medium text-white">
                        EXIF
                      </span>
                      <button
                        type="button"
                        onClick={() => removeAttached(a.id)}
                        aria-label={`${a.original.name} 삭제`}
                        className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-gray-900/70 text-sm leading-none text-white hover:bg-gray-900"
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <p className="mt-2 text-xs text-gray-400">
                메타데이터 확인됨 · 최적화 약 -{savingsPct}%
              </p>
            </div>

            <label className="flex cursor-pointer items-start gap-2 rounded-md border border-gray-200 p-3 text-sm">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5 h-4 w-4"
              />
              <span className="text-gray-700">
                익명 제보·공개에 동의합니다. <span className="text-gray-500">실명·연락처는 저장하지 않습니다.</span>
              </span>
            </label>

            <div>
              <p className={labelClass}>봇 확인</p>
              <div ref={widgetRef} className="mt-1" />
            </div>

            {!hasEvidence && (
              <p className="text-sm text-amber-600">
                출처(이전 단계) 또는 첨부 중 최소 하나가 필요합니다.
              </p>
            )}
            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}
            {progress && (
              <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
                {progress}
              </div>
            )}
          </section>
        )}

        {step === 3 && result && (
          <section className="rounded-lg border border-green-200 bg-green-50 p-6 text-center" aria-label="제보 완료">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-2xl text-green-600">
              ✓
            </div>
            <h2 className="mt-4 text-lg font-semibold text-green-800">제보가 접수되었습니다</h2>
            <p className="mt-1 text-sm text-green-700">
              검토 큐에 등록되었습니다. 사람이 출처를 대조한 뒤 공개 여부가 결정됩니다.
            </p>
            {issueNumber(result.issue_url) && (
              <p className="mt-3 font-mono text-sm font-semibold text-red-600">
                접수번호 #{issueNumber(result.issue_url)}
              </p>
            )}
            <div className="mt-4 rounded-md bg-white p-3 text-left text-xs text-gray-600">
              <p className="mb-1 font-medium text-gray-700">이후 처리</p>
              <ol className="list-inside list-decimal space-y-0.5">
                <li>R2 업로드 · SHA-256 봉인</li>
                <li>검토 큐 등록</li>
                <li>검증 후 공개 반영</li>
              </ol>
            </div>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-6 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
            >
              새 제보 작성
            </button>
          </section>
        )}
      </div>

      {/* 네비게이션 (완료 단계 제외) */}
      {step < 3 && (
        <div className="mt-8 flex items-center justify-between gap-3">
          {step > 0 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              disabled={running}
              className="rounded-md border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              이전
            </button>
          ) : (
            <span />
          )}

          {step < 2 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              disabled={(step === 0 && !step0Valid) || (step === 1 && !step1Valid)}
              className="rounded-md bg-red-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              다음
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void submit()}
              disabled={!canSubmit}
              className="rounded-md bg-red-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {running ? "제출 중…" : "제보 보내기"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
