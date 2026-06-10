import Reveal from "./Reveal";
import { Lock, CheckSquare, Chart, List, Gear, Check, Image as ImageIcon, X } from "./icons";
import Torch from "./Torch";

export default function ShowcaseAdmin() {
  return (
    <section className="sec" id="admin">
      <div className="wrap showcase flip">
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
                admin.votatis.kr/queue
              </div>
            </div>
            <div className="browser-body">
              <div className="dash">
                <aside className="dash-side">
                  <div className="side-logo">
                    <Torch size={24} />
                    관리자
                  </div>
                  <div className="side-sec">검증</div>
                  <div className="side-item on">
                    <CheckSquare />
                    검토 큐<span className="cnt">64</span>
                  </div>
                  <div className="side-item">
                    <Chart />
                    통계
                  </div>
                  <div className="side-item">
                    <List />
                    레코드
                  </div>
                  <div className="side-item">
                    <Gear />
                    설정
                  </div>
                </aside>

                <div className="dash-main">
                  <div className="dm-head">
                    <div>
                      <h3>검토 큐</h3>
                      <div className="sub">검증 대기 64건 · 담당 검토자 3명</div>
                    </div>
                    <div className="seg">
                      <b className="on">대기</b>
                      <b>보완</b>
                      <b>완료</b>
                    </div>
                  </div>

                  <div className="tiles">
                    <div className="tile">
                      <div className="tl">
                        <span className="pt pt-rl" />대기
                      </div>
                      <div className="tv">64</div>
                      <div className="td dn">검증 전</div>
                    </div>
                    <div className="tile">
                      <div className="tl">
                        <span className="pt pt-red" />오늘 승인
                      </div>
                      <div className="tv">12</div>
                      <div className="td up">▲ 처리</div>
                    </div>
                    <div className="tile">
                      <div className="tl">
                        <span className="pt pt-g" />평균 검토
                      </div>
                      <div className="tv">
                        3.2<span style={{ fontSize: 13 }}>h</span>
                      </div>
                      <div className="td dn">소요</div>
                    </div>
                    <div className="tile">
                      <div className="tl">
                        <span className="pt pt-dk" />반박률
                      </div>
                      <div className="tv">
                        11<span style={{ fontSize: 13 }}>%</span>
                      </div>
                      <div className="td dn">누적</div>
                    </div>
                  </div>

                  <div className="prow prow-admin">
                    <div className="panel">
                      <div className="ph">
                        대기 항목 <span className="more">우선순위순</span>
                      </div>
                      <table className="tbl">
                        <thead>
                          <tr>
                            <th>제보</th>
                            <th>유형</th>
                            <th>출처</th>
                            <th>상태</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr style={{ background: "var(--red-bg)" }}>
                            <td className="nm">사전투표함 봉인 스티커 훼손</td>
                            <td className="mut">봉인</td>
                            <td className="mut">2</td>
                            <td>
                              <span className="chip c-rev">
                                <span className="pt" />검토중
                              </span>
                            </td>
                          </tr>
                          <tr>
                            <td className="nm">투표지 인쇄 상태 이상 이미지</td>
                            <td className="mut">훼손</td>
                            <td className="mut">1</td>
                            <td>
                              <span className="chip c-unv">
                                <span className="pt" />미검증
                              </span>
                            </td>
                          </tr>
                          <tr>
                            <td className="nm">분류기 일시 정지 보고</td>
                            <td className="mut">지연</td>
                            <td className="mut">2</td>
                            <td>
                              <span className="chip c-rev">
                                <span className="pt" />검토중
                              </span>
                            </td>
                          </tr>
                          <tr>
                            <td className="nm">CCTV 사각지대 주장 영상</td>
                            <td className="mut">기타</td>
                            <td className="mut">1</td>
                            <td>
                              <span className="chip c-unv">
                                <span className="pt" />미검증
                              </span>
                            </td>
                          </tr>
                          <tr>
                            <td className="nm">참관인 퇴장 요구 주장</td>
                            <td className="mut">기타</td>
                            <td className="mut">3</td>
                            <td>
                              <span className="chip c-unv">
                                <span className="pt" />미검증
                              </span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div
                      className="panel"
                      style={{ display: "flex", flexDirection: "column" }}
                    >
                      <div className="ph">검증 패널</div>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 800,
                          marginBottom: 5,
                          letterSpacing: "-0.02em",
                        }}
                      >
                        사전투표함 봉인 스티커 훼손
                      </div>
                      <p
                        style={{
                          fontSize: "11.5px",
                          color: "var(--g600)",
                          lineHeight: 1.5,
                          marginBottom: 12,
                        }}
                      >
                        봉인 스티커 일부가 떨어진 상태로 보였다는 제보. 원본 사진
                        대조 진행중.
                      </p>
                      <div className="ev-thumbs">
                        <div className="et">
                          <ImageIcon size={18} />
                          <span className="tg">EXIF</span>
                        </div>
                        <div className="et">
                          <ImageIcon size={18} />
                          <span className="tg">EXIF</span>
                        </div>
                      </div>
                      <div className="kv">
                        <b>검증 방법</b> 원본 대조, 봉인 절차 공지 확인
                      </div>
                      <div className="kv" style={{ marginBottom: 13 }}>
                        <b>근거</b> 선관위 봉인 절차 공지 · 제보 첨부 2건
                      </div>
                      <div className="act">
                        <div className="a1">승인</div>
                        <div className="a2">보완</div>
                        <div className="a3">
                          <X size={15} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal className="copy">
          <p className="eyebrow">검증 시스템</p>
          <h2>
            수집은 자동으로,
            <br />
            판단은 사람이.
          </h2>
          <p className="desc">
            수집 단계는 아무것도 판단하지 않습니다. 검토 큐에서 사람이 원본과 선관위
            공지를 대조해 상태를 부여하고, 통과한 데이터만 공개됩니다.
          </p>
          <div className="feat">
            <div className="fi">
              <span className="ic">
                <Check size={14} />
              </span>
              <p>
                승인 · 보완 · 거절을 <b>근거 링크와 함께</b> 기록합니다.
              </p>
            </div>
            <div className="fi">
              <span className="ic">
                <Check size={14} />
              </span>
              <p>
                처리 시간 · 반박률 등 <b>운영 지표</b>를 함께 추적합니다.
              </p>
            </div>
            <div className="fi">
              <span className="ic">
                <Check size={14} />
              </span>
              <p>
                모든 검증 이력은 <b>공개 저장소</b>에 그대로 남습니다.
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
