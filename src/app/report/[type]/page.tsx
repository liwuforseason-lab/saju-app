import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ReportScreen from "@/components/report/ReportScreen";
import { PRODUCTS, isReportType } from "@/lib/coins";

interface Params {
  params: Promise<{ type: string }>;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { type } = await params;
  const product = PRODUCTS.find((item) => item.type === type);
  if (!product) return { title: "리포트" };
  return {
    title: `${product.title} — ${product.tagline}`,
    description: product.lead,
  };
}

export default async function ReportPage({ params }: Params) {
  const { type } = await params;
  if (!isReportType(type)) notFound();

  return (
    <Suspense fallback={<div className="screen-loading">리포트를 준비하고 있어요…</div>}>
      <ReportScreen type={type} />
    </Suspense>
  );
}
