import Link from "next/link";

export default function Home() {
  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6 md:p-8">
      <article className="glass-panel p-8">
        <p className="mb-3 inline-flex rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs text-white/80">
          Desktop-first foundation
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-white md:text-5xl">Vyb Desktop</h1>
        <p className="mt-4 max-w-2xl text-base text-white/80 md:text-lg">
          Premium cross-platform social ecosystem scaffolded for Windows, macOS, and Linux with
          elegant glass visuals and strict production guardrails.
        </p>
        <div className="mt-6 flex flex-wrap gap-3 text-sm">
          <Link
            href="/sign-in"
            className="rounded-full bg-white px-5 py-2 font-medium text-black"
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="rounded-full border border-white/25 px-5 py-2 font-medium text-white/90 hover:bg-white/10"
          >
            Create account
          </Link>
          <Link href="/feed" className="rounded-full px-5 py-2 font-medium text-white/80 hover:text-white">
            Open feed
          </Link>
        </div>
      </article>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          "Task 0: quality gates + CI + env validation",
          "Task 1: design tokens + glass shell + providers",
          "Next: schema + auth + onboarding + feed",
        ].map((item) => (
          <article key={item} className="glass-panel p-5 text-sm text-white/90">
            {item}
          </article>
        ))}
      </div>

      <article className="glass-panel p-6">
        <h2 className="text-xl font-semibold text-white">Next Action</h2>
        <p className="mt-2 text-white/80">
          Implement Drizzle schema and Clerk auth shell, then wire onboarding and first feed route.
        </p>
      </article>
    </section>
  );
}
