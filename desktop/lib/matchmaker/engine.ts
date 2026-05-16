export type MatchmakerStepId = "lookingFor" | "energy" | "distance" | "format";

const STEPS: Array<{
  id: MatchmakerStepId;
  prompt: string;
  options: string[];
}> = [
  {
    id: "lookingFor",
    prompt: "What are you hoping to find right now?",
    options: ["Deep conversation", "New friends", "Creative collab", "Just vibing"],
  },
  {
    id: "energy",
    prompt: "What energy should your match bring?",
    options: ["Calm & thoughtful", "Balanced", "High energy", "Surprise me"],
  },
  {
    id: "distance",
    prompt: "How local should this connection feel?",
    options: ["Same city", "Same region", "Anywhere online", "No preference"],
  },
  {
    id: "format",
    prompt: "How do you want to connect?",
    options: ["Text first", "Voice & webcam", "Either works"],
  },
];

export function getNextMatchmakerStep(answers: Record<string, string>) {
  for (const step of STEPS) {
    if (!answers[step.id]) return step;
  }
  return null;
}

export function scoreVibeOverlap(
  a: Record<string, string> | null | undefined,
  b: Record<string, string> | null | undefined,
) {
  if (!a || !b) return 0;
  let score = 0;
  for (const key of Object.keys(a)) {
    if (a[key] === b[key]) score += 2;
    else if (b[key]) score += 0.5;
  }
  return score;
}

export { STEPS as MATCHMAKER_STEPS };
