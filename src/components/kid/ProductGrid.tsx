"use client";

import Link from "next/link";
import { PRODUCTS, productPriceKrw, won } from "@/lib/coins";

const HREF: Record<string, string> = {
  saju: "/saju",
  newyear: "/report/newyear",
  love: "/report/love",
  gunghap: "/report/gunghap",
  daewoon: "/report/daewoon",
  yeonwoon: "/report/yeonwoon",
};

export default function ProductGrid() {
  return (
    <section className="kid-section" id="products">
      <div className="kid-section__head">
        <h2>오늘 뭐 볼까?</h2>
        <p>필요한 것만 골라 코인으로 열어요</p>
      </div>

      <div className="product-grid">
        {PRODUCTS.map((product) => (
          <Link
            key={product.type}
            className={`product-card product-card--${product.accent}`}
            href={HREF[product.type] ?? "/saju"}
            prefetch={false}
          >
            <div className="product-card__media">
              <picture>
                <source srcSet={product.image} type="image/webp" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={product.image.replace(/\.webp$/, ".jpg")}
                  alt=""
                  width={640}
                  height={800}
                  loading="lazy"
                />
              </picture>
              {product.badge ? (
                <span className={`product-card__badge product-card__badge--${product.badge === "NEW" ? "new" : "sale"}`}>
                  {product.badge}
                </span>
              ) : null}
            </div>
            <div className="product-card__body">
              <h3>{product.title}</h3>
              <p>{product.tagline}</p>
              <div className="product-card__price">
                <span className="coin">
                  🪙 <b>{product.coins}</b>
                </span>
                {product.originalCoins ? (
                  <s className="product-card__was">{product.originalCoins}코인</s>
                ) : null}
                <span className="product-card__won">{won(productPriceKrw(product))}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <Link className="kid-wide-link" href="/board" prefetch={false}>
        <span className="kid-wide-link__emoji" aria-hidden="true">💞</span>
        <span>
          <b>친구랑 궁합 줄세우기</b>
          <small>내 사주를 가운데 두고 순위 보기 · 무료</small>
        </span>
        <span aria-hidden="true">→</span>
      </Link>
    </section>
  );
}
