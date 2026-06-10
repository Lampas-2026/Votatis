import type { ReactNode } from "react";
import { ILock, StatusBar } from "./mock-icons";

/** 브라우저 윈도우 프레임 (웹 목업) */
export function WinFrame({ url, children }: { url: string; children: ReactNode }) {
  return (
    <div className="win">
      <div className="win-bar">
        <span className="d">
          <i />
          <i />
          <i />
        </span>
        <div className="win-url">
          <ILock size={13} />
          {url}
        </div>
      </div>
      {children}
    </div>
  );
}

/** iPhone 디바이스 프레임 (앱 목업) */
export function DeviceFrame({ children }: { children: ReactNode }) {
  return (
    <div className="device">
      <div className="screen">
        <div className="notch" />
        <StatusBar />
        <div className="body">{children}</div>
      </div>
    </div>
  );
}

/** 갤러리 캡션 (웹) */
export function ScreenCap({
  name,
  tags,
}: {
  name: string;
  tags?: { label: string; href?: string }[];
}) {
  return (
    <div className="scap">
      <span className="nm">{name}</span>
      {tags?.map((t) =>
        t.href ? (
          <a key={t.label} className="tag" href={t.href}>
            {t.label}
          </a>
        ) : (
          <span key={t.label} className="tag">
            {t.label}
          </span>
        )
      )}
    </div>
  );
}

/** 갤러리 캡션 (앱: 스텝 배지) */
export function PhoneCap({
  step,
  name,
  tag,
}: {
  step: string;
  name: string;
  tag?: string;
}) {
  return (
    <div className="pcap">
      <span className="step">{step}</span>
      <span className="nm">{name}</span>
      <span className="sz">390×844</span>
      {tag && <span className="tag">{tag}</span>}
    </div>
  );
}

/** 설계 노트 묶음 */
export function Notes({ items }: { items: { h: string; p: string }[] }) {
  return (
    <div className="notes">
      {items.map((n) => (
        <div className="note" key={n.h}>
          <h5>{n.h}</h5>
          <p>{n.p}</p>
        </div>
      ))}
    </div>
  );
}
