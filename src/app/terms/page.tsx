import type { Metadata } from "next";
import Link from "next/link";
import KidFooter from "@/components/kid/KidFooter";
import { BUSINESS_INFO, SUPABASE_SETUP_HINT } from "@/lib/env";

export const metadata: Metadata = {
  title: "이용약관",
  description: "운세 한 스푼의 서비스 이용약관, 코인 결제·환불 정책 안내.",
};

export default function TermsPage() {
  return (
    <main className="app app--kid">
      <header className="kid-topbar">
        <Link className="kid-back" href="/" aria-label="홈으로">
          ←
        </Link>
        <Link className="kid-brand kid-brand--small" href="/">
          <span className="kid-brand__mark" aria-hidden="true">✦</span>
          <b>이용약관</b>
        </Link>
        <span />
      </header>

      <article className="legal">
        <h1>서비스 이용약관</h1>
        <p className="legal__meta">최종 업데이트: 2026년 11월</p>

        <h2>제1조 (목적)</h2>
        <p>
          본 약관은 {BUSINESS_INFO.name}(이하 “회사”)이 운영하는 “운세 한 스푼”(이하 “서비스”)의
          이용과 관련하여 회사와 이용자 간의 권리·의무를 정하는 것을 목적으로 합니다.
        </p>

        <h2>제2조 (서비스의 내용)</h2>
        <p>
          서비스는 만세력(절기·윤달 반영)을 기반으로 사주·오늘의 운세·궁합·신년운세·대운·연운
          등 운세 콘텐츠를 제공합니다. 운세 콘텐츠는 재미와 참고를 위한 것으로, 의료·법률·투자
          등 전문적 판단을 대신하지 않습니다.
        </p>

        <h2>제3조 (회원 가입 및 로그인)</h2>
        <p>
          무료 콘텐츠는 로그인 없이 이용할 수 있습니다. 코인 충전과 유료 리포트 잠금해제, 보관함
          이용을 위해서는 카카오 계정 로그인이 필요합니다.
        </p>

        <h2>제4조 (코인 및 결제)</h2>
        <ul>
          <li>코인은 서비스 내 유료 콘텐츠를 여는 데 쓰이는 선불 충전 수단이며, 1코인은 990원을 기준으로 합니다.</li>
          <li>결제는 토스페이먼츠 결제창을 통해 이루어지며, 결제 승인 후 코인이 적립됩니다.</li>
          <li>충전한 코인은 현금으로 환급되지 않으며, 다른 사람에게 양도할 수 없습니다.</li>
          <li>결제 오류·중복 결제의 경우 확인 후 코인 재적립 또는 결제 취소로 처리합니다.</li>
        </ul>

        <h2>제5조 (청약철회 및 환불)</h2>
        <p>
          유료 리포트는 결제 즉시 잠금이 해제되는 디지털 콘텐츠입니다. 잠금해제된 이후에는
          「전자상거래 등에서의 소비자보호에 관한 법률」 제17조 제2항에 따라 청약철회가 제한됩니다.
          다만 콘텐츠가 정상적으로 열리지 않은 경우, 사용하지 않은 코인에 대해서는 고객센터를 통해
          확인 후 처리해 드립니다.
        </p>

        <h2>제6조 (이용자의 의무)</h2>
        <p>
          이용자는 타인의 정보를 도용하거나, 서비스를 자동화된 수단으로 과도하게 호출하는 등
          정상적인 운영을 방해하는 행위를 해서는 안 됩니다.
        </p>

        <h2>제7조 (서비스의 변경·중단)</h2>
        <p>
          회사는 서비스 개선을 위해 콘텐츠와 가격을 변경할 수 있으며, 변경 시 서비스 내에
          사전에 안내합니다. 이미 잠금해제한 리포트는 계속 열람할 수 있습니다.
        </p>

        <h2>제8조 (책임의 제한)</h2>
        <p>
          회사는 운세 콘텐츠를 바탕으로 한 이용자의 결정과 그 결과에 대해 책임을 지지 않습니다.
          천재지변, 통신 장애 등 회사의 통제를 벗어난 사유로 서비스가 중단된 경우 책임이
          제한됩니다.
        </p>

        <h2>제9조 (문의)</h2>
        <p>
          서비스 이용 문의: {BUSINESS_INFO.contact}
          <br />
          사업자: {BUSINESS_INFO.name} · 대표 {BUSINESS_INFO.owner} · {BUSINESS_INFO.number}
          <br />
          주소: {BUSINESS_INFO.address}
        </p>
        {!SUPABASE_SETUP_HINT ? null : null}
      </article>

      <KidFooter />
    </main>
  );
}
