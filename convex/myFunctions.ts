import { v } from "convex/values";
import { query, mutation, action } from "./_generated/server";
import { api } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";

// Write your Convex functions in any file inside this directory (`convex`).
// See https://docs.convex.dev/functions for more.

// You can read data from the database via a query:
export const listNumbers = query({
  // Validators for arguments.
  args: {
    count: v.number(),
  },

  // Query implementation.
  handler: async (ctx, args) => {
    //// Read the database as many times as you need here.
    //// See https://docs.convex.dev/database/reading-data.
    const numbers = await ctx.db
      .query("numbers")
      // Ordered by _creationTime, return most recent
      .order("desc")
      .take(args.count);
    const userId = await getAuthUserId(ctx);
    const user = userId === null ? null : await ctx.db.get(userId);
    return {
      viewer: user?.email ?? null,
      numbers: numbers.reverse().map((number) => number.value),
    };
  },
});

// You can write data to the database via a mutation:
export const addNumber = mutation({
  // Validators for arguments.
  args: {
    value: v.number(),
  },

  // Mutation implementation.
  handler: async (ctx, args) => {
    //// Insert or modify documents in the database here.
    //// Mutations can also read from the database like queries.
    //// See https://docs.convex.dev/database/writing-data.

    const id = await ctx.db.insert("numbers", { value: args.value });

    console.log("Added new document with id:", id);
    // Optionally, return a value from your mutation.
    // return id;
  },
});

// You can fetch data from and send data to third-party APIs via an action:
export const myAction = action({
  // Validators for arguments.
  args: {
    first: v.number(),
    second: v.string(),
  },

  // Action implementation.
  handler: async (ctx, args) => {
    //// Use the browser-like `fetch` API to send HTTP requests.
    //// See https://docs.convex.dev/functions/actions#calling-third-party-apis-and-using-npm-packages.
    // const response = await ctx.fetch("https://api.thirdpartyservice.com");
    // const data = await response.json();

    //// Query data by running Convex queries.
    const data = await ctx.runQuery(api.myFunctions.listNumbers, {
      count: 10,
    });
    console.log(data);

    //// Write data by running Convex mutations.
    await ctx.runMutation(api.myFunctions.addNumber, {
      value: args.first,
    });
  },
});

export const sendMessage = mutation({
  args: {
    sessionId: v.id("sessions"),
    content: v.string(),
    author: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.insert("messages", {
      sessionId: args.sessionId,
      content: args.content,
      author: args.author,
      timestamp: Date.now(),
    });
  },
});

export const getMessages = query({
  args: {
    sessionId: v.id("sessions"),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);

    if (!session) {
      console.error("Session not found");
      throw new Error("Session not found");
    }

    return await ctx.db
      .query("messages")
      .filter((q) => q.eq(q.field("sessionId"), args.sessionId)).collect();
  },
});

export const aiCall = action({
  args: {
    messages: v.array(
      v.object({
        user: v.string(),
        role: v.string(),
        content: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const baseURL: string = process.env.AI_URL!;
    const response = await fetch(baseURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: args.messages.map((message) => ({
          role: message.role,
          content: `[${message.user}] ${message.content}`,
        })),
      }),
    });

    if (!response.body) {
      throw new Error("No response body received from AI service");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let places: Array<{
      displayName: string;
      formattedAddress: string;
      rating: number;
      googleMapsUri: string;
      websiteUri: string;
      location: {
        latitude: number;
        longitude: number;
      };
    }> | null = null;

    let justification = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const events = chunk
        .split("\n")
        .filter((line) => line.trim() !== "")
        .map((line) => JSON.parse(line));

      for (const event of events) {
        if (!places) {
          places = event.places;
        }
        justification = event.justification;

        // You can process or store the `places` and `justification` here as needed
        console.log({ places, justification });
      }
    }

    return { places, justification };
  },
});

export const createSession = mutation({
  args: {
    username: v.string(),
  },
  handler: async (ctx, args) => {
    const code = generateSessionCode();

    const sessionId = await ctx.db.insert("sessions", {
      code: code,
      owner: args.username,
    });
    await ctx.db.insert("sessionUsers", {
      sessionId: sessionId,
      username: args.username,
    });

    return (await ctx.db.get(sessionId))!;
  },
});

export const joinSession = mutation({
  args: {
    username: v.string(),
    sessionId: v.id("sessions"),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("sessionUsers", {
      sessionId: args.sessionId,
      username: args.username,
    });
  },
});

export const getSession = query({
  args: {
    code: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .filter((q) => q.eq(q.field("code"), args.code))
      .first();

    if (!session) {
      console.error("Session not found");
      throw new Error("Session not found");
    }

    const users = await ctx.db
      .query("sessionUsers")
      .filter((q) => q.eq(q.field("sessionId"), session._id))
      .collect();

    return {
      ...session,
      users: users.map((user) => user.username),
    };
  },
});


const generateSessionCode = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let result = ""
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}