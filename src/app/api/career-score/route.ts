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
You are a world-class career coach and labor market expert in 2026. You are direct, honest, and highly specific.

Analyze this person's career situation deeply.

User Profile:
- Current Role: ${profile.user_role || "Not specified"}
- Years of Experience: ${profile.experience_years || "Not specified"}
- Skills: ${profile.skills?.join(", ") || "None listed"}
- Career Goal: ${profile.career_goal || "Not specified"}
- Biggest Fear: ${profile.biggest_fear || "Not specified"}

Give a Career Health Score from 0 to 100.

Be very specific to their exact role and skills. Avoid generic advice.

Respond ONLY with valid JSON in this exact format:
{
  "score": number,
  "summary": "2-3 sentences that feel personal and insightful. Mention their specific role and skills.",
  "top_risk": "The single biggest risk they face right now (be specific)",
  "top_opportunity": "The highest-leverage opportunity available to them in the next 6-12 months",
  "harsh_truth": "One honest sentence they need to hear",
  "encouragement": "One short, powerful encouraging sentence"
}
`

    const { text } = await generateText({
      model: google("gemini-3.5-flash"),
      prompt,
    })

    const cleaned = text.replace(/```json|```/g, "").trim()
    const result = JSON.parse(cleaned)

    // Save score to profiles
    await supabase
      .from("profiles")
      .update({ career_score: result.score })
      .eq("id", user.id)

    // Save to score_history
    await supabase.from("score_history").insert({
      user_id: user.id,
      score: result.score,
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("Career score error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to generate score" },
      { status: 500 }
    )
  }
}