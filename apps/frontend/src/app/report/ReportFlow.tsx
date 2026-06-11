"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { CATEGORY_LABEL, CATEGORY_FULL, TYPE_SETS, type Category } from "@/lib/types";
import {
  ICamera,
  IPin,
  IX,
  ICheck,
  IPlus,
  IBack,
} from "@/components/mock/mock-icons";
import Torch from "@/components/landing/Torch";
import RegionAutocomplete, { type RegionEntry } from "@/components/RegionAutocomplete";
import {
  submitReport,
  ApiError,
  ALLOWED_MIME,
  MAX_FILE_BYTES,
  MAX_ATTACHMENTS,
  type SubmissionInput,
  type Source,
  type FinalizeResult,
  type ProgressPhase,
} from "@/lib/api/client";
import { loadTurnstile, TURNSTILE_SITEKEY } from "@/lib/turnstile";
import { optimizeImage } from "@/lib/image";
import { extractExifAll } from "@/lib/exif";

type Step = "onb" | "s1" | "s2" | "s3" | "done";
const CATS: Category[] = ["A", "B", "C"];

// 선거: frontend UI엔 선거 선택이 없어 기본값을 둔다(추후 선택 UI 추가 가능).
const ELECTION = process.env.NEXT_PUBLIC_ELECTION ?? "제9회 전국동시지방선거";

const PHASE_LABEL: Record<ProgressPhase, string> = {
  submitting: "제출 개시 중…",
  uploading: "첨부 업로드 중…",
  finalizing: "확정·등록 중…",
};

interface Picked {
  file: File;
  url: string;
}

