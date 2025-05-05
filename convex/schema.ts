import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";


export const placeValidator = v.object({
  id: v.string(),
  displayName: v.string(),
  location: v.object({
    latitude: v.number(),
    longitude: v.number(),
  }),
  rating: v.number(),
  userRatingCount: v.number(),
  types: v.union(v.array(v.string()), v.null()),
  // Assuming currentOpeningHours is an array of strings based on the Python model
  currentOpeningHours: v.union(v.array(v.string()), v.null()),
  goodForChildren: v.union(v.union(v.literal("TRUE"), v.literal("FALSE"), v.literal("NOT_AVAILABLE")), v.null()),
  goodForGroups:  v.union(v.union(v.literal("TRUE"), v.literal("FALSE"), v.literal("NOT_AVAILABLE")), v.null()),
  liveMusic:  v.union(v.union(v.literal("TRUE"), v.literal("FALSE"), v.literal("NOT_AVAILABLE")), v.null()),
  allowedDogs:  v.union(v.union(v.literal("TRUE"), v.literal("FALSE"), v.literal("NOT_AVAILABLE")), v.null()),
  outdoorSeating:  v.union(v.union(v.literal("TRUE"), v.literal("FALSE"), v.literal("NOT_AVAILABLE")), v.null()),
  parkingOptions:  v.union(v.union(v.literal("TRUE"), v.literal("FALSE"), v.literal("NOT_AVAILABLE")), v.null()),
  dineIn:  v.union(v.union(v.literal("TRUE"), v.literal("FALSE"), v.literal("NOT_AVAILABLE")), v.null()),
  delivery:  v.union(v.union(v.literal("TRUE"), v.literal("FALSE"), v.literal("NOT_AVAILABLE")), v.null()),
  reservable:  v.union(v.union(v.literal("TRUE"), v.literal("FALSE"), v.literal("NOT_AVAILABLE")), v.null()),
  priceLevel: v.union(v.string(), v.null()),
  // Updated priceRange based on Python model
  priceRange: v.union(v.object({
    startPrice: v.union(v.string(), v.null()),
    endPrice: v.union(v.string(), v.null()),
  }), v.null()),
  formattedAddress: v.string(),
  googleMapsUri: v.string(),
  websiteUri: v.union(v.string(), v.null()),
  // Assuming photos is an array of strings based on the Python model
  photos: v.union(v.array(v.string()), v.null()),
  internationalPhoneNumber: v.union(v.string(), v.null()),
  businessStatus: v.union(v.string(), v.null()),
});

export const userPreferenceValidator = v.object({
  place_id: v.string(),
  score: v.number(),
});

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
  aiResults: defineTable({
    sessionId: v.id("sessions"),
    places: v.array(placeValidator),
    userPreferences: v.array(userPreferenceValidator),
    justification: v.string(),
  }).index("by_sessionId", ["sessionId"]),

});


