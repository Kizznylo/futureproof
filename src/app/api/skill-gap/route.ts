import { createClient } from "@/lib/supabase/server"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { generateText } from "ai"
import { NextResponse } from "next/server"

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
})

export async function POST() {
  try {
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

    const prompt = `
You are a world-class career coach and skills strategist in 2026. Be specific, direct, and practical.

User Profile:
- Current Role: ${profile.user_role || "Not specified"}
- Years of Experience: ${profile.experience_years || "Not specified"}
- Current Skills: ${profile.skills?.join(", ") || "None listed"}
- Career Goal: ${profile.career_goal || "Not specified"}
- Biggest Fear: ${profile.biggest_fear || "Not specified"}

Analyze their skill gaps with high precision for someone in their exact situation.

Return ONLY valid JSON in this exact format:
{
  "summary": "2-3 personal sentences about their current skill position and what it means for their goal",
  "current_strengths": ["strength 1", "strength 2", "strength 3"],
  "critical_gaps": [
    {
      "skill": "Skill name",
      "why_important": "Why this skill matters specifically for their role and goal",
      "priority": "High",
      "time_to_learn": "e.g. 4-6 weeks",
      "first_action": "The very first concrete action they should take this week"
    }
  ],
  "recommended_learning_path": [
    "Step 1: ...",
    "Step 2: ...",
    "Step 3: ...",
    "Step 4: ..."
  ],
  "motivational_note": "One short powerful sentence to push them forward"
}
`

    const { text } = await generateText({
      model: google("gemini-3.5-flash"),
      prompt,
    })

    const cleaned = text.replace(/```json|```/g, "").trim()
    const result = JSON.parse(cleaned)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("Skill gap error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to analyze skills" },
      { status: 500 }
    )
  }
}