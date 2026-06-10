"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Torch from "@/components/landing/Torch";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const valid = email.includes("@") && pw.length >= 4;

  return (
    <div className="login" style={{ background: "transparent", minHeight: "60vh" }}>
      <div className="login-card">
        <div className="lg">
          <Torch size={30} />Votatis
        </div>
        <div className="sub">관리자 콘솔 · 검토자 전용</div>
        <input
          className="inp"
          type="email"
          placeholder="admin@votatis.kr"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="inp"
          type="password"
          placeholder="비밀번호"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
        />
        <button
          className="lbtn"
          disabled={!valid}
          style={!valid ? { background: "var(--g300)", cursor: "not-allowed" } : undefined}
          onClick={() => router.push("/free/admin/dashboard")}
          /* TODO: POST /api/admin/login → OTP 2FA → 세션 */
        >
          로그인
        </button>
        <div className="l2fa">
          접근 시 2단계 인증(OTP)이 요구됩니다.
          <br />
          모든 로그인·열람 활동은 감사 로그에 기록됩니다.
        </div>
      </div>
    </div>
  );
}
