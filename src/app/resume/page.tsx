"use client"

import { useState } from "react"
import Link from "next/link"

type OptimizeResult = {
  optimized_resume: string
  key_improvements: string[]
  summary: string
}

export default function ResumePage() {
  const [resumeText, setResumeText] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<OptimizeResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const optimizeResume = async () => {
    if (resumeText.trim().length < 50) {
      setError("Please paste a longer resume (at least a few paragraphs)")
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch("/api/resume-optimizer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText }),
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || "Failed to optimize resume")

      setResult(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = () => {
    if (result?.optimized_resume) {
      navigator.clipboard.writeText(result.optimized_resume)
      alert("Optimized resume copied to clipboard!")
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="font-bold text-xl tracking-tight">
            FutureProof
          </Link>
          <Link
            href="/dashboard"
            className="text-sm text-gray-500 hover:text-black transition"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Resume Optimizer</h1>
          <p className="text-gray-500">
            Paste your current resume and get a stronger, modern version tailored to your goals.
          </p>
        </div>

        {!result ? (
          <div className="bg-white border rounded-2xl p-8">
            <label className="block text-sm font-medium mb-2">
              Paste your resume here
            </label>
            <textarea
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder="Paste your full resume text here..."
              rows={16}
              className="w-full border rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-black resize-none text-sm"
              disabled={loading}
            />

            {error && (
              <p className="text-red-500 text-sm mt-3">{error}</p>
            )}

            <button
              onClick={optimizeResume}
              disabled={loading || resumeText.trim().length < 30}
              className="mt-6 bg-black text-white px-8 py-3 rounded-xl font-medium hover:bg-gray-800 disabled:opacity-50 transition"
            >
              {loading ? "Optimizing your resume..." : "Optimize Resume"}
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Summary */}
            <div className="bg-white border rounded-2xl p-6">
              <h2 className="text-lg font-semibold mb-2">Summary of Changes</h2>
              <p className="text-gray-700 text-sm">{result.summary}</p>
            </div>

            {/* Key Improvements */}
            <div className="bg-white border rounded-2xl p-6">
              <h2 className="text-lg font-semibold mb-4">Key Improvements</h2>
              <ul className="space-y-2">
                {result.key_improvements.map((item, index) => (
                  <li key={index} className="flex gap-2 text-sm">
                    <span className="text-green-600 font-bold">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Optimized Resume */}
            <div className="bg-white border rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Optimized Resume</h2>
                <button
                  onClick={copyToClipboard}
                  className="text-sm bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg transition"
                >
                  Copy to Clipboard
                </button>
              </div>

              <div className="bg-gray-50 rounded-xl p-5 text-sm whitespace-pre-wrap leading-relaxed border">
                {result.optimized_resume}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setResult(null)
                  setResumeText("")
                }}
                className="flex-1 border py-3 rounded-xl font-medium hover:bg-gray-50 transition"
              >
                Optimize Another Resume
              </button>
              <Link
                href="/dashboard"
                className="flex-1 bg-black text-white py-3 rounded-xl font-medium text-center hover:bg-gray-800 transition"
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