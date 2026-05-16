"use client";

import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Step = { id: string; prompt: string; options: string[] };

export default function MatchmakerPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step | null>(null);
  const [started, setStarted] = useState(false);
  const [history, setHistory] = useState<Array<{ role: "agent" | "you"; text: string }>>([
    { role: "agent", text: "Hey — I'm Vyb Match. I'll ask a few questions, then introduce you to someone who fits." },
  ]);
  const [matched, setMatched] = useState<{ roomId: string; name: string } | null>(null);

  const advance = useMutation({
    mutationFn: async (payload?: { stepId: string; value: string }) => {
      const res = await fetch("/api/matchmaker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload ?? {}),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json() as Promise<{
        status: string;
        step?: Step;
        roomId?: string;
        matchedUser?: { displayName: string };
      }>;
    },
    onSuccess: (data, variables) => {
      if (variables?.value) {
        setHistory((h) => [...h, { role: "you", text: variables.value }]);
      }
      if (data.status === "question" && data.step) {
        setStep(data.step);
        setHistory((h) => [...h, { role: "agent", text: data.step!.prompt }]);
      }
      if (data.status === "matched" && data.roomId) {
        setMatched({ roomId: data.roomId, name: data.matchedUser?.displayName ?? "your match" });
        setHistory((h) => [
          ...h,
          {
            role: "agent",
            text: `Opening a private room with ${data.matchedUser?.displayName ?? "them"}. Cam and mic are enabled when you're ready.`,
          },
        ]);
        setStep(null);
      }
      if (data.status === "no_match") {
        setHistory((h) => [...h, { role: "agent", text: "No matches yet — try a world room or invite friends." }]);
        setStep(null);
      }
    },
  });

  function start() {
    setStarted(true);
    advance.mutate(undefined);
  }

  return (
    <section className="mx-auto flex max-w-2xl flex-col gap-4 p-6 pb-28">
      <Link href="/chat" className="text-sm text-white/60 hover:text-white">
        ← Connect hub
      </Link>
      <article className="glass-panel flex min-h-[420px] flex-col p-6">
        <h1 className="text-xl font-semibold text-white">Vyb Match</h1>
        <p className="text-xs text-white/50">Conversational matchmaking · private intro room</p>

        <div className="mt-4 flex-1 space-y-3 overflow-y-auto pr-1">
          {history.map((line, i) => (
            <p
              key={`${line.role}-${i}`}
              className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
                line.role === "agent"
                  ? "bg-white/10 text-white/90"
                  : "ml-auto bg-white text-black"
              }`}
            >
              {line.text}
            </p>
          ))}
        </div>

        {!started ? (
          <button
            type="button"
            onClick={start}
            disabled={advance.isPending}
            className="mt-4 rounded-full bg-white px-5 py-2 text-sm font-medium text-black"
          >
            Start matching
          </button>
        ) : null}

        {matched ? (
          <button
            type="button"
            onClick={() => router.push(`/chat/${matched.roomId}`)}
            className="mt-4 rounded-full bg-[var(--vyb-sunset)] px-5 py-2 text-sm font-medium text-white"
          >
            Enter room with {matched.name}
          </button>
        ) : null}

        {step && !matched ? (
          <div className="mt-4 grid gap-2">
            {step.options.map((opt) => (
              <button
                key={opt}
                type="button"
                disabled={advance.isPending}
                onClick={() => advance.mutate({ stepId: step.id, value: opt })}
                className="rounded-xl border border-white/20 px-4 py-3 text-left text-sm text-white/90 hover:bg-white/10"
              >
                {opt}
              </button>
            ))}
          </div>
        ) : null}
      </article>
    </section>
  );
}
