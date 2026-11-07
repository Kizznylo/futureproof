"use client"
export const dynamic = 'force-dynamic'
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useTheme } from "@/components/ThemeProvider"
import DailyPulse from "@/components/DailyPulse"
import { generateCareerReport } from "@/lib/generateCareerReport"

type Profile = {
  id: string
  full_name: string | null
  user_role: string | null
  experience_years: number | null
  skills: string[] | null
  career_goal: string | null
  biggest_fear: string | null
  career_score: number | null
}

type ScoreResult = {
  score: number
  summary: string
  top_risk: string
  top_opportunity: string
  harsh_truth?: string
  encouragement?: string
}

type SkillGapResult = {
  summary: string
  current_strengths: string[]
  critical_gaps: {
    skill: string
    why_important: string
    priority: string
    time_to_learn: string
    first_action?: string
  }[]
  recommended_learning_path: string[]
  motivational_note?: string
}

type ScoreHistoryItem = {
  id: string
  score: number
  created_at: string
}

type CheckinHistoryItem = {
  id: string
  wins: string | null
  challenges: string | null
  mood: string | null
  ai_feedback: string | null
  next_week_plan: string[] | null
  week_number: number | null
  year: number | null
  created_at: string
}

type Badge = {
  id: string
  title: string
  description: string
  unlocked: boolean
  icon: string
}

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClient()
  const { theme, toggleTheme } = useTheme()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    user_role: "",
    experience_years: "",
    skills: "",
    career_goal: "",
    biggest_fear: "",
  })

  const [generatingScore, setGeneratingScore] = useState(false)
  const [scoreResult, setScoreResult] = useState<ScoreResult | null>(null)
  const [scoreError, setScoreError] = useState<string | null>(null)
  const [scoreLoadingText, setScoreLoadingText] = useState("Analyzing...")

  const [generatingSkills, setGeneratingSkills] = useState(false)
  const [skillResult, setSkillResult] = useState<SkillGapResult | null>(null)
  const [skillError, setSkillError] = useState<string | null>(null)
  const [skillLoadingText, setSkillLoadingText] = useState("Analyzing skills...")

  const [scoreHistory, setScoreHistory] = useState<ScoreHistoryItem[]>([])
  const [scoresForGraph, setScoresForGraph] = useState<ScoreHistoryItem[]>([])
  const [checkinHistory, setCheckinHistory] = useState<CheckinHistoryItem[]>([])

  const [currentStreak, setCurrentStreak] = useState(0)
  const [hasCheckedInThisWeek, setHasCheckedInThisWeek] = useState(true)
  const [scoreTrend, setScoreTrend] = useState<{ diff: number; direction: "up" | "down" | "same" } | null>(null)
  const [pulseCompleted, setPulseCompleted] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/login")
        return
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()

      setProfile(profileData)

      if (profileData) {
        setForm({
          user_role: profileData.user_role || "",
          experience_years: profileData.experience_years?.toString() || "",
          skills: profileData.skills?.join(", ") || "",
          career_goal: profileData.career_goal || "",
          biggest_fear: profileData.biggest_fear || "",
        })
      }

      try {
        const res = await fetch("/api/history")
        const historyData = await res.json()

        if (res.ok) {
          const scores = historyData.scores || []
          const graphScores = historyData.scoresForGraph || []
          const checkins = historyData.checkins || []

          setScoreHistory(scores)
          setScoresForGraph(graphScores)
          setCheckinHistory(checkins)

          if (scores.length >= 2) {
            const latest = scores[0].score
            const previous = scores[1].score
            const diff = latest - previous
            setScoreTrend({
              diff: Math.abs(diff),
              direction: diff > 0 ? "up" : diff < 0 ? "down" : "same",
            })
          }

          calculateStreakAndThisWeek(checkins)
        }
      } catch (err) {
        console.error("Failed to load history", err)
      }

      try {
        const pulseRes = await fetch("/api/daily-pulse")
        const pulseData = await pulseRes.json()
        setPulseCompleted(pulseData.completed)
      } catch (err) {
        console.error("Failed to check pulse", err)
      }

      setTimeout(() => setLoading(false), 400)
    }

    loadData()
  }, [router, supabase])

  const getWeekNumber = (date: Date) => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1)
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)
  }

  const calculateStreakAndThisWeek = (checkins: CheckinHistoryItem[]) => {
    if (checkins.length === 0) {
      setCurrentStreak(0)
      setHasCheckedInThisWeek(false)
      return
    }

    const now = new Date()
    const currentWeek = getWeekNumber(now)
    const currentYear = now.getFullYear()

    const checkedThisWeek = checkins.some(
      (c) => c.week_number === currentWeek && c.year === currentYear
    )
    setHasCheckedInThisWeek(checkedThisWeek)

    let streak = 0
    let weekToCheck = currentWeek
    let yearToCheck = currentYear

    const sorted = [...checkins].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )

    for (let i = 0; i < 20; i++) {
      const found = sorted.find(
        (c) => c.week_number === weekToCheck && c.year === yearToCheck
      )

      if (found) {
        streak++
        weekToCheck--
        if (weekToCheck < 1) {
          weekToCheck = 52
          yearToCheck--
        }
      } else {
        if (i === 0 && !checkedThisWeek) {
          weekToCheck--
          if (weekToCheck < 1) {
            weekToCheck = 52
            yearToCheck--
          }
          continue
        }
        break
      }
    }

    setCurrentStreak(streak)
  }

  const getBadges = (): Badge[] => {
    const totalCheckins = checkinHistory.length
    const totalScores = scoreHistory.length
    const bestScore = scoreHistory.length > 0 ? Math.max(...scoreHistory.map((s) => s.score)) : 0

    return [
      {
        id: "first_score",
        title: "First Insight",
        description: "Generated your first Career Health Score",
        unlocked: totalScores >= 1,
        icon: "📊",
      },
      {
        id: "streak_3",
        title: "Consistent",
        description: "Maintained a 3-week check-in streak",
        unlocked: currentStreak >= 3,
        icon: "🔥",
      },
      {
        id: "score_70",
        title: "Strong Position",
        description: "Reached a Career Score of 70+",
        unlocked: bestScore >= 70,
        icon: "💪",
      },
      {
        id: "checkin_5",
        title: "Self-Aware",
        description: "Completed 5 weekly check-ins",
        unlocked: totalCheckins >= 5,
        icon: "🧠",
      },
      {
        id: "skill_gap",
        title: "Clarity Seeker",
        description: "Ran your first Skill Gap Analysis",
        unlocked: !!skillResult,
        icon: "🎯",
      },
      {
        id: "high_streak",
        title: "Unstoppable",
        description: "Reached a 6-week streak",
        unlocked: currentStreak >= 6,
        icon: "⚡",
      },
    ]
  }

  const renderScoreGraph = () => {
    if (scoresForGraph.length < 2) {
      return (
        <div className="h-32 sm:h-40 flex items-center justify-center text-sm text-slate-400 dark:text-slate-500">
          Generate more scores to see your progress graph
        </div>
      )
    }

    const width = 500
    const height = 160
    const padding = 20

    const scores = scoresForGraph.map((s) => s.score)
    const minScore = Math.min(...scores) - 5
    const maxScore = Math.max(...scores) + 5

    const points = scoresForGraph.map((item, index) => {
      const x = padding + (index / (scoresForGraph.length - 1)) * (width - padding * 2)
      const y =
        height -
        padding -
        ((item.score - minScore) / (maxScore - minScore)) * (height - padding * 2)
      return `${x},${y}`
    })

    const pathD = `M ${points.join(" L ")}`

    return (
      <div className="w-full overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-32 sm:h-40">
          <line
            x1={padding}
            y1={height - padding}
            x2={width - padding}
            y2={height - padding}
            className="stroke-slate-200 dark:stroke-slate-600"
          />
          <line
            x1={padding}
            y1={padding}
            x2={padding}
            y2={height - padding}
            className="stroke-slate-200 dark:stroke-slate-600"
          />

          <path
            d={`${pathD} L ${width - padding},${height - padding} L ${padding},${height - padding} Z`}
            fill="url(#gradient)"
            opacity="0.15"
          />

          <path
            d={pathD}
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-slate-900 dark:text-white"
          />

          {scoresForGraph.map((item, index) => {
            const x = padding + (index / (scoresForGraph.length - 1)) * (width - padding * 2)
            const y =
              height -
              padding -
              ((item.score - minScore) / (maxScore - minScore)) * (height - padding * 2)
            return (
              <circle
                key={item.id}
                cx={x}
                cy={y}
                r="4"
                fill="currentColor"
                className="text-slate-900 dark:text-white"
              />
            )
          })}

          <defs>
            <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="currentColor" className="text-slate-900 dark:text-white" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0" className="text-slate-900 dark:text-white" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    )
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        alert("You are not logged in")
        setSaving(false)
        return
      }

      const skillsArray = form.skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)

      const updates = {
        user_role: form.user_role || null,
        experience_years: form.experience_years ? Number(form.experience_years) : null,
        skills: skillsArray,
        career_goal: form.career_goal || null,
        biggest_fear: form.biggest_fear || null,
        full_name: user.user_metadata?.full_name || null,
        email: user.email,
      }

      let { data, error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", user.id)
        .select()
        .single()

      if (error || !data) {
        const { data: inserted, error: insertError } = await supabase
          .from("profiles")
          .insert({ id: user.id, ...updates })
          .select()
          .single()

        if (insertError) {
          alert("Failed to save: " + insertError.message)
          setSaving(false)
          return
        }
        data = inserted
      }

      setProfile(data)
      setEditing(false)
      alert("Profile saved successfully!")
    } catch (err: any) {
      alert("Something went wrong: " + err.message)
    } finally {
      setSaving(false)
    }
  }

  const generateScore = async () => {
    setGeneratingScore(true)
    setScoreError(null)

    const messages = [
      "Analyzing your profile...",
      "Checking market trends...",
      "Evaluating skill relevance...",
      "Calculating your score...",
    ]

    let i = 0
    const interval = setInterval(() => {
      setScoreLoadingText(messages[i % messages.length])
      i++
    }, 900)

    try {
      const res = await fetch("/api/career-score", { method: "POST" })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || "Failed to generate score")

      setScoreResult(data)
      if (profile) setProfile({ ...profile, career_score: data.score })

      const historyRes = await fetch("/api/history")
      const historyData = await historyRes.json()
      if (historyRes.ok) {
        setScoreHistory(historyData.scores || [])
        setScoresForGraph(historyData.scoresForGraph || [])

        if (historyData.scores?.length >= 2) {
          const latest = historyData.scores[0].score
          const previous = historyData.scores[1].score
          const diff = latest - previous
          setScoreTrend({
            diff: Math.abs(diff),
            direction: diff > 0 ? "up" : diff < 0 ? "down" : "same",
          })
        }
      }
    } catch (err: any) {
      setScoreError(err.message)
    } finally {
      clearInterval(interval)
      setGeneratingScore(false)
      setScoreLoadingText("Analyzing...")
    }
  }

  const generateSkillGap = async () => {
    setGeneratingSkills(true)
    setSkillError(null)

    const messages = [
      "Reviewing your current skills...",
      "Comparing with market demand...",
      "Identifying critical gaps...",
      "Building your learning path...",
    ]

    let i = 0
    const interval = setInterval(() => {
      setSkillLoadingText(messages[i % messages.length])
      i++
    }, 900)

    try {
      const res = await fetch("/api/skill-gap", { method: "POST" })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || "Failed to analyze skills")

      setSkillResult(data)
    } catch (err: any) {
      setSkillError(err.message)
    } finally {
      clearInterval(interval)
      setGeneratingSkills(false)
      setSkillLoadingText("Analyzing skills...")
    }
  }

  const handleExportPDF = () => {
    generateCareerReport({
      fullName: profile?.full_name || "User",
      role: profile?.user_role || "Professional",
      experience: profile?.experience_years?.toString() || "0",
      score: scoreResult?.score || profile?.career_score || 0,
      summary: scoreResult?.summary,
      topRisk: scoreResult?.top_risk,
      topOpportunity: scoreResult?.top_opportunity,
      harshTruth: scoreResult?.harsh_truth,
      encouragement: scoreResult?.encouragement,
      strengths: skillResult?.current_strengths,
      gaps: skillResult?.critical_gaps?.map((g) => ({
        skill: g.skill,
        priority: g.priority,
        time_to_learn: g.time_to_learn,
      })),
      careerGoal:
        profile?.career_goal === "get_promoted"
          ? "Secure a promotion / move to mid-level engineer"
          : profile?.career_goal === "higher_salary"
          ? "Significantly increase salary"
          : profile?.career_goal || "Career growth",
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-10 h-10 border-4 border-slate-200 dark:border-slate-700 rounded-full"></div>
            <div className="w-10 h-10 border-4 border-slate-800 dark:border-white border-t-transparent rounded-full absolute top-0 left-0 animate-spin"></div>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Loading FutureProof...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors">
      {/* Header */}
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <div className="font-bold text-lg sm:text-xl tracking-tight text-slate-900 dark:text-white">
            FutureProof
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-sm text-slate-600 dark:text-slate-300 hidden sm:inline truncate max-w-[120px]">
              {profile?.full_name || "User"}
            </span>

            <button
              onClick={toggleTheme}
              className="text-sm border border-slate-200 dark:border-slate-600 px-2.5 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              title="Toggle dark mode"
            >
              {theme === "light" ? "🌙" : "☀️"}
            </button>

            <button
              onClick={handleLogout}
              className="text-sm text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* Welcome + Streak */}
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-1 sm:mb-2 tracking-tight">
              Welcome{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-base sm:text-lg">
              Your personal AI career coach is ready.
            </p>
          </div>

          {currentStreak > 0 && (
            <div className="bg-orange-50 dark:bg-orange-900/30 border border-orange-100 dark:border-orange-800 text-orange-800 dark:text-orange-300 px-3 py-1.5 rounded-xl text-sm font-medium self-start">
              🔥 {currentStreak} week streak
            </div>
          )}
        </div>

        {/* Daily Career Pulse */}
        {!pulseCompleted && (
          <DailyPulse onComplete={() => setPulseCompleted(true)} />
        )}

        {/* Weekly Check-in Prompt */}
        {!hasCheckedInThisWeek && (
          <div className="bg-slate-900 dark:bg-slate-800 text-white rounded-2xl p-4 sm:p-5 mb-5 sm:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="font-medium text-sm sm:text-base">You haven’t checked in this week</p>
              <p className="text-slate-300 text-sm mt-1">
                Take 2 minutes to reflect and get your plan.
              </p>
            </div>
            <Link
              href="/checkin"
              className="bg-white text-slate-900 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-100 transition whitespace-nowrap w-full sm:w-auto text-center"
            >
              Do Weekly Check-in →
            </Link>
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 sm:p-6 mb-5 sm:mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-4 sm:mb-5">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Your Profile</h2>
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="text-sm text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                Edit
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => setEditing(false)}
                  className="text-sm border border-slate-200 dark:border-slate-600 px-3 py-1.5 rounded-lg dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="text-sm bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-3 py-1.5 rounded-lg disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            )}
          </div>

          {editing ? (
            <div className="space-y-3">
              <input
                type="text"
                value={form.user_role}
                onChange={(e) => setForm({ ...form, user_role: e.target.value })}
                placeholder="Current Role"
                className="w-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 rounded-lg px-3 py-2.5 text-sm dark:text-white"
              />
              <input
                type="number"
                value={form.experience_years}
                onChange={(e) => setForm({ ...form, experience_years: e.target.value })}
                placeholder="Years of Experience"
                className="w-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 rounded-lg px-3 py-2.5 text-sm dark:text-white"
              />
              <input
                type="text"
                value={form.skills}
                onChange={(e) => setForm({ ...form, skills: e.target.value })}
                placeholder="Skills (comma separated)"
                className="w-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 rounded-lg px-3 py-2.5 text-sm dark:text-white"
              />
              <select
                value={form.career_goal}
                onChange={(e) => setForm({ ...form, career_goal: e.target.value })}
                className="w-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 rounded-lg px-3 py-2.5 text-sm dark:text-white"
              >
                <option value="">Select a goal</option>
                <option value="get_promoted">Get promoted</option>
                <option value="switch_career">Switch career</option>
                <option value="higher_salary">Higher salary</option>
                <option value="survive_ai">Survive AI / stay relevant</option>
                <option value="freelance">Become a successful freelancer</option>
              </select>
              <textarea
                value={form.biggest_fear}
                onChange={(e) => setForm({ ...form, biggest_fear: e.target.value })}
                placeholder="Biggest Career Fear"
                rows={3}
                className="w-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 rounded-lg px-3 py-2.5 text-sm dark:text-white"
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-500 dark:text-slate-400 mb-0.5">Role</p>
                <p className="font-medium text-slate-900 dark:text-white">
                  {profile?.user_role || "Not set"}
                </p>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400 mb-0.5">Experience</p>
                <p className="font-medium text-slate-900 dark:text-white">
                  {profile?.experience_years ? `${profile.experience_years} years` : "Not set"}
                </p>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400 mb-0.5">Goal</p>
                <p className="font-medium text-slate-900 dark:text-white">
                  {profile?.career_goal || "Not set"}
                </p>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400 mb-0.5">Skills</p>
                <p className="font-medium text-slate-900 dark:text-white">
                  {profile?.skills?.join(", ") || "Not set"}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Career Score */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 sm:p-6 mb-5 sm:mb-6 shadow-sm">
          <div className="flex items-start justify-between gap-3 mb-1">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Career Health Score
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Based on your skills, role and market
              </p>
            </div>

            {scoreTrend && scoreTrend.direction !== "same" && (
              <div
                className={`text-xs sm:text-sm font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${
                  scoreTrend.direction === "up"
                    ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                    : "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                }`}
              >
                {scoreTrend.direction === "up" ? "↑" : "↓"} {scoreTrend.diff} pts
              </div>
            )}
          </div>

          <div className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white mb-5 mt-3">
            {scoreResult?.score ?? profile?.career_score ?? "—"}
          </div>

          <div className="mb-5">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">
              Progress Over Time
            </h3>
            {renderScoreGraph()}
          </div>

          {scoreResult && (
            <div className="space-y-3 mb-5">
              <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
                {scoreResult.summary}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 rounded-xl p-3.5">
                  <p className="text-xs font-semibold uppercase tracking-wide mb-1 opacity-80">
                    Top Risk
                  </p>
                  <p className="text-sm">{scoreResult.top_risk}</p>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300 rounded-xl p-3.5">
                  <p className="text-xs font-semibold uppercase tracking-wide mb-1 opacity-80">
                    Top Opportunity
                  </p>
                  <p className="text-sm">{scoreResult.top_opportunity}</p>
                </div>
              </div>

              {scoreResult.harsh_truth && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-xl p-3.5">
                  <p className="text-xs font-semibold text-amber-800 dark:text-amber-300 uppercase mb-1">
                    Harsh Truth
                  </p>
                  <p className="text-sm text-amber-900 dark:text-amber-200">
                    {scoreResult.harsh_truth}
                  </p>
                </div>
              )}

              {scoreResult.encouragement && (
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200 italic">
                  “{scoreResult.encouragement}”
                </p>
              )}
            </div>
          )}

          {scoreError && <p className="text-red-500 text-sm mb-4">{scoreError}</p>}

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={generateScore}
              disabled={generatingScore}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-800 dark:hover:bg-slate-100 disabled:opacity-60"
            >
              {generatingScore && (
                <span className="w-4 h-4 border-2 border-white/30 dark:border-slate-900/30 border-t-white dark:border-t-slate-900 rounded-full animate-spin" />
              )}
              {generatingScore ? scoreLoadingText : "Generate Career Score"}
            </button>

            <button
              onClick={handleExportPDF}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            >
              Export PDF Report
            </button>
          </div>
        </div>

        {/* Skill Gap */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 sm:p-6 mb-5 sm:mb-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            Skill Gap Analysis
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 mb-4">
            See exactly which skills you need next
          </p>

          {skillResult ? (
            <div className="space-y-5">
              <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
                {skillResult.summary}
              </p>

              {skillResult.motivational_note && (
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200 italic">
                  “{skillResult.motivational_note}”
                </p>
              )}

              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">
                  Current Strengths
                </h3>
                <div className="flex flex-wrap gap-2">
                  {skillResult.current_strengths.map((skill) => (
                    <span
                      key={skill}
                      className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs font-medium px-2.5 py-1 rounded-full"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2.5">
                  Critical Gaps
                </h3>
                <div className="space-y-3">
                  {skillResult.critical_gaps.map((gap) => (
                    <div
                      key={gap.skill}
                      className="border border-slate-200 dark:border-slate-600 rounded-xl p-3.5"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm text-slate-900 dark:text-white">
                          {gap.skill}
                        </span>
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            gap.priority === "High"
                              ? "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300"
                              : gap.priority === "Medium"
                              ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300"
                              : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                          }`}
                        >
                          {gap.priority}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                        {gap.why_important}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mb-2">
                        Time to learn: {gap.time_to_learn}
                      </p>
                      {gap.first_action && (
                        <p className="text-xs bg-slate-50 dark:bg-slate-700/50 rounded-lg px-3 py-2 text-slate-700 dark:text-slate-300">
                          <span className="font-medium">First action:</span> {gap.first_action}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <>
              {skillError && <p className="text-red-500 text-sm mb-4">{skillError}</p>}
              <button
                onClick={generateSkillGap}
                disabled={generatingSkills}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-5 py-2.5 rounded-xl text-sm font-medium disabled:opacity-60"
              >
                {generatingSkills && (
                  <span className="w-4 h-4 border-2 border-white/30 dark:border-slate-900/30 border-t-white dark:border-t-slate-900 rounded-full animate-spin" />
                )}
                {generatingSkills ? skillLoadingText : "Analyze My Skill Gaps"}
              </button>
            </>
          )}
        </div>

        {/* Achievements */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 sm:p-6 mb-5 sm:mb-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-1">
            Achievements
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            Unlock badges as you progress
          </p>

          <div className="grid grid-cols-2 gap-3">
            {getBadges().map((badge) => (
              <div
                key={badge.id}
                className={`rounded-xl p-3 sm:p-4 border text-center transition ${
                  badge.unlocked
                    ? "bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600"
                    : "bg-slate-50/50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700 opacity-50"
                }`}
              >
                <div className="text-xl sm:text-2xl mb-1.5">{badge.icon}</div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  {badge.title}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                  {badge.description}
                </p>
                {badge.unlocked && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1.5">
                    Unlocked
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Career Roadmap */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 sm:p-6 mb-5 sm:mb-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-1">
            Career Roadmap
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
            Your path from where you are to where you want to be
          </p>

          <div className="relative">
            <div className="absolute left-3.5 top-2 bottom-2 w-0.5 bg-slate-200 dark:bg-slate-600"></div>

            <div className="space-y-6">
              <div className="relative flex gap-3.5">
                <div className="w-7 h-7 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center text-xs font-bold z-10 shrink-0">
                  1
                </div>
                <div>
                  <p className="font-medium text-slate-900 dark:text-white text-sm">
                    Current Stage
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                    {profile?.user_role || "Professional"} • {profile?.experience_years || 0} years
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                    Score: {profile?.career_score || scoreResult?.score || "—"}
                  </p>
                </div>
              </div>

              <div className="relative flex gap-3.5">
                <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 flex items-center justify-center text-xs font-bold z-10 shrink-0">
                  2
                </div>
                <div>
                  <p className="font-medium text-slate-900 dark:text-white text-sm">
                    Next 3 Months
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                    Close critical skill gaps and build execution confidence
                  </p>
                </div>
              </div>

              <div className="relative flex gap-3.5">
                <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 flex items-center justify-center text-xs font-bold z-10 shrink-0">
                  3
                </div>
                <div>
                  <p className="font-medium text-slate-900 dark:text-white text-sm">
                    6–12 Months
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                    Own full subsystems and demonstrate promotion-ready impact
                  </p>
                </div>
              </div>

              <div className="relative flex gap-3.5">
                <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold z-10 shrink-0">
                  ★
                </div>
                <div>
                  <p className="font-medium text-slate-900 dark:text-white text-sm">Your Goal</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                    {profile?.career_goal === "get_promoted"
                      ? "Secure a promotion / move to mid-level engineer"
                      : profile?.career_goal === "higher_salary"
                      ? "Significantly increase your salary"
                      : profile?.career_goal === "survive_ai"
                      ? "Become AI-resilient and highly valuable"
                      : profile?.career_goal || "Achieve your career goal"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/checkin"
            className="group bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 hover:border-slate-400 dark:hover:border-slate-500 hover:shadow-md transition-all"
          >
            <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
              Weekly Check-in
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
              Reflect on your week and get a personalized plan
            </p>
            <span className="text-sm font-medium text-slate-900 dark:text-white group-hover:underline">
              Start Check-in →
            </span>
          </Link>

          <Link
            href="/interview"
            className="group bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 hover:border-slate-400 dark:hover:border-slate-500 hover:shadow-md transition-all"
          >
            <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
              AI Mock Interview
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
              Practice real interviews with detailed feedback
            </p>
            <span className="text-sm font-medium text-slate-900 dark:text-white group-hover:underline">
              Start Practice →
            </span>
          </Link>

          <Link
            href="/resume"
            className="group bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 hover:border-slate-400 dark:hover:border-slate-500 hover:shadow-md transition-all"
          >
            <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
              Resume Optimizer
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
              Rewrite your resume for current hiring standards
            </p>
            <span className="text-sm font-medium text-slate-900 dark:text-white group-hover:underline">
              Optimize Resume →
            </span>
          </Link>

          <Link
            href="/jobs"
            className="group bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 hover:border-slate-400 dark:hover:border-slate-500 hover:shadow-md transition-all"
          >
            <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
              Job Tracker
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
              Track every application and interview in one place
            </p>
            <span className="text-sm font-medium text-slate-900 dark:text-white group-hover:underline">
              View Applications →
            </span>
          </Link>
        </div>
      </main>
    </div>
  )
}