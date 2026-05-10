import Link from "next/link";

export default function ProfileNotFound() {
  return (
    <section className="mx-auto max-w-md p-10 text-center">
      <article className="glass-panel p-8">
        <h1 className="text-lg font-semibold text-white">Profile not found</h1>
        <p className="mt-2 text-sm text-white/70">That username doesn&apos;t exist on Vyb yet.</p>
        <Link className="mt-6 inline-block text-sm text-white underline" href="/explore">
          Explore people
        </Link>
      </article>
    </section>
  );
}
