"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"

type QuestionFeedback = {
  score: number
  feedback: string
  better_answer_example: string
}

type FinalSummary = {
  overall_score: number
  strengths: string[]
  weaknesses: string[]
  advice: string
}

export default function InterviewPage() {
  const [step, setStep] = useState<"start" | "interview" | "finished">("start")
  const [difficulty, setDifficulty] = useState<"beginner" | "intermediate" | "advanced">("intermediate")
  const [questions, setQuestions] = useState<string[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answer, setAnswer] = useState("")
  const [feedbacks, setFeedbacks] = useState<QuestionFeedback[]>([])
  const [finalSummary, setFinalSummary] = useState<FinalSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Timer
  const [timeLeft, setTimeLeft] = useState(120) // 2 minutes
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Start timer when question changes
  useEffect(() => {
    if (step !== "interview") return

    setTimeLeft(120)
    if (timerRef.current) clearInterval(timerRef.current)

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [currentIndex, step])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, "0")}`
  }

  const startInterview = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/mock-interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start", difficulty }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to start interview")

      setQuestions(data.questions)
      setStep("interview")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const submitAnswer = async () => {
    if (!answer.trim()) return

    setLoading(true)
    setError(null)
    if (timerRef.current) clearInterval(timerRef.current)

    try {
      const res = await fetch("/api/mock-interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "evaluate",
          question: questions[currentIndex],
          answer,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to evaluate answer")

      const newFeedbacks = [...feedbacks, data]
      setFeedbacks(newFeedbacks)
      setAnswer("")

      if (currentIndex + 1 >= questions.length) {
        // Get final summary
        const summaryRes = await fetch("/api/mock-interview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "summary",
            feedbacks: newFeedbacks,
          }),
        })
        const summaryData = await summaryRes.json()
        setFinalSummary(summaryData)
        setStep("finished")
      } else {
        setCurrentIndex(currentIndex + 1)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const progress = questions.length
    ? Math.round((currentIndex / questions.length) * 100)
    : 0

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="font-bold text-xl tracking-tight">
            FutureProof
          </Link>
          <Link href="/dashboard" className="text-sm text-gray-500 hover:text-black">
            ← Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        {/* START */}
        {step === "start" && (
          <div className="bg-white border rounded-2xl p-10 text-center">
            <h1 className="text-3xl font-bold mb-3">AI Mock Interview</h1>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Practice a realistic technical interview based on your profile.
            </p>

            {/* Difficulty Selector */}
            <div className="flex justify-center gap-3 mb-8">
              {(["beginner", "intermediate", "advanced"] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => setDifficulty(level)}
                  className={`px-5 py-2 rounded-full text-sm font-medium capitalize transition ${
                    difficulty === level
                      ? "bg-black text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>

            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

            <button
              onClick={startInterview}
              disabled={loading}
              className="bg-black text-white px-10 py-3.5 rounded-xl font-medium hover:bg-gray-800 disabled:opacity-50"
            >
              {loading ? "Preparing questions..." : "Start Interview"}
            </button>
          </div>
        )}

        {/* INTERVIEW */}
        {step === "interview" && (
          <div className="space-y-6">
            {/* Progress + Timer */}
            <div className="bg-white border rounded-2xl p-5">
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium">
                  Question {currentIndex + 1} of {questions.length}
                </span>
                <div className="flex items-center gap-4">
                  <span className="text-gray-500">{progress}%</span>
                  <span className={`font-mono font-medium ${timeLeft <= 30 ? "text-red-500" : "text-gray-700"}`}>
                    {formatTime(timeLeft)}
                  </span>
                </div>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className="bg-black h-2 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Question */}
            <div className="bg-white border rounded-2xl p-8">
              <p className="text-lg font-medium leading-relaxed mb-6">
                {questions[currentIndex]}
              </p>

              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Type your answer here..."
                rows={7}
                className="w-full border rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-black resize-none mb-4"
                disabled={loading}
              />

              {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

              <button
                onClick={submitAnswer}
                disabled={loading || !answer.trim()}
                className="w-full bg-black text-white py-3.5 rounded-xl font-medium hover:bg-gray-800 disabled:opacity-50"
              >
                {loading ? "Evaluating..." : "Submit Answer"}
              </button>
            </div>
          </div>
        )}

        {/* FINISHED */}
        {step === "finished" && finalSummary && (
          <div className="bg-white border rounded-2xl p-8">
            <div className="text-center mb-10">
              <h1 className="text-3xl font-bold mb-2">Interview Complete</h1>
              <p className="text-gray-500 mb-2">Overall Score</p>
              <div className="text-5xl font-bold">
                {finalSummary.overall_score}
                <span className="text-2xl text-gray-400">/10</span>
              </div>
            </div>

            {/* Strengths & Weaknesses */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-green-50 rounded-xl p-5">
                <h3 className="font-semibold text-green-800 mb-3">Strengths</h3>
                <ul className="space-y-2 text-sm text-green-900">
                  {finalSummary.strengths.map((s, i) => (
                    <li key={i}>• {s}</li>
                  ))}
                </ul>
              </div>
              <div className="bg-red-50 rounded-xl p-5">
                <h3 className="font-semibold text-red-800 mb-3">Areas to Improve</h3>
                <ul className="space-y-2 text-sm text-red-900">
                  {finalSummary.weaknesses.map((w, i) => (
                    <li key={i}>• {w}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-5 mb-8">
              <h3 className="font-semibold mb-2">Advice</h3>
              <p className="text-sm text-gray-700">{finalSummary.advice}</p>
            </div>

            {/* Detailed Feedback */}
            <div className="space-y-5 mb-10">
              <h3 className="font-semibold">Detailed Feedback</h3>
              {feedbacks.map((fb, i) => (
                <div key={i} className="border rounded-xl p-5">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-500">Question {i + 1}</span>
                    <span className="font-bold">{fb.score}/10</span>
                  </div>
                  <p className="text-sm text-gray-700 mb-3">{fb.feedback}</p>
                  <div className="bg-green-50 rounded-lg p-3 text-sm">
                    <span className="font-medium text-green-700">Stronger example:</span>
                    <p className="text-green-900 mt-1">{fb.better_answer_example}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => {
                  setStep("start")
                  setQuestions([])
                  setCurrentIndex(0)
                  setFeedbacks([])
                  setFinalSummary(null)
                  setAnswer("")
                }}
                className="flex-1 border py-3.5 rounded-xl font-medium hover:bg-gray-50"
              >
                Practice Again
              </button>
              <Link
                href="/dashboard"
                className="flex-1 bg-black text-white py-3.5 rounded-xl font-medium text-center hover:bg-gray-800"
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