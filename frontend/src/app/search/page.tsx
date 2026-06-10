import "../app-shell.css";
import SiteHeader from "@/components/layout/SiteHeader";
import SearchClient from "./SearchClient";

export const metadata = { title: "검색 — Votatis" };

export default function SearchPage() {
  return (
    <>
      <SiteHeader />
      <div className="page-wrap">
        <div className="page-head">
          <h1>검색</h1>
          <div className="sub">키워드와 카테고리·검증 상태·지역 필터를 조합해 공개 레코드를 찾습니다.</div>
        </div>
        <SearchClient />
      </div>
    </>
  );
}
