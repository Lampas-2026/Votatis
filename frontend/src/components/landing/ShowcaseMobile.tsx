import Reveal from "./Reveal";
import { Check } from "./icons";
import { DeviceFrame } from "@/components/mock/frames";
import { MockReport3 } from "@/components/mock/app-screens";

export default function ShowcaseMobile() {
  return (
    <section className="sec gray" id="report">
      <div className="wrap showcase">
        <Reveal className="copy">
          <p className="eyebrow">모바일 제보</p>
          <h2>
            현장에서
            <br />
            바로 남기세요.
          </h2>
          <p className="desc">
            위치와 유형을 고르고 사진을 올리면 끝입니다.
            <br />
            촬영 위치·시각 정보는 보존된 채 안전하게 업로드되고,
            <br />
            출처가 함께 기록됩니다.
          </p>
          <div className="feat">
            <div className="fi">
              <span className="ic">
                <Check size={14} />
              </span>
              <p>
                카메라로 <b>바로 촬영</b>해 제보할 수 있습니다.
              </p>
            </div>
            <div className="fi">
              <span className="ic">
                <Check size={14} />
              </span>
              <p>
                메타데이터를 확인하고 <b>1회용 보안 링크</b>로
                <br />
                직접 업로드합니다.
              </p>
            </div>
            <div className="fi">
              <span className="ic">
                <Check size={14} />
              </span>
              <p>
                실명·연락처는 <b>저장하지 않습니다.</b>
              </p>
            </div>
          </div>
        </Reveal>

        <Reveal>
          <div className="phone-stage">
            <DeviceFrame>
              <MockReport3 />
            </DeviceFrame>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
