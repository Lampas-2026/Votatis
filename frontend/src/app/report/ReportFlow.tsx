"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CATEGORY_LABEL, TYPE_SETS, type Category } from "@/lib/types";
import {
  ICamera,
  IPin,
  IX,
  IImage,
  ICheck,
  IPlus,
  IBack,
} from "@/components/mock/mock-icons";
import Torch from "@/components/landing/Torch";

type Step = "onb" | "s1" | "s2" | "s3" | "done";
const CATS: Category[] = ["A", "B", "C"];

export default function ReportFlow() {
  const [step, setStep] = useState<Step>("onb");
  const [camOn, setCamOn] = useState(true);
  const [locOn, setLocOn] = useState(false);

  // 폼 상태
  const [category, setCategory] = useState<Category>("A");
  const [type, setType] = useState<string>("");
  const [location] = useState("위치 권한 허용 시 자동 입력");
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [sources, setSources] = useState<string[]>([""]);
  const [agree, setAgree] = useState(false);

  const types = useMemo(() => TYPE_SETS[category], [category]);

  // 진행률
  const progress =
    step === "s1" ? 40 : step === "s2" ? 65 : step === "s3" ? 90 : 0;

  const s1Valid = !!type;
  const s2Valid = title.trim().length > 0;
  const s3Valid = agree;

  function StepDots() {
    const order: Step[] = ["s1", "s2", "s3"];
    return (
      <div className="step-dots">
        {order.map((s) => (
          <i key={s} className={order.indexOf(step as Step) >= order.indexOf(s) ? "on" : ""} />
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

        {/* ── 1: 카테고리·위치·유형 ── */}
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
                      setType(""); // 카테고리 변경 시 유형 초기화
                    }}
                  >
                    {CATEGORY_LABEL[c]}
                  </b>
                ))}
              </div>
              <div className="pl">위치</div>
              <div className={`pi${locOn ? " fill" : ""}`}>
                <IPin size={16} />
                {locOn ? "현재 위치 확인 중…" : location}
              </div>
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
                      placeholder="https://… 또는 촬영 첨부"
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

        {/* ── 3: 첨부·동의 ── */}
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
              <label className="pup" style={{ cursor: "pointer", display: "block" }}>
                <div className="ic"><ICamera size={22} /></div>
                <p>카메라로 촬영 · 사진 선택</p>
                <div className="sub">JPG·PNG·MP4 · 최대 50MB · 5개</div>
                {/* TODO: 파일 업로드 핸들러 + 메타데이터(EXIF) 점검 */}
                <input type="file" accept="image/*,video/mp4" multiple hidden />
              </label>
              <div className="popt">메타데이터 보존 업로드 · 공개 시 민감 정보 자동 마스킹</div>
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
            </div>
            <div className="pfoot">
              <button
                className={`pbtn${s3Valid ? "" : " dis"}`}
                disabled={!s3Valid}
                onClick={() => s3Valid && setStep("done")}
                /* TODO: POST /api/reports {category,type,title,detail,sources} → R2 업로드·해시 봉인 */
              >
                제보 보내기
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
              <span className="ref">접수번호 local9-2026-{Math.floor(1000 + title.length * 37 + detail.length).toString().slice(0, 4)}</span>
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
