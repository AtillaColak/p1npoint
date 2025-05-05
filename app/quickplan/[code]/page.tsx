import { fetchQuery, preloadQuery } from "convex/nextjs";
import { api } from "~/convex/_generated/api";
import QuickInterface from "~/components/interface";

type Parmas = Promise<{
  code: string;
}>;

export default async function qsessionWrapper({ params }: { params: Parmas }) {
  // ─── State ───────────────────────────────────────────────────────────────
  const { code } = await params;

  const {_id} = await fetchQuery(api.myFunctions.getSession, {
    code: code,
  });

  const session = await preloadQuery(api.myFunctions.getSession, {
    code: code,
  });

  const messages = await preloadQuery(api.myFunctions.getMessages, {
    sessionId: _id,
  });

  return (
    <div> 
        <QuickInterface chatSession={session} chatMessages={messages} />
    </div>
  );
}