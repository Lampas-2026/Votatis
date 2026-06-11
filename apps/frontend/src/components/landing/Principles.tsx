import Reveal from "./Reveal";

const ITEMS = [
  { k: "01", t: "검증 우선", p: "미검증과 사실확인을 절대 같은 무게로 두지 않습니다.", tag: "6단계 라벨" },
  { k: "02", t: "출처 추적", p: "출처가 없으면 등록되지 않습니다.", tag: "필수 출처 ≥1" },
  { k: "03", t: "무결성 증명", p: "첨부는 해시로 봉인해 변조를 확인합니다.", tag: "SHA-256" },
  { k: "04", t: "중립 서술", p: "단정하지 않고 라벨로 표현합니다.", tag: "판단 분리" },
  { k: "05", t: "개방 기여", p: "포맷과 절차를 모두 공개합니다.", tag: "오픈소스" },
  { k: "06", t: "최소 노출", p: "개인정보를 최소화하고 삭제 경로를 둡니다.", tag: "익명 기본" },
];

export default function Principles() {
  return (
    <section className="sec" id="principles">
      <div className="wrap">
        <Reveal style={{ marginBottom: 48 }}>
          <p className="eyebrow">설계 원칙</p>
          <h2>
            기술이 아니라,
            <br />
            신뢰도를 우선합니다.
          </h2>
        </Reveal>
        <Reveal className="prinlist">
          {ITEMS.map(({ k, t, p, tag }) => (
            <div className="prow2x" key={k}>
              <span className="pk">{k}</span>
              <div className="pbody">
                <div className="pt2">
                  <h4>{t}</h4>
                  <span className="ptag">{tag}</span>
                </div>
                <p>{p}</p>
              </div>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
