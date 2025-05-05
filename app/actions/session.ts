"use server"

import { Result } from "~/lib/result"
import { fetchMutation, fetchQuery } from "convex/nextjs"
import { api } from "~/convex/_generated/api"


export async function createSession(username: string): Promise<Result<string, string>> {
  try {
    // Validate username
    if (!username || username.trim() === "") {
      return { data: null, error: "Username is required" }
    }


    const { code } = await fetchMutation(api.myFunctions.createSession, {
      username
    });

    return { data: code, error: null }
  } catch (error) {
    console.error("Failed to create session:", error)
    return { data: null, error: "Failed to create session" }
  }
}


export async function joinSession(username: string, code: string): Promise<Result<boolean, string>> {
  try {
    // Validate inputs
    if (!username || username.trim() === "") {
      return { data: null, error: "Username is required" }
    }

    if (!code || code.length !== 6) {
      return { data: null, error: "Valid session ID is required" }
    }

    const { _id } = await fetchQuery(api.myFunctions.getSession, {
      code
    });

    await fetchMutation(api.myFunctions.joinSession, {
      username,
      sessionId: _id
    });

    return { data: true, error: null }
  } catch (error) {
    console.error("Failed to join session:", error)
    return { data: null, error: "Failed to join session" }
  }
}
