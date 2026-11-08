import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get score history (oldest first for the graph)
    const { data: scoresAsc } = await supabase
      .from("score_history")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(20)

    // Also get latest first for the list
    const { data: scoresDesc } = await supabase
      .from("score_history")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10)

    // Get check-in history
    const { data: checkins } = await supabase
      .from("career_checkins")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10)

    return NextResponse.json({
      scores: scoresDesc || [],
      scoresForGraph: scoresAsc || [],
      checkins: checkins || [],
    })
  } catch (error: any) {
    console.error("History error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to load history" },
      { status: 500 }
    )
  }
}