import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

// The schema is normally optional, but Convex Auth
// requires indexes defined on `authTables`.
// The schema provides more precise TypeScript types.
export default defineSchema({
  ...authTables, // Provides the 'users' table
  numbers: defineTable({
    value: v.number(),
  }),
  messages: defineTable({
    content: v.string(),
    // author: v.id("users"), // Reference the users table
    author: v.string(), // Store username directly
    sessionId: v.id("sessions"), // Direct reference to the session
    timestamp: v.number()
  }).index("by_timestamp", ["timestamp"])
    .index("by_session", ["sessionId"]), // Index for querying messages by session

  sessions: defineTable({
    code: v.string(), // Assuming this is an external/session-specific ID, not a Convex Doc ID
    // owner: v.id("users"), // Reference the users table
    owner: v.string(), // Store username directly
  }).index("by_owner", ["owner"]),

  sessionUsers: defineTable({
    sessionId: v.id("sessions"),
    // userId: v.id("users"), // Reference the users table instead of storing username directly
    username: v.string(), // Store username directly
  }).index("by_session", ["sessionId"])
    .index("by_user", ["username"])
    .index("by_session_and_user", ["sessionId", "username"]), // Compound index

  // Removed sessionMessages table as messages now directly reference sessions
});
