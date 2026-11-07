"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    user_role: "",
    experience_years: "",
    skills: "",
    career_goal: "",
    biggest_fear: "",
  })

  const updateForm = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleFinish = async () => {
    setLoading(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push("/login")
      return
    }

    const skillsArray = form.skills
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)

    // 1. Update user metadata
    await supabase.auth.updateUser({
      data: {
        user_role: form.user_role,
        experience_years: Number(form.experience_years),
        skills: skillsArray,
        career_goal: form.career_goal,
        biggest_fear: form.biggest_fear,
        onboarding_completed: true,
      },
    })

    // 2. Update the profiles table
    const { error } = await supabase
      .from("profiles")
      .update({
        user_role: form.user_role,
        experience_years: Number(form.experience_years),
        skills: skillsArray,
        career_goal: form.career_goal,
        biggest_fear: form.biggest_fear,
        onboarding_completed: true,
        full_name: user.user_metadata?.full_name || null,
      })
      .eq("id", user.id)

    if (error) {
      console.error("Error saving profile:", error)
      alert("Something went wrong while saving your profile. Please try again.")
      setLoading(false)
      return
    }

    router.push("/dashboard")
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-xl w-full bg-white rounded-2xl shadow-sm border p-8">
        <div className="mb-8">
          <div className="flex gap-2 mb-4">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1.5 flex-1 rounded-full ${
                  s <= step ? "bg-black" : "bg-gray-200"
                }`}
              />
            ))}
          </div>
          <h1 className="text-2xl font-bold">Let’s personalize FutureProof</h1>
          <p className="text-gray-500 mt-1">Step {step} of 3</p>
        </div>

        {step === 1 && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-1">
                What is your current role?
              </label>
              <input
                type="text"
                value={form.user_role}
                onChange={(e) => updateForm("user_role", e.target.value)}
                placeholder="e.g. Marketing Manager, Software Engineer..."
                className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Years of experience
              </label>
              <input
                type="number"
                value={form.experience_years}
                onChange={(e) => updateForm("experience_years", e.target.value)}
                placeholder="e.g. 4"
                className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!form.user_role || !form.experience_years}
              className="w-full bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 disabled:opacity-40"
            >
              Continue
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-1">
                Main skills (comma separated)
              </label>
              <textarea
                value={form.skills}
                onChange={(e) => updateForm("skills", e.target.value)}
                placeholder="e.g. React, Python, SEO, Project Management, Excel..."
                rows={3}
                className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                What is your main career goal?
              </label>
              <select
                value={form.career_goal}
                onChange={(e) => updateForm("career_goal", e.target.value)}
                className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              >
                <option value="">Select a goal</option>
                <option value="get_promoted">Get promoted</option>
                <option value="switch_career">Switch career</option>
                <option value="higher_salary">Higher salary</option>
                <option value="survive_ai">Survive AI / stay relevant</option>
                <option value="freelance">Become a successful freelancer</option>
              </select>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 border py-3 rounded-lg font-medium hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!form.skills || !form.career_goal}
                className="flex-1 bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 disabled:opacity-40"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-1">
                What is your biggest career fear right now?
              </label>
              <textarea
                value={form.biggest_fear}
                onChange={(e) => updateForm("biggest_fear", e.target.value)}
                placeholder="e.g. AI will replace my job, I am falling behind, I don't know what skills to learn..."
                rows={4}
                className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="flex-1 border py-3 rounded-lg font-medium hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={handleFinish}
                disabled={!form.biggest_fear || loading}
                className="flex-1 bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 disabled:opacity-40"
              >
                {loading ? "Saving..." : "Finish & Go to Dashboard"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}