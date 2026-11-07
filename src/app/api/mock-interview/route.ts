import { createClient } from "@/lib/supabase/server"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { generateText } from "ai"
import { NextResponse } from "next/server"

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { action, answer, question, difficulty = "intermediate", feedbacks } = body

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    // ========== START INTERVIEW ==========
    if (action === "start") {
      const difficultyText = {
        beginner: "Keep questions relatively basic and supportive. Focus on fundamentals.",
        intermediate: "Ask realistic mid-level questions that test both knowledge and practical experience.",
        advanced: "Ask challenging, senior-level questions that test deep understanding, trade-offs, and real-world judgment.",
      }[difficulty as "beginner" | "intermediate" | "advanced"] || ""

      const prompt = `
You are a professional technical interviewer in 2026.

Candidate profile:
- Role: ${profile.user_role}
- Experience: ${profile.experience_years} years
- Skills: ${profile.skills?.join(", ")}
- Goal: ${profile.career_goal}

Difficulty level: ${difficulty}
Instruction: ${difficultyText}

Generate exactly 5 interview questions.
Make them progressive (easier → harder).
Mix technical and behavioral questions.

Return ONLY valid JSON:
{
  "questions": [
    "Question 1",
    "Question 2",
    "Question 3",
    "Question 4",
    "Question 5"
  ]
}
`

      const { text } = await generateText({
        model: google("gemini-3.5-flash"),
        prompt,
      })

      const cleaned = text.replace(/```json|```/g, "").trim()
      const result = JSON.parse(cleaned)

      return NextResponse.json(result)
    }

    // ========== EVALUATE ANSWER ==========
    if (action === "evaluate") {
      const prompt = `
You are a professional technical interviewer.

Candidate profile:
- Role: ${profile.user_role}
- Experience: ${profile.experience_years} years
- Skills: ${profile.skills?.join(", ")}

Question: "${question}"
Candidate Answer: "${answer}"

Evaluate the answer. Return ONLY valid JSON:
{
  "score": 1-10,
  "feedback": "Clear, constructive feedback (2-4 sentences)",
  "better_answer_example": "A short example of a stronger answer"
}
`

      const { text } = await generateText({
        model: google("gemini-3.8-flash"),
        prompt,
      })

      const cleaned = text.replace(/```json|```/g, "").trim()
      const result = JSON.parse(cleaned)

      return NextResponse.json(result)
    }

    // ========== FINAL SUMMARY + SAVE HISTORY ==========
    if (action === "summary") {
      const prompt = `
You are a professional career coach.

The candidate just finished a mock interview.
Here are the scores and feedbacks:
${JSON.stringify(feedbacks, null, 2)}

Candidate role: ${profile.user_role}

Write a helpful final summary. Return ONLY valid JSON:
{
  "overall_score": number,
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "weaknesses": ["weakness 1", "weakness 2"],
  "advice": "One short paragraph of practical advice for the candidate"
}
`

      const { text } = await generateText({
        model: google("gemini-3.8-flash"),
        prompt,
      })

      const cleaned = text.replace(/```json|```/g, "").trim()
      const result = JSON.parse(cleaned)

      // Save to interview_history
      await supabase.from("interview_history").insert({
        user_id: user.id,
        difficulty: difficulty || "intermediate",
        overall_score: result.overall_score,
        strengths: result.strengths,
        weaknesses: result.weaknesses,
        advice: result.advice,
        feedbacks: feedbacks,
      })

      return NextResponse.json(result)
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error: any) {
    console.error("Mock interview error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to process interview" },
      { status: 500 }
    )
  }
}