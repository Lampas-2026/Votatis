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
import { extractExifAll } from "../lib/exif";
import { loadTurnstile, TURNSTILE_SITEKEY } from "../lib/turnstile";
import RegionAutocomplete, { type RegionEntry } from "./RegionAutocomplete";

const API_BASE_URL = import.meta.env.PUBLIC_API_BASE_URL ?? "http://localhost:8787";

// 최근 선거 5개(본투표일 내림차순). label 에 본투표일을 함께 보여주되,
// API 로 보내는 election 값은 선거명만 사용한다.
const ELECTIONS: { name: string; voteDate: string }[] = [
  { name: "제9회 전국동시지방선거", voteDate: "2026.06.03" },
  { name: "제21대 대통령선거", voteDate: "2025.06.03" },
  { name: "제22대 국회의원선거", voteDate: "2024.04.10" },
  { name: "제8회 전국동시지방선거", voteDate: "2022.06.01" },
  { name: "제20대 대통령선거", voteDate: "2022.03.09" },
  { name: "제21대 국회의원선거", voteDate: "2020.04.15" },
];

type FormStatus = "idle" | "running" | "success" | "error";

interface SourceRow {
  url: string;
  text: string;
}

const progressLabel: Record<ProgressPhase, string> = {
  submitting: "제출 개시 중…",
  uploading: "첨부 업로드 중…",
  finalizing: "확정 및 등록 중…",
};

/** datetime-local 값("YYYY-MM-DDTHH:mm")을 ISO 8601 로 변환. 비면 undefined. */
function toIsoOrUndefined(value: string): string | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

