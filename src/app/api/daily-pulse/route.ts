import { createClient } from "@/lib/supabase/server"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { generateText } from "ai"
import { NextResponse } from "next/server"

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
})

export async function POST(req: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { focus_score, practiced_skill, reflection } = body

    if (!focus_score || focus_score < 1 || focus_score > 5) {
      return NextResponse.json({ error: "Invalid focus score" }, { status: 400 })
    }

    // Get user profile for better personalization
    const { data: profile } = await supabase
      .from("profiles")
      .select("user_role, career_goal, biggest_fear")
      .eq("id", user.id)
      .single()

    const prompt = `
You are a supportive but honest career coach.

The user just completed their Daily Career Pulse.

User context:
- Role: ${profile?.user_role || "Professional"}
- Goal: ${profile?.career_goal || "Career growth"}
- Biggest fear: ${profile?.biggest_fear || "Falling behind"}

Today's Pulse:
- Focus level (1-5): ${focus_score}
- Practiced a skill today: ${practiced_skill ? "Yes" : "No"}
- Reflection: ${reflection || "No reflection written"}

Write a short, personal response (max 3 sentences).
Be encouraging but real. If their focus was low, acknowledge it without being soft.
If they practiced a skill, praise the consistency.
End with one tiny actionable suggestion for tomorrow.

Do not use markdown. Just plain text.
`

    const { text } = await generateText({
      model: google("gemini-3.5-flash"),
      prompt,
    })

    const today = new Date().toISOString().split("T")[0]

    // Save the pulse
    const { data, error } = await supabase
      .from("daily_pulses")
      .upsert(
        {
          user_id: user.id,
          focus_score,
          practiced_skill: !!practiced_skill,
          reflection: reflection || null,
          ai_response: text,
          pulse_date: today,
        },
        { onConflict: "user_id,pulse_date" }
      )
      .select()
      .single()

    if (error) {
      console.error(error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      ai_response: text,
      pulse: data,
    })
  } catch (error: any) {
    console.error("Daily pulse error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to save pulse" },
      { status: 500 }
    )
  }
}

// Check if user already did today's pulse
export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const today = new Date().toISOString().split("T")[0]

    const { data } = await supabase
      .from("daily_pulses")
      .select("*")
      .eq("user_id", user.id)
      .eq("pulse_date", today)
      .single()

    return NextResponse.json({
      completed: !!data,
      pulse: data || null,
    })
  } catch (error: any) {
    return NextResponse.json({ completed: false, pulse: null })
  }
}