import "../bootstrap-env";

import { and, eq } from "drizzle-orm";

import { getDb } from "./client";
import { interests, notifications, posts, users } from "./schema";

async function seed() {
  const db = getDb();
  if (!db) {
    throw new Error("DATABASE_URL is required for db:seed");
  }

  await db
    .insert(users)
    .values([
      {
        clerkId: "seed_clerk_avery",
        email: "avery@vyb.local",
        username: "avery",
        displayName: "Avery",
        onboardingCompleted: true,
      },
      {
        clerkId: "seed_clerk_mina",
        email: "mina@vyb.local",
        username: "mina",
        displayName: "Mina",
        onboardingCompleted: true,
      },
    ])
    .onConflictDoNothing();

  await db
    .insert(interests)
    .values([
      { slug: "walking", name: "Walking", category: "wellness" },
      { slug: "music", name: "Music", category: "creative" },
      { slug: "skill-swap", name: "Skill Swap", category: "social" },
    ])
    .onConflictDoNothing();

  const avery = await db.query.users.findFirst({
    where: eq(users.clerkId, "seed_clerk_avery"),
  });
  const mina = await db.query.users.findFirst({
    where: eq(users.clerkId, "seed_clerk_mina"),
  });

  if (avery && mina) {
    await db.insert(posts).values([
      {
        authorId: avery.id,
        content: "Hosting a spontaneous sunset walk at 7pm.",
        type: "text",
      },
      {
        authorId: mina.id,
        content: "Trading guitar basics for cooking lessons.",
        type: "text",
      },
    ]);
  }

  if (avery) {
    const existingWelcome = await db.query.notifications.findFirst({
      where: and(eq(notifications.userId, avery.id), eq(notifications.title, "Welcome to Vyb")),
    });
    if (!existingWelcome) {
      await db.insert(notifications).values({
        userId: avery.id,
        type: "wellness_tip",
        title: "Welcome to Vyb",
        body: "Your feed is tuned for intention — take breaks often.",
      });
    }
  }
}

seed()
  .then(() => {
    console.log("Seed complete");
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
