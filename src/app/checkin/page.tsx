"use client"

import { useState } from "react"
import Link from "next/link"

type CheckinResult = {
  ai_feedback: string
  next_week_plan: string[]
  encouragement: string
}

export default function CheckinPage() {
  const [step, setStep] = useState<"form" | "result">("form")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<CheckinResult | null>(null)

  const [form, setForm] = useState({
    wins: "",
    challenges: "",
    skills_practiced: "",
    hours_invested: "",
    mood: "okay",
  })

  const handleSubmit = async () => {
    if (!form.wins && !form.challenges) {
      setError("Please share at least one win or challenge")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/weekly-checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wins: form.wins,
          challenges: form.challenges,
          skills_practiced: form.skills_practiced
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          hours_invested: Number(form.hours_invested) || 0,
          mood: form.mood,
        }),
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || "Failed to submit check-in")

      setResult(data)
      setStep("result")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-2xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="font-bold text-xl tracking-tight">
            FutureProof
          </Link>
          <Link
            href="/dashboard"
            className="text-sm text-slate-500 hover:text-slate-900"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-10">
        {step === "form" && (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              Weekly Career Check-in
            </h1>
            <p className="text-slate-500 mb-8">
              Reflect on your week. Your AI coach will give you feedback and a plan for next week.
            </p>

            <div className="space-y-5">
              {/* Wins */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  What went well this week?
                </label>
                <textarea
                  value={form.wins}
                  onChange={(e) => setForm({ ...form, wins: e.target.value })}
                  rows={3}
                  placeholder="e.g. Finished a SOLIDWORKS project, practiced GD&T..."
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              {/* Challenges */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  What was challenging?
                </label>
                <textarea
                  value={form.challenges}
                  onChange={(e) => setForm({ ...form, challenges: e.target.value })}
                  rows={3}
                  placeholder="e.g. Struggled with FEA simulation, felt behind..."
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              {/* Skills practiced */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Skills you practiced (comma separated)
                </label>
                <input
                  type="text"
                  value={form.skills_practiced}
                  onChange={(e) => setForm({ ...form, skills_practiced: e.target.value })}
                  placeholder="e.g. GD&T, SOLIDWORKS, Python"
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              {/* Hours */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Hours invested in learning this week
                </label>
                <input
                  type="number"
                  value={form.hours_invested}
                  onChange={(e) => setForm({ ...form, hours_invested: e.target.value })}
                  placeholder="e.g. 6"
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              {/* Mood */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  How are you feeling about your career this week?
                </label>
                <div className="flex gap-3">
                  {[
                    { value: "great", label: "Great", color: "bg-emerald-100 text-emerald-700" },
                    { value: "okay", label: "Okay", color: "bg-amber-100 text-amber-700" },
                    { value: "struggling", label: "Struggling", color: "bg-red-100 text-red-700" },
                  ].map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setForm({ ...form, mood: item.value })}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition ${
                        form.mood === item.value
                          ? item.color + " ring-2 ring-offset-1 ring-slate-400"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <p className="text-red-500 text-sm">{error}</p>
              )}

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-medium hover:bg-slate-800 disabled:opacity-50 transition flex items-center justify-center gap-2"
              >
                {loading && (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                {loading ? "Getting your coaching..." : "Submit Check-in"}
              </button>
            </div>
          </div>
        )}

        {/* RESULT */}
        {step === "result" && result && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm text-center">
              <p className="text-emerald-600 font-medium mb-2">Check-in Complete</p>
              <h1 className="text-2xl font-bold text-slate-900 mb-4">
                {result.encouragement}
              </h1>
              <p className="text-slate-600 leading-relaxed">
                {result.ai_feedback}
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h2 className="font-semibold text-slate-900 mb-4">Your Plan for Next Week</h2>
              <ol className="space-y-3">
                {result.next_week_plan.map((item, index) => (
                  <li key={index} className="flex gap-3 text-sm">
                    <span className="flex-shrink-0 w-6 h-6 bg-slate-900 text-white rounded-full flex items-center justify-center text-xs font-medium">
                      {index + 1}
                    </span>
                    <span className="text-slate-700 pt-0.5">{item}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => {
                  setStep("form")
                  setResult(null)
                  setForm({
                    wins: "",
                    challenges: "",
                    skills_practiced: "",
                    hours_invested: "",
                    mood: "okay",
                  })
                }}
                className="flex-1 border border-slate-200 py-3 rounded-xl font-medium hover:bg-white transition"
              >
                New Check-in
              </button>
              <Link
                href="/dashboard"
                className="flex-1 bg-slate-900 text-white py-3 rounded-xl font-medium text-center hover:bg-slate-800 transition"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}