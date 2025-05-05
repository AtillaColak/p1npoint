import { v } from "convex/values";
import { query, mutation, action, internalMutation } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";
import { placeValidator, userPreferenceValidator } from "./schema";
import { Doc, Id } from "./_generated/dataModel"; // Import Doc type

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

    const messages = await ctx.db
      .query("messages")
      .filter((q) => q.eq(q.field("sessionId"), args.sessionId)).collect();

    ctx.scheduler.runAfter(0, api.myFunctions.aiCall, {
      sessionId: args.sessionId,
      messages: messages.map((message) => ({
        user: message.author,
        role: "user",
        content: message.content,
      })),
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

export const aiCall = action({
  args: {
    sessionId: v.id("sessions"),
    messages: v.array(
      v.object({
        user: v.string(),
        role: v.string(),
        content: v.string(),
      })
    ),
  },
  returns: v.id("aiResults"),
  handler: async (ctx, args): Promise<Id<"aiResults">> => {
    const response = await fetch("http://192.168.2.170:8000/places/chat", {
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

    let resultId: Id<"aiResults"> | null = null;
    let accumulatedChunk = "";
    let latestPlaces: Array<Doc<"aiResults">["places"][number]> | null = null;
    let latestUserPreferences: Array<Doc<"aiResults">["userPreferences"][number]> | null = null;
    let latestJustification: string | null = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      accumulatedChunk += decoder.decode(value, { stream: true });
      const lines = accumulatedChunk.split('\n');
      accumulatedChunk = lines.pop() ?? "";

      for (const line of lines) {
        if (line.startsWith("data:")) {
          const jsonData = line.slice(5).trim();
          try {
            const event = JSON.parse(jsonData);
            const updatePayload: {
              places?: typeof placeValidator.type[],
              userPreferences?: typeof userPreferenceValidator.type[],
              justification?: string
            } = {};

            if (event.places !== undefined) {
              latestPlaces = event.places;
              updatePayload.places = event.places;
            }
            if (event.user_preferences !== undefined) {
              latestUserPreferences = event.user_preferences;
              updatePayload.userPreferences = event.user_preferences;
            }
            if (event.justification !== undefined) {
              latestJustification = event.justification;
              updatePayload.justification = event.justification;
            }

            if (Object.keys(updatePayload).length > 0) {
              console.log("Streaming update:", updatePayload);
              resultId = await ctx.runMutation(internal.myFunctions.storeAiResult, {
                sessionId: args.sessionId,
                ...updatePayload,
              });
            }

          } catch (error) {
            console.error("Failed to parse JSON chunk:", line, error);
          }
        }
      }
    }

    if (accumulatedChunk.trim() !== "" && accumulatedChunk.startsWith("data:")) {
      const jsonData = accumulatedChunk.slice(5).trim();
      try {
        const event = JSON.parse(jsonData);
        const finalUpdatePayload: {
          places?: typeof placeValidator.type[],
          userPreferences?: typeof userPreferenceValidator.type[],
          justification?: string
        } = {};
        if (event.places !== undefined) {
          latestPlaces = event.places;
          finalUpdatePayload.places = event.places;
        }
        if (event.user_preferences !== undefined) {
          latestUserPreferences = event.user_preferences;
          finalUpdatePayload.userPreferences = event.user_preferences;
        }
        if (event.justification !== undefined) {
          latestJustification = event.justification;
          finalUpdatePayload.justification = event.justification;
        }
        if (Object.keys(finalUpdatePayload).length > 0) {
          console.log("Streaming final chunk update:", finalUpdatePayload);
          resultId = await ctx.runMutation(internal.myFunctions.storeAiResult, {
            sessionId: args.sessionId,
            ...finalUpdatePayload,
          });
        }
      } catch (error) {
        console.error("Failed to parse final chunk:", accumulatedChunk, error);
      }
    }

    if (resultId && (latestPlaces || latestUserPreferences || latestJustification !== null)) {
      const finalConsistentPayload: {
        places?: typeof placeValidator.type[],
        userPreferences?: typeof userPreferenceValidator.type[],
        justification?: string
      } = {};
      if (latestPlaces) finalConsistentPayload.places = latestPlaces;
      if (latestUserPreferences) finalConsistentPayload.userPreferences = latestUserPreferences;
      if (latestJustification !== null) finalConsistentPayload.justification = latestJustification;

      console.log("Ensuring final consistent state:", finalConsistentPayload);
      resultId = await ctx.runMutation(internal.myFunctions.storeAiResult, {
        sessionId: args.sessionId,
        ...finalConsistentPayload,
      });
    }

    if (resultId === null) {
      console.error("Stream finished without storing any AI results for session:", args.sessionId);
      if (latestPlaces || latestUserPreferences || latestJustification !== null) {
        console.warn("Attempting to store potentially partial final data as stream ended unexpectedly.");
        resultId = await ctx.runMutation(internal.myFunctions.storeAiResult, {
          sessionId: args.sessionId,
          places: latestPlaces ?? undefined,
          userPreferences: latestUserPreferences ?? undefined,
          justification: latestJustification ?? undefined,
        });
        if (resultId) {
          console.log("Stored partial final data with ID:", resultId);
          return resultId;
        }
      }
      throw new Error("Incomplete data received or failed to store AI service stream results.");
    }

    console.log("Final AI result ID after stream:", resultId);
    return resultId as Id<"aiResults">;
  },
});

export const storeAiResult = internalMutation({
  args: {
    sessionId: v.id("sessions"),
    places: v.optional(v.array(placeValidator)),
    userPreferences: v.optional(v.array(userPreferenceValidator)),
    justification: v.optional(v.string()),
  },
  returns: v.id("aiResults"),
  handler: async (ctx, args) => {
    const existingResult = await ctx.db
      .query("aiResults")
      .withIndex("by_sessionId", q => q.eq("sessionId", args.sessionId))
      .first();

    const patchData: Partial<Omit<Doc<"aiResults">, "_id" | "_creationTime" | "sessionId">> = {};
    if (args.places !== undefined) {
      patchData.places = args.places;
    }
    if (args.userPreferences !== undefined) {
      patchData.userPreferences = args.userPreferences;
    }
    if (args.justification !== undefined) {
      patchData.justification = args.justification;
    }

    if (Object.keys(patchData).length === 0) {
      if (existingResult) {
        return existingResult._id;
      } else {
        throw new Error("Attempted to store AI result with no data fields provided.");
      }
    }

    if (existingResult) {
      await ctx.db.patch(existingResult._id, patchData);
      return existingResult._id;
    } else {
      const resultId = await ctx.db.insert("aiResults", {
        sessionId: args.sessionId,
        places: args.places ?? [],
        userPreferences: args.userPreferences ?? [],
        justification: args.justification ?? "",
        ...patchData,
      });
      return resultId;
    }
  },
});

export const getAiPlaces = query({
  args: {
    sessionId: v.id("sessions"),
  },
  handler: async (ctx, args) => {
    const aiResult = await ctx.db
      .query("aiResults")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
      .first();

    if (!aiResult) {
      console.warn("No AI results found for session:", args.sessionId);
      return null;
    }

    return aiResult ?? null;
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