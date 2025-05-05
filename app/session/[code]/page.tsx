import { fetchQuery, preloadQuery } from "convex/nextjs";
import SessionPage from "~/components/session";
import { api } from "~/convex/_generated/api";

type Parmas = Promise<{
  code: string;
}>;

export default async function Page({ params }: { params: Parmas }) {
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
      <h1>Session Details</h1>
      <p>Session ID: {code}</p>
      <SessionPage session={session} messages={messages}/>
    </div>
  );
}
