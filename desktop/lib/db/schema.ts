import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  vector,
} from "drizzle-orm/pg-core";

export const privacyEnum = pgEnum("privacy_level", ["public", "friends", "private"]);
export const connectionStatusEnum = pgEnum("connection_status", [
  "pending",
  "accepted",
  "blocked",
  "following",
]);
export const postTypeEnum = pgEnum("post_type", ["text", "image", "video", "audio", "event", "listing"]);
export const notificationTypeEnum = pgEnum("notification_type", [
  "like",
  "comment",
  "follow",
  "message",
  "event_reminder",
  "wellness_tip",
]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clerkId: text("clerk_id").notNull().unique(),
    email: text("email").notNull().unique(),
    username: text("username").notNull().unique(),
    displayName: text("display_name"),
    bio: text("bio"),
    avatarUrl: text("avatar_url"),
    onboardingCompleted: boolean("onboarding_completed").notNull().default(false),
    vibeQuizAnswers: jsonb("vibe_quiz_answers").$type<Record<string, string>>(),
    interestsSummary: text("interests_summary").array().notNull().default([]),
    privacyLevel: privacyEnum("privacy_level").notNull().default("public"),
    profileTheme: jsonb("profile_theme").$type<{
      accent?: string;
      tagline?: string;
      layout?: "classic" | "compact";
    }>(),
    shareLocation: boolean("share_location").notNull().default(false),
    latitude: text("latitude"),
    longitude: text("longitude"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("users_clerk_id_idx").on(table.clerkId), index("users_username_idx").on(table.username)],
);

export const interests = pgTable(
  "interests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull().unique(),
    category: text("category").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("interests_slug_idx").on(table.slug)],
);

export const userInterests = pgTable(
  "user_interests",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    interestId: uuid("interest_id")
      .notNull()
      .references(() => interests.id, { onDelete: "cascade" }),
    score: integer("score").notNull().default(50),
  },
  (table) => [primaryKey({ columns: [table.userId, table.interestId] })],
);

export const posts = pgTable(
  "posts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    authorId: uuid("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: postTypeEnum("type").notNull().default("text"),
    content: text("content").notNull(),
    mediaUrls: text("media_urls").array().notNull().default([]),
    hiddenLikeCount: boolean("hidden_like_count").notNull().default(true),
    likesCount: integer("likes_count").notNull().default(0),
    commentsCount: integer("comments_count").notNull().default(0),
    embedding: vector("embedding", { dimensions: 1536 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("posts_author_created_idx").on(table.authorId, table.createdAt)],
);

export const comments = pgTable(
  "comments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    authorId: uuid("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    parentId: uuid("parent_id"),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("comments_post_created_idx").on(table.postId, table.createdAt)],
);

export const connections = pgTable(
  "connections",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    fromUserId: uuid("from_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    toUserId: uuid("to_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: connectionStatusEnum("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("connections_unique_pair").on(table.fromUserId, table.toUserId),
    index("connections_status_idx").on(table.status),
  ],
);

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: notificationTypeEnum("type").notNull(),
    title: text("title").notNull(),
    body: text("body"),
    metadata: jsonb("metadata").$type<Record<string, string | number | boolean>>(),
    isRead: boolean("is_read").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("notifications_user_read_created_idx").on(table.userId, table.isRead, table.createdAt)],
);

export const chatRoomTypeEnum = pgEnum("chat_room_type", ["direct", "group"]);
export const chatModeEnum = pgEnum("chat_mode", [
  "direct",
  "group",
  "local",
  "world",
  "webcam",
  "random_cam",
  "match_private",
]);
export const messageTypeEnum = pgEnum("message_type", ["text", "image", "system"]);
export const eventTypeEnum = pgEnum("event_type", ["spontaneous", "scheduled", "recurring", "virtual"]);
export const rsvpStatusEnum = pgEnum("rsvp_status", ["going", "interested", "not_going", "host"]);
export const reportTargetEnum = pgEnum("report_target", ["user", "post", "comment", "listing", "event"]);

export const chatRooms = pgTable(
  "chat_rooms",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    type: chatRoomTypeEnum("type").notNull().default("direct"),
    mode: chatModeEnum("mode").notNull().default("direct"),
    name: text("name"),
    hostId: uuid("host_id").references(() => users.id, { onDelete: "set null" }),
    settings: jsonb("settings").$type<{
      privacy?: "public" | "friends" | "invite";
      allowWebcam?: boolean;
      allowMic?: boolean;
      radiusKm?: number;
      description?: string;
    }>(),
    latitude: text("latitude"),
    longitude: text("longitude"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("chat_rooms_updated_idx").on(table.updatedAt),
    index("chat_rooms_mode_idx").on(table.mode),
  ],
);

export const matchmakingSessions = pgTable(
  "matchmaking_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    answers: jsonb("answers").$type<Record<string, string>>().notNull().default({}),
    status: text("status").notNull().default("in_progress"),
    matchedUserId: uuid("matched_user_id").references(() => users.id, { onDelete: "set null" }),
    roomId: uuid("room_id").references(() => chatRooms.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("matchmaking_user_idx").on(table.userId)],
);

export const chatRoomMembers = pgTable(
  "chat_room_members",
  {
    roomId: uuid("room_id")
      .notNull()
      .references(() => chatRooms.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.roomId, table.userId] })],
);

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    roomId: uuid("room_id")
      .notNull()
      .references(() => chatRooms.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: messageTypeEnum("type").notNull().default("text"),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("messages_room_created_idx").on(table.roomId, table.createdAt)],
);

export const events = pgTable(
  "events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    hostId: uuid("host_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    type: eventTypeEnum("type").notNull().default("spontaneous"),
    location: jsonb("location").$type<{
      type: "physical" | "virtual";
      address?: string;
      lat?: number;
      lng?: number;
      virtualLink?: string;
    }>(),
    startTime: timestamp("start_time", { withTimezone: true }).notNull(),
    endTime: timestamp("end_time", { withTimezone: true }),
    isNow: boolean("is_now").notNull().default(false),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    maxAttendees: integer("max_attendees"),
    currentAttendees: integer("current_attendees").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("events_host_idx").on(table.hostId),
    index("events_start_idx").on(table.startTime),
    index("events_is_now_idx").on(table.isNow),
  ],
);

export const eventAttendees = pgTable(
  "event_attendees",
  {
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: rsvpStatusEnum("status").notNull().default("interested"),
    rsvpAt: timestamp("rsvp_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.eventId, table.userId] })],
);

export const safetyReports = pgTable(
  "safety_reports",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    reporterId: uuid("reporter_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    targetType: reportTargetEnum("target_type").notNull(),
    targetId: uuid("target_id").notNull(),
    reason: text("reason").notNull(),
    details: text("details"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("safety_reports_target_idx").on(table.targetType, table.targetId)],
);
