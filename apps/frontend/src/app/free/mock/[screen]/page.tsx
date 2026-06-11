import "../../../app-shell.css";
import "../../mock.css";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SCREENS, SCREEN_MAP } from "@/components/mock/registry";
import { ScreenCap, PhoneCap, Notes } from "@/components/mock/frames";

export function generateStaticParams() {
  return SCREENS.map((s) => ({ screen: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ screen: string }>;
}) {
  const { screen } = await params;
  const s = SCREEN_MAP[screen];
  return { title: s ? `${s.name} — Votatis 화면` : "화면 — Votatis" };
}

export default async function MockScreenPage({
  params,
}: {
  params: Promise<{ screen: string }>;
}) {
  const { screen } = await params;
  const s = SCREEN_MAP[screen];
  if (!s) notFound();

  const isApp = s.kind === "app";

  return (
    <div className="mock-canvas">
      <nav className="preview-nav">
        <div className="inner">
          <Link href="/free/preview" style={{ fontWeight: 800, color: "var(--g900)" }}>
            ← 전체 화면
          </Link>
          {s.realPath && <a href={s.realPath}>실동작 화면 ↗</a>}
        </div>
      </nav>

      <div className={`board${isApp ? "" : ""}`} style={{ maxWidth: isApp ? 520 : 1120 }}>
        {isApp ? (
          <div className="pu" style={{ width: "100%", maxWidth: 416, margin: "0 auto" }}>
            <PhoneCap step={s.meta} name={s.name} tag={s.tag} />
            {s.render()}
            <Notes items={s.notes} />
          </div>
        ) : (
          <div className="swrap">
            <ScreenCap
              name={s.name}
              tags={[
                { label: s.meta },
                ...(s.tag ? [{ label: s.tag }] : []),
                ...(s.realPath ? [{ label: "실동작 ↗", href: s.realPath }] : []),
              ]}
            />
            {s.render()}
            <Notes items={s.notes} />
          </div>
        )}
      </div>
    </div>
  );
}
