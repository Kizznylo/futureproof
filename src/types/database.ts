export type UserProfile = {
  id: string
  email: string
  full_name: string | null
  user_role: string | null
  experience_years: number | null
  skills: string[] | null
  career_goal: string | null
  biggest_fear: string | null
  career_score: number | null
  onboarding_completed: boolean
  created_at: string
  updated_at: string
}

export type RoadmapItem = {
  id: string
  user_id: string
  title: string
  description: string
  priority: "high" | "medium" | "low"
  status: "pending" | "in_progress" | "completed"
  due_date: string | null
  created_at: string
}