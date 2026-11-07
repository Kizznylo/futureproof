"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

type Application = {
  id: string
  company: string
  position: string
  status: string
  location: string | null
  salary_range: string | null
  job_url: string | null
  notes: string | null
  applied_date: string
  interview_date: string | null
}

const STATUS_OPTIONS = [
  { value: "applied", label: "Applied", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
  { value: "interview", label: "Interview", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" },
  { value: "offer", label: "Offer", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" },
  { value: "rejected", label: "Rejected", color: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" },
  { value: "withdrawn", label: "Withdrawn", color: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300" },
]

export default function JobsPage() {
  const router = useRouter()
  const supabase = createClient()

  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    company: "",
    position: "",
    status: "applied",
    location: "",
    salary_range: "",
    job_url: "",
    notes: "",
    applied_date: "", // ← fixed: no new Date() here
  })

  // Set today's date only on the client
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0]
    setForm((prev) => ({ ...prev, applied_date: today }))
  }, [])

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/login")
        return
      }

      await fetchApplications()
      setLoading(false)
    }

    load()
  }, [router, supabase])

  const fetchApplications = async () => {
    try {
      const res = await fetch("/api/job-applications")
      const data = await res.json()
      if (res.ok) {
        setApplications(data.applications || [])
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleSubmit = async () => {
    if (!form.company.trim() || !form.position.trim()) {
      setError("Company and Position are required")
      return
    }

    setSaving(true)
    setError(null)

    try {
      const res = await fetch("/api/job-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || "Failed to save")

      setApplications([data.application, ...applications])
      setShowForm(false)

      // Reset form + set today's date again
      const today = new Date().toISOString().split("T")[0]
      setForm({
        company: "",
        position: "",
        status: "applied",
        location: "",
        salary_range: "",
        job_url: "",
        notes: "",
        applied_date: today,
      })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch("/api/job-applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      })

      if (res.ok) {
        setApplications((prev) =>
          prev.map((app) => (app.id === id ? { ...app, status } : app))
        )
      }
    } catch (err) {
      console.error(err)
    }
  }

  const deleteApplication = async (id: string) => {
    if (!confirm("Delete this application?")) return

    try {
      const res = await fetch(`/api/job-applications?id=${id}`, {
        method: "DELETE",
      })

      if (res.ok) {
        setApplications((prev) => prev.filter((app) => app.id !== id))
      }
    } catch (err) {
      console.error(err)
    }
  }

  const getStatusColor = (status: string) => {
    return STATUS_OPTIONS.find((s) => s.value === status)?.color || "bg-slate-100 text-slate-600"
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/dashboard" className="font-bold text-lg text-slate-900 dark:text-white">
            FutureProof
          </Link>
          <Link
            href="/dashboard"
            className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          >
            ← Back
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Job Applications</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Track every application in one place
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2 rounded-xl text-sm font-medium"
          >
            {showForm ? "Cancel" : "+ Add"}
          </button>
        </div>

        {/* Add Form */}
        {showForm && (
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 mb-6">
            <h2 className="font-semibold text-slate-900 dark:text-white mb-4">New Application</h2>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="Company *"
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                className="w-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 rounded-xl px-3 py-2.5 text-sm dark:text-white"
              />
              <input
                type="text"
                placeholder="Position *"
                value={form.position}
                onChange={(e) => setForm({ ...form, position: e.target.value })}
                className="w-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 rounded-xl px-3 py-2.5 text-sm dark:text-white"
              />
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 rounded-xl px-3 py-2.5 text-sm dark:text-white"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
                <input
                  type="date"
                  value={form.applied_date}
                  onChange={(e) => setForm({ ...form, applied_date: e.target.value })}
                  className="w-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 rounded-xl px-3 py-2.5 text-sm dark:text-white"
                />
              </div>
              <input
                type="text"
                placeholder="Location"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="w-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 rounded-xl px-3 py-2.5 text-sm dark:text-white"
              />
              <input
                type="text"
                placeholder="Salary range (e.g. $80k - $100k)"
                value={form.salary_range}
                onChange={(e) => setForm({ ...form, salary_range: e.target.value })}
                className="w-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 rounded-xl px-3 py-2.5 text-sm dark:text-white"
              />
              <input
                type="url"
                placeholder="Job URL"
                value={form.job_url}
                onChange={(e) => setForm({ ...form, job_url: e.target.value })}
                className="w-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 rounded-xl px-3 py-2.5 text-sm dark:text-white"
              />
              <textarea
                placeholder="Notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
                className="w-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 rounded-xl px-3 py-2.5 text-sm dark:text-white"
              />

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <button
                onClick={handleSubmit}
                disabled={saving}
                className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-2.5 rounded-xl text-sm font-medium disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save Application"}
              </button>
            </div>
          </div>
        )}

        {/* Applications List */}
        {applications.length === 0 ? (
          <div className="text-center py-16 text-slate-400 dark:text-slate-500">
            <p className="text-lg mb-2">No applications yet</p>
            <p className="text-sm">Add your first job application to start tracking</p>
          </div>
        ) : (
          <div className="space-y-3">
            {applications.map((app) => (
              <div
                key={app.id}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 sm:p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-slate-900 dark:text-white truncate">
                      {app.position}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{app.company}</p>

                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${getStatusColor(app.status)}`}>
                        {STATUS_OPTIONS.find((s) => s.value === app.status)?.label || app.status}
                      </span>
                      {app.location && (
                        <span className="text-xs text-slate-400">{app.location}</span>
                      )}
                      <span className="text-xs text-slate-400">
                        {new Date(app.applied_date).toLocaleDateString()}
                      </span>
                    </div>

                    {app.notes && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">
                        {app.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 shrink-0">
                    <select
                      value={app.status}
                      onChange={(e) => updateStatus(app.id, e.target.value)}
                      className="text-xs border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 rounded-lg px-2 py-1.5 dark:text-white"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => deleteApplication(app.id)}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}