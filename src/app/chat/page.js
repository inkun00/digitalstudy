import ChatPageClient from "./ChatPageClient";
import ChatDirectory from "./ChatDirectory";
import { SCENARIOS } from "@/lib/scenarios";

export default async function ChatPage({ searchParams }) {
  const { scenario } = await searchParams;
  const selectedScenario = SCENARIOS.find((item) => item.id === scenario);
  if (!selectedScenario) return <ChatDirectory />;
  return <ChatPageClient key={selectedScenario.id} initialScenarioId={selectedScenario.id} />;
}