export default function ReportFlow() {
  const [step, setStep] = useState<Step>("onb");
  const [camOn, setCamOn] = useState(true);
  const [locOn, setLocOn] = useState(false);

  // 폼 상태
  const [category, setCategory] = useState<Category>("A");
  const [type, setType] = useState<string>("");
  const [regionEntry, setRegionEntry] = useState<RegionEntry | null>(null);
  const [locationIndependent, setLocationIndependent] = useState(false);
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [sources, setSources] = useState<string[]>([""]);
  const [agree, setAgree] = useState(false);

  // 첨부
  const [picked, setPicked] = useState<Picked[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);

  // Turnstile / 제출
  const [token, setToken] = useState("");
  const tsRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<ProgressPhase | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<FinalizeResult | null>(null);

  const types = useMemo(() => TYPE_SETS[category], [category]);
  const progress = step === "s1" ? 40 : step === "s2" ? 65 : step === "s3" ? 90 : 0;

  const hasEvidence = sources.some((s) => s.trim()) || picked.length > 0;
  const s1Valid = !!type;
  const s2Valid = title.trim().length > 0;
  const s3Valid = agree && hasEvidence && !!token && !fileError && phase === null;

  // Turnstile 위젯: s3 진입 시 렌더
  useEffect(() => {
    if (step !== "s3" || !tsRef.current || token) return;
    let widgetId: string | undefined;
    let cancelled = false;
    loadTurnstile()
      .then((ts) => {
        if (cancelled || !tsRef.current) return;
        widgetId = ts.render(tsRef.current, {
          sitekey: TURNSTILE_SITEKEY,
          callback: (t) => setToken(t),
          "error-callback": () => setToken(""),
          "expired-callback": () => setToken(""),
        });
      })
      .catch(() => setSubmitError("보안 검증 위젯을 불러오지 못했습니다."));
    return () => {
      cancelled = true;
      if (widgetId && window.turnstile) {
        try {
          window.turnstile.remove(widgetId);
        } catch {
          /* 이미 제거됨 */
        }
      }
    };
  }, [step, token]);

  // 미리보기 URL 정리
  useEffect(() => () => picked.forEach((p) => URL.revokeObjectURL(p.url)), [picked]);

  function addFiles(list: FileList | null) {
    if (!list || list.length === 0) return;
    setFileError(null);
    const incoming = Array.from(list);
    const next: Picked[] = [];
    for (const f of incoming) {
      if (!ALLOWED_MIME.includes(f.type as (typeof ALLOWED_MIME)[number])) {
        setFileError(`허용되지 않는 형식: ${f.name} (이미지 JPG/PNG/GIF/WebP만)`);
        continue;
      }
      if (f.size > MAX_FILE_BYTES) {
        setFileError(`파일이 너무 큽니다: ${f.name} (최대 15MB)`);
        continue;
      }
      next.push({ file: f, url: URL.createObjectURL(f) });
    }
    setPicked((prev) => {
      const merged = [...prev, ...next];
      if (merged.length > MAX_ATTACHMENTS) {
        setFileError(`첨부는 최대 ${MAX_ATTACHMENTS}개까지 가능합니다.`);
        return merged.slice(0, MAX_ATTACHMENTS);
      }
      return merged;
    });
  }

  function removeFile(i: number) {
    setPicked((prev) => {
      const p = prev[i];
      if (p) URL.revokeObjectURL(p.url);
      return prev.filter((_, j) => j !== i);
    });
    setFileError(null);
  }

  async function handleSubmit() {
    if (!s3Valid) return;
    setSubmitError(null);
    try {
      // 원본에서 EXIF 추출 → 이미지 최적화(WebP) → 최적화본을 업로드/첨부 메타로 사용
      const originals = picked.map((p) => p.file);
      const exifs = await extractExifAll(originals);
      const optimized = await Promise.all(originals.map((f) => optimizeImage(f)));
      const uploadFiles = optimized.map((o) => o.optimized);

      const region =
        locationIndependent || !regionEntry
          ? undefined
          : {
              sido: regionEntry.sido,
              sigungu: regionEntry.sigungu ?? undefined,
              eup_myeon_dong: regionEntry.umd ?? undefined,
            };

      const srcList: Source[] = sources
        .map((s) => s.trim())
        .filter(Boolean)
        .map((s) => (/^https?:\/\//i.test(s) ? { url: s } : { text: s }));

      const input: SubmissionInput = {
        election: ELECTION,
        title: title.trim(),
        summary: `${CATEGORY_FULL[category]} · ${type}`,
        body: detail.trim() || undefined,
        region,
        tags: [CATEGORY_FULL[category], type].filter(Boolean),
        sources: srcList.length ? srcList : undefined,
        attachments: uploadFiles.map((f) => ({
          filename: f.name,
          mime: f.type as (typeof ALLOWED_MIME)[number],
          size: f.size,
        })),
        exif: exifs,
        consent: agree,
        turnstile_token: token,
      };

      const res = await submitReport(input, uploadFiles, (p) => setPhase(p));
      setResult(res);
      setStep("done");
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? `${err.message} (${err.phase})`
          : "제출 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";
      setSubmitError(msg);
    } finally {
      setPhase(null);
    }
  }

  function StepDots() {
    const order: Step[] = ["s1", "s2", "s3"];
    return (
      <div className="step-dots">
        {order.map((s) => (
          <i key={s} className={order.indexOf(step) >= order.indexOf(s) ? "on" : ""} />
        ))}
      </div>
    );
  }

  return (
    <div className="report-stage">
      <div className="report-card">
        {/* ── 온보딩 ── */}
        {step === "onb" && (
          <div className="body">
            <div className="onb">
              <Torch size={64} className="onb-logo" />
              <h2>현장의 증거를<br />출처와 함께</h2>
              <p>제보에는 위치와 카메라 권한이 필요합니다. 촬영 사진은 메타데이터를 보존해 검증에 사용됩니다.</p>
              <div className="perm">
                <div className="prow2">
                  <div className="pic"><ICamera size={20} /></div>
                  <div className="tx"><b>카메라</b><span>현장 사진·영상 촬영</span></div>
                  <div className={`sw${camOn ? "" : " off"}`} onClick={() => setCamOn((v) => !v)} />
                </div>
                <div className="prow2">
                  <div className="pic"><IPin size={20} /></div>
                  <div className="tx"><b>위치</b><span>제보 지점 자동 입력</span></div>
                  <div className={`sw${locOn ? "" : " off"}`} onClick={() => setLocOn((v) => !v)} />
                </div>
              </div>
            </div>
            <div className="pfoot">
              <button className="pbtn" onClick={() => setStep("s1")}>시작하기</button>
            </div>
          </div>
        )}

        {/* ── 1: 카테고리·지역·유형 ── */}
        {step === "s1" && (
          <div className="body">
            <div className="phd">
              <div className="pg"><span>작성 완성도</span><b>{progress}%</b></div>
              <div className="ppb"><i style={{ width: `${progress}%` }} /></div>
              <div className="t">제보하기</div>
              <div className="s">검토 큐로 전송됩니다</div>
            </div>
            <div className="pcontent">
              <div className="pl">카테고리</div>
              <div className="pty">
                {CATS.map((c) => (
                  <b
                    key={c}
                    className={category === c ? "on" : ""}
                    onClick={() => {
                      setCategory(c);
                      setType("");
                    }}
                  >
                    {CATEGORY_LABEL[c]}
                  </b>
                ))}
              </div>
              <div className="pl">지역</div>
              <RegionAutocomplete
                placeholder="시/군/구/동 검색 (예: 성남시 분당구)"
                disabled={locationIndependent}
                className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-[13.5px] outline-none focus:border-gray-400"
                onChange={({ region }) => setRegionEntry(region)}
              />
              <label className="mt-2 flex items-center gap-2 text-[12.5px] text-gray-500" style={{ cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={locationIndependent}
                  onChange={(e) => {
                    setLocationIndependent(e.target.checked);
                    if (e.target.checked) setRegionEntry(null);
                  }}
                />
                특정 지역과 무관한 제보입니다
              </label>
              <div className="pl">유형</div>
              <div className="pty">
                {types.map((t) => (
                  <b key={t} className={type === t ? "on" : ""} onClick={() => setType(t)}>
                    {t}
                  </b>
                ))}
              </div>
            </div>
            <div className="pfoot">
              <button className={`pbtn${s1Valid ? "" : " dis"}`} disabled={!s1Valid} onClick={() => s1Valid && setStep("s2")}>
                다음
              </button>
              <StepDots />
            </div>
          </div>
        )}

        {/* ── 2: 상세·출처 ── */}
        {step === "s2" && (
          <div className="body">
            <div className="phd bar">
              <button
                onClick={() => setStep("s1")}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "var(--g700)" }}
                aria-label="뒤로"
              >
                <IBack size={22} />
              </button>
              <div>
                <div className="pg" style={{ marginBottom: 6 }}><span>작성 완성도</span><b>{progress}%</b></div>
                <div className="ppb" style={{ width: 180, marginBottom: 0 }}><i style={{ width: `${progress}%` }} /></div>
              </div>
            </div>
            <div className="pcontent">
              <div className="pl">제목</div>
              <div className="report-input">
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="무엇을 보았는지 한 줄로"
                  maxLength={60}
                />
              </div>
              <div className="pl">상세 설명</div>
              <div className="parea">
                <textarea
                  value={detail}
                  onChange={(e) => setDetail(e.target.value.slice(0, 2000))}
                  placeholder="보이는 사실을 중립적으로 적어주세요."
                />
                <div className="cc">{detail.length} / 2000</div>
              </div>
              <div className="pl">출처</div>
              {sources.map((src, i) => (
                <div className="psr" key={i}>
                  <div className="si" style={{ padding: 0 }}>
                    <input
                      value={src}
                      onChange={(e) => setSources((arr) => arr.map((v, j) => (j === i ? e.target.value : v)))}
                      placeholder="https://… 또는 목격 내용"
                      style={{ border: "none", outline: "none", width: "100%", height: "100%", padding: "0 14px", fontFamily: "var(--font)", fontSize: "13.5px", color: "var(--g900)", borderRadius: 12 }}
                    />
                  </div>
                  <div
                    className="sx"
                    style={{ cursor: "pointer" }}
                    onClick={() => setSources((arr) => (arr.length > 1 ? arr.filter((_, j) => j !== i) : [""]))}
                  >
                    <IX size={14} />
                  </div>
                </div>
              ))}
              <div className="padd" style={{ cursor: "pointer" }} onClick={() => setSources((arr) => [...arr, ""])}>
                <IPlus size={13} />출처 추가
              </div>
            </div>
            <div className="pfoot">
              <button className={`pbtn${s2Valid ? "" : " dis"}`} disabled={!s2Valid} onClick={() => s2Valid && setStep("s3")}>
                다음
              </button>
              <StepDots />
            </div>
          </div>
        )}

        {/* ── 3: 첨부·검증·동의 ── */}
        {step === "s3" && (
          <div className="body">
            <div className="phd bar">
              <button
                onClick={() => setStep("s2")}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "var(--g700)" }}
                aria-label="뒤로"
              >
                <IBack size={22} />
              </button>
              <div>
                <div className="pg" style={{ marginBottom: 6 }}><span>작성 완성도</span><b>{progress}%</b></div>
                <div className="ppb" style={{ width: 180, marginBottom: 0 }}><i style={{ width: `${progress}%` }} /></div>
              </div>
            </div>
            <div className="pcontent">
              <div className="pl">첨부 자료</div>
              <label
                className="pup"
                style={{ cursor: "pointer", display: "block" }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  addFiles(e.dataTransfer.files);
                }}
              >
                <div className="ic"><ICamera size={22} /></div>
                <p>사진 촬영·선택 또는 드래그&드롭</p>
                <div className="sub">JPG·PNG·GIF·WebP · 최대 15MB · {MAX_ATTACHMENTS}개</div>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  multiple
                  hidden
                  onChange={(e) => addFiles(e.target.files)}
                />
              </label>

              {picked.length > 0 && (
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {picked.map((p, i) => (
                    <div key={p.url} className="relative overflow-hidden rounded-lg border border-gray-200">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.url} alt={p.file.name} className="h-20 w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeFile(i)}
                        className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white"
                        aria-label="첨부 제거"
                      >
                        <IX size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {fileError && <div className="mt-2 text-[12.5px] text-red-600">{fileError}</div>}

              <div className="popt">메타데이터(EXIF) 보존 추출 · 원본은 검증용으로만 저장</div>

              <div
                className="pck"
                style={{ cursor: "pointer", borderColor: agree ? "var(--red-line)" : undefined }}
                onClick={() => setAgree((v) => !v)}
              >
                <div className="b" style={{ background: agree ? "var(--red)" : "var(--g300)" }}>
                  {agree && <ICheck size={13} strokeWidth={3} />}
                </div>
                <p>
                  <b style={{ color: "var(--g900)" }}>익명 제보·공개 동의</b> 실명·연락처는 저장하지 않습니다.
                </p>
              </div>

              {/* 보안 검증 위젯 */}
              <div ref={tsRef} className="mt-3" />
              {!hasEvidence && (
                <div className="mt-2 text-[12.5px] text-gray-500">출처(URL·내용) 또는 첨부 중 최소 하나가 필요합니다.</div>
              )}
              {submitError && <div className="mt-2 text-[12.5px] text-red-600">{submitError}</div>}
            </div>
            <div className="pfoot">
              <button
                className={`pbtn${s3Valid ? "" : " dis"}`}
                disabled={!s3Valid}
                onClick={handleSubmit}
              >
                {phase ? PHASE_LABEL[phase] : "제보 보내기"}
              </button>
              <StepDots />
            </div>
          </div>
        )}

        {/* ── 완료 ── */}
        {step === "done" && (
          <div className="body">
            <div className="psuc">
              <div className="sc"><ICheck size={38} /></div>
              <h4>제보가 접수되었습니다</h4>
              <p>검토 큐에 등록되었습니다. 사람이 출처를 대조한 뒤 공개 여부가 결정됩니다.</p>
              {result && <span className="ref">접수번호 {result.report_id}</span>}
              <div className="pp">
                <b style={{ color: "var(--g700)" }}>이후 처리</b><br />
                1. R2 업로드 · SHA-256 봉인<br />
                2. 검토 큐 등록<br />
                3. 검증 후 공개 반영
              </div>
            </div>
            <div className="pfoot">
              <Link href="/archive" className="pbtn ghost" style={{ textDecoration: "none" }}>
                아카이브 둘러보기
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
