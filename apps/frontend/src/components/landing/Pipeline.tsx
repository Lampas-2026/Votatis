import Reveal from "./Reveal";
import { DeviceFrame } from "@/components/mock/frames";
import {
  MockReport1,
  MockReport3,
  MockSuccess,
  MockAppDetail,
  MockAppList,
} from "@/components/mock/app-screens";

const STEPS = [
  { n: "01", h: "제보 접수", p: "위치·유형·출처·자료를 입력합니다.", Screen: MockReport1 },
  { n: "02", h: "수집·봉인", p: "R2에 올리고 해시로 봉인합니다.", Screen: MockReport3 },
  { n: "03", h: "검토 큐", p: "정규화 포맷으로 등록됩니다.", Screen: MockAppList },
  { n: "04", h: "검증", p: "사람이 원본을 대조해 판정합니다.", Screen: MockAppDetail },
  { n: "05", h: "공개", p: "통과 데이터만 반영됩니다.", Screen: MockSuccess },
];

export default function Pipeline() {
  return (
    <section className="sec gray sec-center">
      <div className="wrap">
        <Reveal style={{ maxWidth: "48ch", margin: "0 auto 52px" }}>
          <p className="eyebrow">검증 절차</p>
          <h2>
            제보부터 공개까지,
            <br />
            하나의 흐름.
          </h2>
        </Reveal>
        <Reveal className="flow">
          {STEPS.map(({ n, h, p, Screen }, i) => (
            <div className="fstep" key={n}>
              <div className="fphone">
                <DeviceFrame>
                  <Screen />
                </DeviceFrame>
              </div>
              <div className="fmeta">
                <span className="fn">{n}</span>
                <h4>{h}</h4>
                <p>{p}</p>
              </div>
              {i < STEPS.length - 1 && <span className="farrow" aria-hidden>→</span>}
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
