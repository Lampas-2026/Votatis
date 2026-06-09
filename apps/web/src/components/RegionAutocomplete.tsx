import { useEffect, useMemo, useRef, useState } from "react";

// regions.flat.json 한 항목. level 에 따라 sigungu/umd 가 null 일 수 있다.
export interface RegionEntry {
  code: string;
  level: "sido" | "sigungu" | "umd";
  sido: string;
  sigungu: string | null;
  umd: string | null;
}

export function regionLabel(e: RegionEntry): string {
  return [e.sido, e.sigungu, e.umd].filter(Boolean).join(" ");
}

/** 공백 제거 + 소문자. 한글은 그대로, fuzzy 비교용 평탄화 키. */
function flatten(s: string): string {
  return s.toLowerCase().replace(/\s+/g, "");
}

/**
 * 부분문자열(연속) 우선, 안 되면 subsequence(비연속) 매칭으로 fuzzy 점수를 낸다.
 * 점수 낮을수록 좋음. 매칭 실패면 null.
 */
function score(flatLabel: string, q: string): number | null {
  const idx = flatLabel.indexOf(q);
  if (idx >= 0) return idx + flatLabel.length * 0.01; // 연속 매칭: 앞쪽·짧은 라벨 우대
  // subsequence
  let qi = 0;
  let first = -1;
  let last = -1;
  for (let i = 0; i < flatLabel.length && qi < q.length; i++) {
    if (flatLabel[i] === q[qi]) {
      if (first < 0) first = i;
      last = i;
      qi++;
    }
  }
  if (qi < q.length) return null;
  return 500 + (last - first) + flatLabel.length * 0.01;
}

interface Props {
  /** 선택된 항목(구조화) 또는 null(자유 입력). text 는 항상 현재 입력값. */
  onChange: (r: { text: string; region: RegionEntry | null }) => void;
  placeholder?: string;
  id?: string;
  className?: string;
}

const MAX_SUGGESTIONS = 20;

export default function RegionAutocomplete({ onChange, placeholder, id, className }: Props) {
  const [query, setQuery] = useState("");
  const [data, setData] = useState<RegionEntry[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapRef = useRef<HTMLDivElement>(null);

  // 데이터셋은 첫 포커스 때 지연 로드(525KB → 메인 island 번들에서 분리).
  function ensureData() {
    if (data || loading) return;
    setLoading(true);
    import("../data/regions.flat.json")
      .then((m) => setData((m.default ?? m) as unknown as RegionEntry[]))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }

  // 평탄화 키를 한 번만 계산
  const flatKeys = useMemo(
    () => (data ? data.map((e) => flatten(regionLabel(e))) : null),
    [data],
  );

  const suggestions = useMemo(() => {
    if (!data || !flatKeys) return [];
    const q = flatten(query);
    if (!q) return [];
    const scored: { e: RegionEntry; s: number }[] = [];
    for (let i = 0; i < data.length; i++) {
      const s = score(flatKeys[i], q);
      if (s !== null) scored.push({ e: data[i], s });
    }
    scored.sort((a, b) => a.s - b.s);
    return scored.slice(0, MAX_SUGGESTIONS).map((x) => x.e);
  }, [data, flatKeys, query]);

  // 바깥 클릭 시 닫기
  useEffect(() => {
    function onDocClick(ev: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(ev.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function setText(text: string) {
    setQuery(text);
    setOpen(true);
    // 입력할 때마다 첫 후보를 기본 하이라이트(여기서 Enter 치면 맨 위가 선택됨)
    setActiveIndex(0);
    // 텍스트가 바뀌면 선택은 해제(자유 입력 상태)
    onChange({ text, region: null });
  }

  function pick(e: RegionEntry) {
    const label = regionLabel(e);
    setQuery(label);
    setOpen(false);
    setActiveIndex(-1);
    onChange({ text: label, region: e });
  }

  function onKeyDown(ev: React.KeyboardEvent<HTMLInputElement>) {
    // 한글 등 IME 조합 중 Enter는 "조합 확정"용이므로 후보 선택으로 처리하지 않는다.
    // (조합 중 Enter를 잡으면 "내손2동" + 커밋 "동" → "내손2동동" 처럼 글자가 겹친다.)
    if (ev.nativeEvent.isComposing) return;
    if (!open || suggestions.length === 0) return;
    if (ev.key === "ArrowDown") {
      ev.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (ev.key === "ArrowUp") {
      ev.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (ev.key === "Enter") {
      // 엔터: 화살표로 고른 항목이 있으면 그것, 없으면 맨 위 후보로 설정.
      ev.preventDefault();
      pick(suggestions[activeIndex >= 0 ? activeIndex : 0]);
    } else if (ev.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={wrapRef} className="relative">
      <input
        id={id}
        type="text"
        className={className}
        value={query}
        placeholder={placeholder}
        autoComplete="off"
        onFocus={() => {
          ensureData();
          if (query) setOpen(true);
        }}
        onChange={(ev) => setText(ev.target.value)}
        onKeyDown={onKeyDown}
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
      />
      {open && (query.trim().length > 0) && (
        <ul className="absolute z-10 mt-1 max-h-64 w-full overflow-auto rounded-md border border-gray-200 bg-white py-1 text-sm shadow-lg">
          {loading && <li className="px-3 py-2 text-gray-400">불러오는 중…</li>}
          {!loading && suggestions.length === 0 && (
            <li className="px-3 py-2 text-gray-400">
              일치하는 지역 없음 — 입력한 주소를 그대로 사용합니다.
            </li>
          )}
          {suggestions.map((e, i) => (
            <li key={e.code}>
              <button
                type="button"
                // onMouseDown: input blur 보다 먼저 실행되어 선택이 유실되지 않게
                onMouseDown={(ev) => {
                  ev.preventDefault();
                  pick(e);
                }}
                className={`block w-full px-3 py-2 text-left hover:bg-blue-50 ${
                  i === activeIndex ? "bg-blue-50" : ""
                }`}
              >
                {regionLabel(e)}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
