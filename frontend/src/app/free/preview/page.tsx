import "../../app-shell.css";
import "../mock.css";
import Link from "next/link";
import { SCREENS } from "@/components/mock/registry";
import { ScreenCap, PhoneCap, Notes } from "@/components/mock/frames";

export const metadata = { title: "화면 미리보기 — Votatis" };

const GROUPS = [
  { key: "public", gx: "01", h: "웹 · 공개 (누구나 열람)" },
  { key: "admin", gx: "02", h: "웹 · 관리자 콘솔 (인증 필요)" },
  { key: "entry", gx: "03", h: "앱 · 진입·제보 플로우" },
  { key: "browse", gx: "04", h: "앱 · 열람·검색" },
] as const;

export default function PreviewPage() {
  return (
    <div className="mock-canvas">
      <nav className="preview-nav">
        <div className="inner">
          <Link href="/" style={{ fontWeight: 800, color: "var(--g900)" }}>
            ← Votatis
          </Link>
          {GROUPS.map((g) => (
            <a key={g.key} href={`#${g.key}`}>
              {g.h.split(" · ")[1] ?? g.h}
            </a>
          ))}
        </div>
      </nav>

      <div className="board">
        <div className="doc-head">
          <div className="ttl">
            <div className="mark">V</div>
            <div>
              <h1>Votatis · 화면 미리보기</h1>
              <p>공개 아카이브 · 관리자 콘솔 · 앱 제보 — mock 데이터 채운 완성 화면</p>
            </div>
          </div>
          <div className="doc-meta">
            <div>
              버전<b>v1.0</b>
            </div>
            <div>
              화면<b>{SCREENS.length}</b>
            </div>
            <div>
              카테고리<b>A 선거 / B 집회 / C 공익</b>
            </div>
          </div>
        </div>

        {GROUPS.map((g) => {
          const items = SCREENS.filter((s) => s.group === g.key);
          const isApp = g.key === "entry" || g.key === "browse";
          return (
            <section key={g.key} id={g.key}>
              <div className="group">
                <span className="gx">{g.gx}</span>
                <h2>{g.h}</h2>
                <div className="ln" />
              </div>

              {isApp ? (
                <div className="appgrid">
                  {items.map((s) => (
                    <div className="pu" key={s.slug}>
                      <PhoneCap step={s.meta} name={s.name} tag={s.tag} />
                      {s.render()}
                      <Notes items={s.notes} />
                    </div>
                  ))}
                </div>
              ) : (
                items.map((s) => (
                  <div className="swrap" key={s.slug}>
                    <ScreenCap
                      name={s.name}
                      tags={[
                        { label: s.meta },
                        ...(s.tag ? [{ label: s.tag }] : []),
                        { label: "개별 화면 ↗", href: `/free/mock/${s.slug}` },
                        ...(s.realPath ? [{ label: "실동작 ↗", href: s.realPath }] : []),
                      ]}
                    />
                    {s.render()}
                    <Notes items={s.notes} />
                  </div>
                ))
              )}
            </section>
          );
        })}

        <p
          style={{
            marginTop: 48,
            fontSize: "12.5px",
            color: "var(--g500)",
            lineHeight: 1.8,
            borderTop: "1px solid var(--g300)",
            paddingTop: 22,
          }}
        >
          <b style={{ color: "var(--g700)", fontWeight: 700 }}>고지.</b> 모든 수치·레코드는
          데모용 예시입니다. 제보는 주장으로 접수되어 검증 절차를 거치며, 검증 상태가 함께
          공개됩니다. 민감 정보는 공개 시 자동 마스킹되고 원본은 관리자만 접근하며 모든 열람이
          기록됩니다.
        </p>
      </div>
    </div>
  );
}
