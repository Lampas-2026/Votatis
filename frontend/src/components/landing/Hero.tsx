import Link from "next/link";
import Reveal from "./Reveal";
import { Lock, Grid, Search, Pin, Chart } from "./icons";
import Torch from "./Torch";

export default function Hero() {
  return (
    <section className="hero">
      <div className="wrap">
        <span className="tag">
          <span className="dot" />
          시민 주도 · 오픈소스 시빅테크
        </span>
        <h1>
          흩어진 증거를
          <br />
          <span className="b">사라지지 않게.</span>
        </h1>
        <p className="lead">
          선거 현장의 제보를 출처와 함께 모으고, 사람이 검증한 결과만 공개
          아카이브로 남깁니다.
        </p>
        <p className="micro">
          접수된 제보는 사실이 아니라 검증 대상인 주장으로 다뤄집니다. 모든
          기록에는 검증 상태가 함께 표시되고, 반박된 내용도 그대로 남습니다.
        </p>
        <div className="hero-cta">
          <Link className="btn btn-primary btn-lg" href="/report">
            제보 보내기
          </Link>
          <a className="btn btn-soft btn-lg" href="#archive">
            아카이브 둘러보기
          </a>
        </div>
      </div>

      <div className="wrap hero-stage">
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
                votatis.kr/archive
              </div>
            </div>
            <div className="browser-body">
              <div className="dash">
                <aside className="dash-side">
                  <div className="side-logo">
                    <Torch size={24} />
                    Votatis
                  </div>
                  <div className="side-sec">아카이브</div>
                  <div className="side-item on">
                    <Grid />
                    전체 기록<span className="cnt">318</span>
                  </div>
                  <div className="side-item">
                    <Search />
                    검색
                  </div>
                  <div className="side-item">
                    <Pin />
                    지도
                  </div>
                  <div className="side-item">
                    <Chart />
                    통계
                  </div>
                  <div className="side-sec">검증 상태</div>
                  <div className="side-stat">
                    <span className="sw" style={{ background: "var(--red)" }} />
                    사실확인<span className="cnt">112</span>
                  </div>
                  <div className="side-stat">
                    <span
                      className="sw"
                      style={{ background: "var(--red-300)" }}
                    />
                    검토중<span className="cnt">64</span>
                  </div>
                  <div className="side-stat">
                    <span className="sw" style={{ background: "var(--g300)" }} />
                    미검증<span className="cnt">51</span>
                  </div>
                  <div className="side-stat">
                    <span className="sw" style={{ background: "var(--g900)" }} />
                    반박됨<span className="cnt">35</span>
                  </div>
                </aside>

                <div className="dash-main">
                  <div className="dm-head">
                    <div>
                      <h3>전체 기록</h3>
                      <div className="sub">
                        제9회 전국동시지방선거 · 318건
                      </div>
                    </div>
                    <div className="dm-tools">
                      <div className="dm-search">
                        <Search size={13} />
                        검색
                      </div>
                      <div className="seg">
                        <b className="on">전체</b>
                        <b>최신</b>
                        <b>지역</b>
                      </div>
                    </div>
                  </div>

                  <div className="tiles">
                    <div className="tile">
                      <div className="tl">
                        <span className="pt pt-g" />수집
                      </div>
                      <div className="tv">318</div>
                      <div className="td dn">전체 제보</div>
                    </div>
                    <div className="tile">
                      <div className="tl">
                        <span className="pt pt-rl" />검토중
                      </div>
                      <div className="tv">64</div>
                      <div className="td up">▲ 12 오늘</div>
                    </div>
                    <div className="tile">
                      <div className="tl">
                        <span className="pt pt-red" />사실확인
                      </div>
                      <div className="tv">112</div>
                      <div className="td up">검증 완료</div>
                    </div>
                    <div className="tile">
                      <div className="tl">
                        <span className="pt pt-dk" />반박·정정
                      </div>
                      <div className="tv">63</div>
                      <div className="td dn">기록 보존</div>
                    </div>
                  </div>

                  <div className="prow">
                    <div className="panel">
                      <div className="ph">
                        최근 기록 <span className="more">전체 보기</span>
                      </div>
                      <table className="tbl">
                        <thead>
                          <tr>
                            <th>제보</th>
                            <th>지역</th>
                            <th>검증</th>
                            <th>검토자</th>
                            <th>시각</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="nm">투표지 수량 보고 정정 확인</td>
                            <td className="mut">성남 분당</td>
                            <td>
                              <span className="chip c-cnf">
                                <span className="pt" />사실확인
                              </span>
                            </td>
                            <td>
                              <span className="av">A1</span>
                            </td>
                            <td className="mut">2h</td>
                          </tr>
                          <tr>
                            <td className="nm">사전투표함 봉인 스티커 훼손</td>
                            <td className="mut">성남 분당</td>
                            <td>
                              <span className="chip c-rev">
                                <span className="pt" />검토중
                              </span>
                            </td>
                            <td>
                              <span className="av">B2</span>
                            </td>
                            <td className="mut">5h</td>
                          </tr>
                          <tr>
                            <td className="nm">사전투표 용지 부족 주장</td>
                            <td className="mut">인천 연수</td>
                            <td>
                              <span className="chip c-deb">
                                <span className="pt" />반박됨
                              </span>
                            </td>
                            <td>
                              <span className="av">A1</span>
                            </td>
                            <td className="mut">1d</td>
                          </tr>
                          <tr>
                            <td className="nm">참관인 퇴장 요구 주장</td>
                            <td className="mut">광주 북구</td>
                            <td>
                              <span className="chip c-dis">
                                <span className="pt" />이견있음
                              </span>
                            </td>
                            <td>
                              <span className="av">C3</span>
                            </td>
                            <td className="mut">1d</td>
                          </tr>
                          <tr>
                            <td className="nm">분류기 일시 정지 보고</td>
                            <td className="mut">포항 남구</td>
                            <td>
                              <span className="chip c-cnf">
                                <span className="pt" />사실확인
                              </span>
                            </td>
                            <td>
                              <span className="av">B2</span>
                            </td>
                            <td className="mut">2d</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div className="panel">
                      <div className="ph">검증 상태 분포</div>
                      <div className="donut-wrap">
                        <div className="donut">
                          <div className="center">
                            <b>318</b>
                            <span>전체 기록</span>
                          </div>
                        </div>
                        <div className="legend">
                          <div className="leg">
                            <span
                              className="sw"
                              style={{ background: "var(--red)" }}
                            />
                            사실확인<span className="vv">112</span>
                          </div>
                          <div className="leg">
                            <span
                              className="sw"
                              style={{ background: "var(--red-300)" }}
                            />
                            검토중<span className="vv">64</span>
                          </div>
                          <div className="leg">
                            <span
                              className="sw"
                              style={{ background: "var(--g300)" }}
                            />
                            미검증<span className="vv">51</span>
                          </div>
                          <div className="leg">
                            <span
                              className="sw"
                              style={{ background: "var(--g900)" }}
                            />
                            반박됨<span className="vv">35</span>
                          </div>
                          <div className="leg">
                            <span
                              className="sw"
                              style={{ background: "var(--g500)" }}
                            />
                            이견있음<span className="vv">28</span>
                          </div>
                          <div className="leg">
                            <span
                              className="sw"
                              style={{ background: "var(--g400)" }}
                            />
                            정정됨<span className="vv">28</span>
                          </div>
                        </div>
                        <div className="rate">
                          <div className="rl">
                            <span>검증 처리율</span>
                            <b>65%</b>
                          </div>
                          <div className="track">
                            <i style={{ width: "65%" }} />
                          </div>
                        </div>
                      </div>
                    </div>
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
