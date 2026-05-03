import { ChatPage } from "@/components/bitecheck/chat/ChatPage";

export const metadata = {
  title: "Agent · BiteCheck",
};

export default async function AgentPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

  return <ChatPage initialQuery={q} />;
}

