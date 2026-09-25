import EndingPageClient from "./EndingPageClient";
import { ENDING_STORIES } from "@/lib/endingStories";
import { notFound } from "next/navigation";

export const metadata = { title: "마음 회복 이야기 | 사이버 마음 상담소" };

export default async function EndingPage({ searchParams }) {
  const { scenario } = await searchParams;
  if (!ENDING_STORIES[scenario]) notFound();
  return <EndingPageClient scenarioId={scenario} />;
}
