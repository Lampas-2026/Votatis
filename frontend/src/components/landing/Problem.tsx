import Reveal from "./Reveal";

export default function Problem() {
  return (
    <section className="sec sec-center">
      <div className="wrap narrow">
        <Reveal>
          <p className="eyebrow">왜 만드나</p>
          <h2>
            신뢰를 무너뜨리는 건 의혹이 아니라,
            <br />
            정리되지 않은 정보입니다.
          </h2>
          <p className="desc">
            제보가 메신저와 SNS에 흩어지면 원본은 사라지고, 주장과 사실이 같은
            무게로 떠돕니다.
          </p>
        </Reveal>
        <Reveal style={{ marginTop: 56 }}>
          <div className="bignum bignum-center">
            <div className="bn">
              <div className="v">72시간</div>
              <h4>증거의 수명</h4>
              <p>현장 자료 다수가 며칠 안에 삭제되거나 원본을 찾을 수 없게 됩니다.</p>
            </div>
            <div className="bn">
              <div className="v red">출처 0</div>
              <h4>검증 불가</h4>
              <p>출처가 없는 정보는 사후에 확인할 수도, 반박할 수도 없습니다.</p>
            </div>
            <div className="bn">
              <div className="v dk">같은 무게</div>
              <h4>뒤섞인 진실</h4>
              <p>사실, 단순 주장, 이미 반박된 내용이 구분 없이 함께 퍼집니다.</p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
