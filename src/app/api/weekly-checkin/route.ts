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
    const { wins, challenges, skills_practiced, hours_invested, mood } = body

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

    const currentDate = new Date()
    const weekNumber = getWeekNumber(currentDate)
    const year = currentDate.getFullYear()

    const prompt = `
You are an expert career coach in 2026.

The user just submitted their weekly career check-in.

User Profile:
- Role: ${profile.user_role}
- Experience: ${profile.experience_years} years
- Skills: ${profile.skills?.join(", ")}
- Goal: ${profile.career_goal}
- Biggest Fear: ${profile.biggest_fear}

This week's check-in:
- Wins: ${wins || "None shared"}
- Challenges: ${challenges || "None shared"}
- Skills practiced: ${skills_practiced?.join(", ") || "None"}
- Hours invested: ${hours_invested || 0}
- Mood: ${mood || "Not specified"}

Give helpful, encouraging, and practical coaching.

Return ONLY valid JSON:
{
  "ai_feedback": "2-4 sentences of personalized feedback. Be honest but motivating.",
  "next_week_plan": [
    "Specific action 1 for next week",
    "Specific action 2 for next week",
    "Specific action 3 for next week"
  ],
  "encouragement": "One short powerful sentence of encouragement"
}
`

    const { text } = await generateText({
      model: google("gemini-3.5-flash"),
      prompt,
    })

    const cleaned = text.replace(/```json|```/g, "").trim()
    const result = JSON.parse(cleaned)

    // Save check-in
    const { data: checkin, error } = await supabase
      .from("career_checkins")
      .insert({
        user_id: user.id,
        week_number: weekNumber,
        year: year,
        wins,
        challenges,
        skills_practiced: skills_practiced || [],
        hours_invested: hours_invested || 0,
        mood,
        ai_feedback: result.ai_feedback,
        next_week_plan: result.next_week_plan,
      })
      .select()
      .single()

    if (error) {
      console.error(error)
      return NextResponse.json({ error: "Failed to save check-in" }, { status: 500 })
    }

    return NextResponse.json({
      ...result,
      checkin_id: checkin.id,
    })
  } catch (error: any) {
    console.error("Weekly checkin error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to process check-in" },
      { status: 500 }
    )
  }
}

// Helper function to get week number
function getWeekNumber(date: Date) {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1)
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)
}