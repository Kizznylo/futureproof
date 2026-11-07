"use client"

import { useState } from "react"

type Props = {
  onComplete: () => void
}

export default function DailyPulse({ onComplete }: Props) {
  const [step, setStep] = useState<"form" | "result">("form")
  const [loading, setLoading] = useState(false)
  const [focusScore, setFocusScore] = useState<number | null>(null)
  const [practicedSkill, setPracticedSkill] = useState<boolean | null>(null)
  const [reflection, setReflection] = useState("")
  const [aiResponse, setAiResponse] = useState("")
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!focusScore) {
      setError("Please rate your focus today")
      return
    }
    if (practicedSkill === null) {
      setError("Please answer if you practiced a skill")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/daily-pulse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          focus_score: focusScore,
          practiced_skill: practicedSkill,
          reflection: reflection.trim() || null,
        }),
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || "Failed to submit")

      setAiResponse(data.ai_response)
      setStep("result")
      onComplete()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (step === "result") {
    return (
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 sm:p-6 mb-5 sm:mb-6 shadow-sm">
        <div className="text-center mb-4">
          <div className="text-3xl mb-2">✅</div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Pulse Complete
          </h2>
        </div>

        <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed text-center mb-4">
          {aiResponse}
        </p>

        <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
          Come back tomorrow to keep your streak going.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 sm:p-6 mb-5 sm:mb-6 shadow-sm">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          Daily Career Pulse
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Takes less than 30 seconds
        </p>
      </div>

      {/* Focus Score */}
      <div className="mb-5">
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
          How focused were you on your career today?
        </p>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((score) => (
            <button
              key={score}
              onClick={() => setFocusScore(score)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition ${
                focusScore === score
                  ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                  : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
              }`}
            >
              {score}
            </button>
          ))}
        </div>
        <div className="flex justify-between text-xs text-slate-400 mt-1.5 px-1">
          <span>Low</span>
          <span>High</span>
        </div>
      </div>

      {/* Practiced Skill */}
      <div className="mb-5">
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
          Did you practice any skill today?
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setPracticedSkill(true)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition ${
              practicedSkill === true
                ? "bg-emerald-600 text-white"
                : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
            }`}
          >
            Yes
          </button>
          <button
            onClick={() => setPracticedSkill(false)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition ${
              practicedSkill === false
                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
            }`}
          >
            No
          </button>
        </div>
      </div>

      {/* Reflection */}
      <div className="mb-5">
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          One sentence: What moved you forward today? (optional)
        </p>
        <textarea
          value={reflection}
          onChange={(e) => setReflection(e.target.value)}
          rows={2}
          placeholder="e.g. Spent 45 minutes on GD&T practice..."
          className="w-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 rounded-xl px-3 py-2.5 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white"
        />
      </div>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-3 rounded-xl text-sm font-medium hover:bg-slate-800 dark:hover:bg-slate-100 disabled:opacity-60 transition flex items-center justify-center gap-2"
      >
        {loading && (
          <span className="w-4 h-4 border-2 border-white/30 dark:border-slate-900/30 border-t-white dark:border-t-slate-900 rounded-full animate-spin" />
        )}
        {loading ? "Getting your coaching..." : "Complete Pulse"}
      </button>
    </div>
  )
}