/** 상대 경로(시뮬레이션 모드의 /simulate/issues/n)면 API base 를 붙인다. */
function resolveIssueUrl(url: string): string {
  return url.startsWith("/") ? `${API_BASE_URL}${url}` : url;
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
  "mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";
const labelClass = "block text-sm font-medium text-gray-700";

export default function ReportForm() {
  const [election, setElection] = useState(ELECTIONS[0].name);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [body, setBody] = useState("");
  const [regionText, setRegionText] = useState("");
  const [regionPick, setRegionPick] = useState<RegionEntry | null>(null);
  const [occurredAt, setOccurredAt] = useState("");
  const [tags, setTags] = useState("");
  const [sources, setSources] = useState<SourceRow[]>([{ url: "", text: "" }]);
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);

  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState<FormStatus>("idle");
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SubmissionFinalized | null>(null);

  const widgetRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  // Turnstile 위젯 렌더 (1회)
  useEffect(() => {
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
  }, []);

  function resetTurnstile() {
    setToken(null);
    if (window.turnstile && widgetIdRef.current) {
      window.turnstile.reset(widgetIdRef.current);
    }
  }

  // 근거 필수: 출처(url/text) 또는 첨부 중 최소 하나
  const hasEvidence =
    sources.some((s) => s.url.trim() || s.text.trim()) || files.length > 0;
  const canSubmit =
    status !== "running" &&
    election.trim() !== "" &&
    title.trim() !== "" &&
    hasEvidence &&
    !!token &&
    !fileError;

  function onFilesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    if (selected.length > MAX_ATTACHMENTS) {
      setFileError(`첨부는 최대 ${MAX_ATTACHMENTS}개까지 가능합니다.`);
      setFiles([]);
      return;
    }
    for (const f of selected) {
      if (!ALLOWED_MIME.includes(f.type as (typeof ALLOWED_MIME)[number])) {
        setFileError(`허용되지 않는 타입입니다: ${f.name} (${f.type || "unknown"})`);
        setFiles([]);
        return;
      }
      if (f.size > MAX_FILE_BYTES) {
        setFileError(`파일이 너무 큽니다: ${f.name} (최대 ${MAX_FILE_BYTES / 1024 / 1024}MB)`);
        setFiles([]);
        return;
      }
    }
    setFileError(null);
    setFiles(selected);
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

    setStatus("running");
    setError(null);
    setResult(null);
    setProgress(progressLabel.submitting);

    try {
      const exif = await extractExifAll(files);

      const cleanedSources: Source[] = sources
        .filter((s) => s.url.trim() || s.text.trim())
        .map((s) => ({
          ...(s.url.trim() ? { url: s.url.trim() } : {}),
          ...(s.text.trim() ? { text: s.text.trim() } : {}),
        }));

      // 자동완성에서 고른 항목이면 구조화(sido/sigungu/eup_myeon_dong)해 보낸다.
      // 매칭 없이 자유 입력한 경우엔 분해가 불가하므로 입력 텍스트를 coarse 라벨로 sido 에 담는다(임시).
      let region: Region | undefined;
      if (regionPick) {
        region = {
          ...(regionPick.sido ? { sido: regionPick.sido } : {}),
          ...(regionPick.sigungu ? { sigungu: regionPick.sigungu } : {}),
          ...(regionPick.umd ? { eup_myeon_dong: regionPick.umd } : {}),
        };
      } else if (regionText.trim()) {
        region = { sido: regionText.trim() };
      }

      const tagList = tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const input: SubmissionInput = {
        election: election.trim(),
        title: title.trim(),
        ...(summary.trim() ? { summary: summary.trim() } : {}),
        ...(body.trim() ? { body: body.trim() } : {}),
        ...(region ? { region } : {}),
        ...(toIsoOrUndefined(occurredAt) ? { occurred_at: toIsoOrUndefined(occurredAt) } : {}),
        ...(tagList.length ? { tags: tagList } : {}),
        ...(cleanedSources.length ? { sources: cleanedSources } : {}),
        // 첨부는 정본 sha256 을 서버가 계산하므로 클라는 보내지 않는다(스펙 결정).
        ...(files.length
          ? { attachments: files.map((f) => ({ filename: f.name, mime: f.type, size: f.size })) }
          : {}),
        ...(exif.length ? { exif } : {}),
        turnstile_token: token,
      };

      const finalized = await submitReport(input, files, (phase, detail) => {
        setProgress(`${progressLabel[phase]}${detail ? ` (${detail})` : ""}`);
      });

      setResult(finalized);
      setStatus("success");
      setProgress(null);
    } catch (err) {
      setError(errorMessageFor(err));
      setStatus("error");
      setProgress(null);
      // 토큰은 1회용 — 실패 시 위젯을 리셋해 재인증을 유도한다.
      resetTurnstile();
    }
  }

  if (status === "success" && result) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-6">
        <h2 className="text-lg font-semibold text-green-800">제보가 접수되었습니다</h2>
        <p className="mt-1 text-sm text-green-700">검증 큐(GitHub Issue)에 등록되었습니다.</p>
        <dl className="mt-4 space-y-2 text-sm">
          <div>
            <dt className="font-medium text-gray-700">Issue</dt>
            <dd>
              <a
                href={resolveIssueUrl(result.issue_url)}
                target="_blank"
                rel="noreferrer"
                className="break-all text-blue-600 hover:underline"
              >
                {result.issue_url}
              </a>
            </dd>
          </div>
          {result.attachments.length > 0 && (
            <div>
              <dt className="font-medium text-gray-700">첨부 ({result.attachments.length})</dt>
              <dd className="mt-1 space-y-1">
                {result.attachments.map((a) => (
                  <div key={a.r2_key} className="rounded bg-white p-2 font-mono text-xs">
                    <div className="font-sans font-medium">{a.filename}</div>
                    <div className="text-gray-500">{a.r2_key}</div>
                    <div className="text-gray-500">sha256: {a.sha256}</div>
                  </div>
                ))}
              </dd>
            </div>
          )}
        </dl>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-6 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
        >
          새 제보 작성
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
      className="space-y-6"
    >
      <div>
        <label className={labelClass} htmlFor="election">
          선거 종류 <span className="text-red-500">*</span>
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
        <label className={labelClass} htmlFor="title">
          제목 <span className="text-red-500">*</span>
        </label>
        <input
          id="title"
          className={inputClass}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="summary">
          요약
        </label>
        <input
          id="summary"
          className={inputClass}
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="body">
          내용
        </label>
        <textarea
          id="body"
          rows={5}
          className={inputClass}
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="occurred_at">
          발생일시
        </label>
        <input
          id="occurred_at"
          type="datetime-local"
          className={inputClass}
          value={occurredAt}
          onChange={(e) => setOccurredAt(e.target.value)}
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="region">
          지역 (주소 검색)
        </label>
        <RegionAutocomplete
          id="region"
          className={inputClass}
          placeholder="예: 경기 성남 분당 / 서울 종로구 청운동"
          onChange={({ text, region }) => {
            setRegionText(text);
            setRegionPick(region);
          }}
        />
        <p className="mt-1 text-xs text-gray-500">
          입력하면 자동완성됩니다. 목록에서 고르면 시도·시군구·읍면동이 채워지고, 일치하는 게 없으면 입력한 주소를 그대로 사용합니다.
        </p>
      </div>

      <div>
        <label className={labelClass} htmlFor="tags">
          태그 (쉼표로 구분)
        </label>
        <input
          id="tags"
          className={inputClass}
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="투표지부족, 사전투표"
        />
      </div>

      <fieldset className="rounded-md border border-gray-200 p-4">
        <legend className="px-1 text-sm font-medium text-gray-700">출처</legend>
        <p className="mb-3 text-xs text-gray-500">
          웹사이트 URL 또는 직접 입력 텍스트 중 하나 이상. 출처 또는 첨부 중 최소 하나는 필요합니다.
        </p>
        <div className="space-y-3">
          {sources.map((s, i) => (
            <div key={i} className="space-y-2 rounded border border-gray-100 bg-gray-50 p-3">
              <input
                className={inputClass}
                value={s.url}
                onChange={(e) => updateSource(i, { url: e.target.value })}
                placeholder="출처 URL (https://…)"
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
          className="mt-3 text-sm font-medium text-blue-600 hover:underline"
        >
          + 출처 추가
        </button>
      </fieldset>

      <div>
        <label className={labelClass} htmlFor="attachments">
          첨부 이미지 (최대 {MAX_ATTACHMENTS}개, 각 {MAX_FILE_BYTES / 1024 / 1024}MB 이하)
        </label>
        <input
          id="attachments"
          type="file"
          multiple
          accept={ALLOWED_MIME.join(",")}
          className="mt-1 block w-full text-sm text-gray-600 file:mr-4 file:rounded-md file:border-0 file:bg-gray-100 file:px-4 file:py-2 file:text-sm file:font-medium hover:file:bg-gray-200"
          onChange={onFilesChange}
        />
        {fileError && <p className="mt-1 text-sm text-red-600">{fileError}</p>}
        {files.length > 0 && (
          <p className="mt-1 text-xs text-gray-500">
            {files.length}개 선택됨 · EXIF 는 제출 시 클라이언트에서 추출됩니다.
          </p>
        )}
      </div>

      <div>
        <p className={labelClass}>봇 확인</p>
        <div ref={widgetRef} className="mt-1" />
      </div>

      {!hasEvidence && (
        <p className="text-sm text-amber-600">출처(URL/텍스트) 또는 첨부 중 최소 하나가 필요합니다.</p>
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

      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
      >
        {status === "running" ? "제출 중…" : "제보 제출"}
      </button>
    </form>
  );
}
