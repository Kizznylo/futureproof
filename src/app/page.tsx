import Link from "next/link"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <header className="border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="font-bold text-xl tracking-tight text-slate-900">
            FutureProof
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm text-slate-600 hover:text-slate-900 transition"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="text-sm bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-24 text-center">
        <div className="inline-flex items-center gap-2 bg-slate-100 text-slate-700 text-sm font-medium px-4 py-1.5 rounded-full mb-8">
          <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
          AI Career Coach for 2026
        </div>

        <h1 className="text-5xl sm:text-6xl font-bold text-slate-900 tracking-tight leading-tight mb-6">
          Don’t get left behind.
          <br />
          <span className="text-slate-500">Future-proof your career.</span>
        </h1>

        <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
          Get an honest Career Health Score, discover the exact skills you need,
          practice real interviews, and get a weekly plan — all powered by AI.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/signup"
            className="w-full sm:w-auto bg-slate-900 text-white px-8 py-3.5 rounded-xl font-medium text-lg hover:bg-slate-800 transition"
          >
            Start Free →
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto border border-slate-200 text-slate-700 px-8 py-3.5 rounded-xl font-medium text-lg hover:bg-slate-50 transition"
          >
            Log in
          </Link>
        </div>

        <p className="text-sm text-slate-400 mt-6">
          No credit card required • Free to start
        </p>
      </section>

      {/* Features Grid */}
      <section className="bg-slate-50 border-y border-slate-100 py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Everything you need to stay ahead
            </h2>
            <p className="text-slate-600 max-w-xl mx-auto">
              FutureProof gives you clarity, a clear plan, and continuous coaching
              so you never fall behind.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: "Career Health Score",
                description:
                  "Get an honest 0–100 score based on your role, skills, and the current job market.",
              },
              {
                title: "Skill Gap Analysis",
                description:
                  "Know exactly which skills to learn next and how long each one will take.",
              },
              {
                title: "AI Mock Interviews",
                description:
                  "Practice real interview questions and get detailed feedback after every answer.",
              },
              {
                title: "Resume Optimizer",
                description:
                  "Turn your current resume into a stronger, modern version tailored to your goals.",
              },
              {
                title: "Weekly Check-ins",
                description:
                  "Reflect every week and receive a personalized plan and coaching feedback.",
              },
              {
                title: "Progress Tracking",
                description:
                  "Watch your Career Score and skills improve over time with clear history.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-md transition"
              >
                <h3 className="font-semibold text-slate-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              How it works
            </h2>
            <p className="text-slate-600">Simple. Fast. Actionable.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-10">
            {[
              {
                step: "01",
                title: "Tell us about yourself",
                description:
                  "Share your role, skills, experience, and biggest career fear in under 2 minutes.",
              },
              {
                step: "02",
                title: "Get your diagnosis",
                description:
                  "Receive your Career Health Score, skill gaps, and a clear picture of where you stand.",
              },
              {
                step: "03",
                title: "Improve every week",
                description:
                  "Practice interviews, optimize your resume, and follow weekly plans that move you forward.",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="text-4xl font-bold text-slate-200 mb-4">
                  {item.step}
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-slate-900 py-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Ready to future-proof your career?
          </h2>
          <p className="text-slate-300 text-lg mb-10">
            Join people who are taking control of their careers instead of waiting
            to be left behind.
          </p>
          <Link
            href="/signup"
            className="inline-block bg-white text-slate-900 px-8 py-3.5 rounded-xl font-medium text-lg hover:bg-slate-100 transition"
          >
            Get Started Free →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="font-bold text-slate-900">FutureProof</div>
          <p className="text-sm text-slate-500">
            © 2026 FutureProof. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}