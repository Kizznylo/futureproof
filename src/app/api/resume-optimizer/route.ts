import { createClient } from "@/lib/supabase/server"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { generateText } from "ai"
import { NextResponse } from "next/server"

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
})

export async function POST(req: Request) {
  try {
    const { resumeText } = await req.json()

    if (!resumeText || resumeText.trim().length < 50) {
      return NextResponse.json(
        { error: "Please paste a longer resume" },
        { status: 400 }
      )
    }

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

    const prompt = `
You are an expert resume writer and career coach in 2026.

Rewrite the following resume to make it stronger, more modern, and better aligned with the candidate's goals.

Candidate Profile:
- Current Role: ${profile?.user_role || "Not specified"}
- Experience: ${profile?.experience_years || "Not specified"} years
- Skills: ${profile?.skills?.join(", ") || "Not specified"}
- Career Goal: ${profile?.career_goal || "Not specified"}

Original Resume:
"""
${resumeText}
"""

Instructions:
- Keep it truthful (do not invent experience)
- Use strong action verbs
- Make achievements quantifiable where possible
- Improve structure and clarity
- Optimize for 2026 hiring standards
- Keep professional tone

Return ONLY valid JSON in this format:
{
  "optimized_resume": "The full rewritten resume in clean plain text",
  "key_improvements": [
    "Improvement 1",
    "Improvement 2",
    "Improvement 3",
    "Improvement 4"
  ],
  "summary": "Short explanation of the main changes made"
}
`

    const { text } = await generateText({
      model: google("gemini-3.5-flash"),
      prompt,
    })

    const cleaned = text.replace(/```json|```/g, "").trim()
    const result = JSON.parse(cleaned)

    // Save to resume_history
    await supabase.from("resume_history").insert({
      user_id: user.id,
      original_resume: resumeText,
      optimized_resume: result.optimized_resume,
      key_improvements: result.key_improvements,
      summary: result.summary,
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("Resume optimizer error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to optimize resume" },
      { status: 500 }
    )
  }
}