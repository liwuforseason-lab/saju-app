import Link from "next/link";
import { BUSINESS_INFO } from "@/lib/env";

/** 사업자 정보·약관 안내를 담은 공용 푸터 (유료 결제 서비스 필수 표기) */
export default function KidFooter() {
  return (
    <footer className="kid-footer">
      <div className="kid-footer__links">
        <Link href="/terms">이용약관</Link>
        <span aria-hidden="true">·</span>
        <Link href="/privacy">개인정보처리방침</Link>
        <span aria-hidden="true">·</span>
        <Link href="/charge">코인 충전</Link>
      </div>
      <div className="kid-footer__biz">
        <p>
          상호 {BUSINESS_INFO.name} · 대표 {BUSINESS_INFO.owner}
        </p>
        <p>
          {BUSINESS_INFO.number} · {BUSINESS_INFO.mailOrder}
        </p>
        <p>{BUSINESS_INFO.address}</p>
        <p>{BUSINESS_INFO.contact}</p>
      </div>
      <p className="kid-footer__note">
        운세 콘텐츠는 재미와 참고를 위한 것이며, 의료·법률·투자 판단의 근거가 되지 않습니다.
        결제 상품은 디지털 콘텐츠로, 잠금해제 후에는 청약철회가 제한됩니다.
      </p>
      <p className="kid-footer__copy">© {new Date().getFullYear()} 운세 한 스푼</p>
    </footer>
  );
}
