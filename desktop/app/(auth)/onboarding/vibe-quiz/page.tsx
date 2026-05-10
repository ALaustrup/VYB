"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const questions = [
  {
    id: "energy",
    prompt: "What social energy matches your vibe right now?",
    options: ["Low-key", "Balanced", "High energy"],
  },
  {
    id: "intent",
    prompt: "What are you hoping to find on Vyb first?",
    options: ["Friends", "Events", "Creative community"],
  },
];

export default function VibeQuizPage() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();
  const isLastStep = step === questions.length - 1;
  const current = questions[step];
  const progress = useMemo(() => ((step + 1) / questions.length) * 100, [step]);
  if (!current) return null;

  async function handleContinue() {
    if (!isLastStep) {
      setStep((prev) => prev + 1);
      return;
    }
    setIsSaving(true);
    try {
      await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vibeQuizAnswers: answers }),
      });
      router.push("/onboarding/setup-profile");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-8">
      <article className="glass-panel p-8">
        <p className="text-sm text-white/70">
          Step {step + 1} of {questions.length}
        </p>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
          <div className="h-full bg-white/80" style={{ width: `${progress}%` }} />
        </div>
        <h1 className="mt-6 text-3xl font-semibold text-white">{current.prompt}</h1>
        <div className="mt-6 grid gap-3">
          {current.options.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setAnswers((prev) => ({ ...prev, [current.id]: option }))}
              className="glass-panel p-4 text-left text-white/90"
            >
              {option}
            </button>
          ))}
        </div>
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={handleContinue}
            disabled={!answers[current.id] || isSaving}
            className="rounded-full bg-white px-5 py-2 text-sm font-medium text-black disabled:opacity-40"
          >
            {isLastStep ? (isSaving ? "Saving..." : "Save & continue") : "Continue"}
          </button>
        </div>
      </article>
    </section>
  );
}
