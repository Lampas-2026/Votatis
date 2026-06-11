import Reveal from "./Reveal";
import { Lock, Check, Link as LinkIcon, Shield } from "./icons";

export default function ShowcaseArchive() {
  return (
    <section className="sec gray" id="archive">
      <div className="wrap showcase">
        <Reveal className="copy">
          <p className="eyebrow">공개 아카이브</p>
          <h2>
            무엇이 사실이고
            <br />
            무엇이 아닌지,
            <br />
            한눈에.
          </h2>
          <p className="desc">
            모든 기록은 검증 상태 라벨과 함께 공개됩니다. 출처, 무결성 해시, 반론,
            검증 이력까지 레코드 한 건에 그대로 담깁니다.
          </p>
          <div className="feat">
            <div className="fi">
              <span className="ic">
                <Check size={14} />
              </span>
              <p>
                <b>여섯 단계 검증 상태</b>로 사실과 주장을 분리합니다.
              </p>
            </div>
            <div className="fi">
              <span className="ic">
                <Check size={14} />
              </span>
              <p>
                반론과 정정 이력을 <b>같은 페이지에</b> 함께 보존합니다.
              </p>
            </div>
            <div className="fi">
              <span className="ic">
                <Check size={14} />
              </span>
              <p>
                출처 링크와 <b>SHA-256 해시</b>로 누구나 무결성을 검증합니다.
              </p>
            </div>
          </div>
        </Reveal>

        <Reveal>
          <div className="browser">
            <div className="browser-bar">
              <div className="dots">
                <i />
                <i />
                <i />
              </div>
              <div className="url">
                <Lock size={13} />
                votatis.kr/archive/local9-2026-0042
              </div>
            </div>
            <div
              className="browser-body"
              style={{ padding: "22px 24px", background: "var(--g50)" }}
            >
              <div
                style={{
                  background: "#fff",
                  border: "1px solid var(--g200)",
                  borderRadius: 16,
                  padding: "22px 24px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 13,
                  }}
                >
                  <span
                    className="chip c-cnf"
                    style={{ fontSize: "11.5px", padding: "4px 11px" }}
                  >
                    <span className="pt" />
                    사실확인 · confirmed
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--mono)",
                      fontSize: "11.5px",
                      color: "var(--g400)",
                    }}
                  >
                    local9-2026-0042
                  </span>
                </div>
                <h3
                  style={{
                    fontSize: 18,
                    fontWeight: 800,
                    letterSpacing: "-0.03em",
                    lineHeight: 1.4,
                    marginBottom: 8,
                  }}
                >
                  OO 개표소 투표지 수량 보고 정정 사실 확인
                </h3>
                <p
                  style={{
                    fontSize: 13,
                    color: "var(--g600)",
                    lineHeight: 1.6,
                    marginBottom: 16,
                  }}
                >
                  1차 집계 보고 수치가 이후 정정 공지로 수정된 사실이 확인됨. 수치
                  자체의 적정성은 별도 판단 대상.
                </p>
                <div
                  style={{
                    display: "flex",
                    gap: 7,
                    flexWrap: "wrap",
                    marginBottom: 16,
                  }}
                >
                  {["제9회 지방선거", "경기 성남 분당구", "2026.06.03"].map(
                    (t) => (
                      <span
                        key={t}
                        style={{
                          fontSize: "11.5px",
                          color: "var(--g600)",
                          background: "var(--g100)",
                          padding: "5px 10px",
                          borderRadius: 8,
                          fontWeight: 600,
                        }}
                      >
                        {t}
                      </span>
                    )
                  )}
                </div>
                <div
                  className="rec-2col"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 14,
                    borderTop: "1px solid var(--g100)",
                    paddingTop: 15,
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: "10.5px",
                        fontWeight: 800,
                        color: "var(--g400)",
                        letterSpacing: "0.05em",
                        marginBottom: 9,
                      }}
                    >
                      출처 · 교차확인
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 7,
                        fontSize: 12,
                        color: "var(--g700)",
                        fontWeight: 600,
                        marginBottom: 6,
                      }}
                    >
                      <LinkIcon size={13} style={{ color: "var(--red)" }} />
                      중앙선관위 정정 공지
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 7,
                        fontSize: 12,
                        color: "var(--g700)",
                        fontWeight: 600,
                      }}
                    >
                      <LinkIcon size={13} style={{ color: "var(--red)" }} />
                      현장 영상 원본 대조
                    </div>
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: "10.5px",
                        fontWeight: 800,
                        color: "var(--g400)",
                        letterSpacing: "0.05em",
                        marginBottom: 9,
                      }}
                    >
                      반론
                    </div>
                    <p
                      style={{
                        fontSize: 12,
                        color: "var(--g600)",
                        lineHeight: 1.5,
                      }}
                    >
                      선관위는 정정 후 수치가 최종 집계와 일치한다고 발표.
                    </p>
                  </div>
                </div>
                <div
                  style={{
                    marginTop: 15,
                    fontFamily: "var(--mono)",
                    fontSize: 11,
                    color: "var(--g500)",
                    background: "var(--g50)",
                    border: "1px solid var(--g200)",
                    borderRadius: 9,
                    padding: "9px 11px",
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                  }}
                >
                  <Shield size={13} style={{ color: "var(--red)" }} />
                  sha256 · 9f86d0818a4b9bf1c2e4d7a3…2c4e7d
                </div>
                <div
                  style={{
                    marginTop: 14,
                    borderTop: "1px solid var(--g100)",
                    paddingTop: 13,
                  }}
                >
                  <div
                    style={{
                      fontSize: "10.5px",
                      fontWeight: 800,
                      color: "var(--g400)",
                      letterSpacing: "0.05em",
                      marginBottom: 9,
                    }}
                  >
                    검증 이력
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 9,
                      fontSize: "11.5px",
                      color: "var(--g600)",
                      marginBottom: 6,
                    }}
                  >
                    <span
                      className="av"
                      style={{ width: 20, height: 20, fontSize: 9 }}
                    >
                      A1
                    </span>
                    검토 시작 · 원본 영상 확보
                    <span style={{ marginLeft: "auto", color: "var(--g400)" }}>
                      06.03
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 9,
                      fontSize: "11.5px",
                      color: "var(--g600)",
                    }}
                  >
                    <span
                      className="av"
                      style={{
                        width: 20,
                        height: 20,
                        fontSize: 9,
                        background: "var(--red-bg)",
                        color: "var(--red-strong)",
                      }}
                    >
                      A1
                    </span>
                    사실확인 승격 · 선관위 공지 교차확인
                    <span style={{ marginLeft: "auto", color: "var(--g400)" }}>
                      06.04
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
