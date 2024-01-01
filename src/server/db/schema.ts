import { relations, sql } from "drizzle-orm";
import {
  bigint,
  index,
  int,
  json,
  mysqlEnum,
  mysqlTableCreator,
  primaryKey,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";
import { type AdapterAccount } from "next-auth/adapters";
import { nanoid } from "nanoid";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const mysqlTable = mysqlTableCreator((name) => `emoji-reddit_${name}`);

export const subreddits = mysqlTable(
  "subreddit",
  {
    id: varchar("id", { length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(nanoid),
    name: varchar("name", { length: 255 }).notNull().unique(),
    createdAt: timestamp("created_at").defaultNow(),
    // updatedAt: timestamp("updated_at").default(
    //   sql`CURRENT_TIMESTAMP(3) on update CURRENT_TIMESTAMP(3)`,
    // ),
    ownerId: varchar("owner_id", { length: 255 }).notNull(),
  },
  (subreddit) => ({
    nameIdx: index("name_idx").on(subreddit.name),
    ownerIdIdx: index("ownerId_idx").on(subreddit.ownerId),
  }),
);

export const subredditsRelations = relations(subreddits, ({ one, many }) => ({
  owner: one(users, {
    fields: [subreddits.ownerId],
    references: [users.id],
  }),
  posts: many(posts),
  subscribers: many(subscriptions),
}));

export const subscriptions = mysqlTable(
  "subscription",
  {
    userId: varchar("userId", { length: 255 }).notNull(),
    subredditId: varchar("subredditId", { length: 255 }).notNull(),
  },
  (subscription) => ({
    compoundKey: primaryKey(subscription.userId, subscription.subredditId),
  }),
);

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, {
    fields: [subscriptions.userId],
    references: [users.id],
  }),
  subreddit: one(subreddits, {
    fields: [subscriptions.subredditId],
    references: [subreddits.id],
  }),
}));

export const posts = mysqlTable("post", {
  id: varchar("id", { length: 255 }).notNull().primaryKey().$defaultFn(nanoid),
  title: varchar("title", { length: 255 }).notNull().unique(),
  content: json("content"),
  createdAt: timestamp("created_at").defaultNow(),
  // updatedAt: timestamp("updated_at").default(
  //   sql`CURRENT_TIMESTAMP(3) on update CURRENT_TIMESTAMP(3)`,
  // ),
  subredditId: varchar("subredditId", { length: 255 }).notNull(),
  authorId: varchar("authorId", { length: 255 }).notNull(),
});

export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
  subreddit: one(subreddits, {
    fields: [posts.subredditId],
    references: [subreddits.id],
  }),
  comments: many(comments),
}));

export const postVotes = mysqlTable(
  "postVote",
  {
    userId: varchar("user_id", { length: 255 }).notNull(),
    postId: varchar("post_id", { length: 255 }).notNull(),
    type: mysqlEnum("type", ["UP", "DOWN"]),
  },
  (postVote) => ({
    compoundKey: primaryKey(postVote.userId, postVote.postId),
  }),
);

export const postVotesRelations = relations(postVotes, ({ one }) => ({
  user: one(users, {
    fields: [postVotes.userId],
    references: [users.id],
  }),
  post: one(posts, {
    fields: [postVotes.userId],
    references: [posts.id],
  }),
}));

export const comments = mysqlTable("comment", {
  id: varchar("id", { length: 255 }).notNull().primaryKey().$defaultFn(nanoid),
  text: varchar("text", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  // updatedAt: timestamp("updated_at").default(
  //   sql`CURRENT_TIMESTAMP(3) on update CURRENT_TIMESTAMP(3)`,
  // ),
  authorId: varchar("author_id", { length: 255 }).notNull(),
  postId: varchar("post_id", { length: 255 }).notNull(),

  replyToId: varchar("reply_to_id", { length: 255 }).notNull(),
});

export const commentsRelations = relations(comments, ({ one, many }) => ({
  author: one(users, {
    fields: [comments.authorId],
    references: [users.id],
  }),
  post: one(posts, {
    fields: [comments.postId],
    references: [posts.id],
  }),
  replies: many(comments, { relationName: "replyTo" }),
  replyTo: one(comments, {
    fields: [comments.replyToId],
    references: [comments.id],
    relationName: "replyTo",
  }),
  votes: many(commentVotes),
}));

export const commentVotes = mysqlTable(
  "commentVote",
  {
    userId: varchar("user_id", { length: 255 }).notNull(),
    commentId: varchar("comment_id", { length: 255 }).notNull(),
    type: mysqlEnum("type", ["UP", "DOWN"]),
  },
  (commentVote) => ({
    compoundKey: primaryKey(commentVote.userId, commentVote.commentId),
  }),
);

export const commentVotesRelations = relations(commentVotes, ({ one }) => ({
  user: one(users, {
    fields: [commentVotes.userId],
    references: [users.id],
  }),
  comment: one(comments, {
    fields: [commentVotes.userId],
    references: [comments.id],
  }),
}));

/**
 * Next-auth
 */
export const users = mysqlTable("user", {
  id: varchar("id", { length: 255 }).notNull().primaryKey(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }).notNull(),
  emailVerified: timestamp("emailVerified", {
    mode: "date",
    fsp: 3,
  }).default(sql`CURRENT_TIMESTAMP(3)`),
  image: varchar("image", { length: 255 }),
});

export type User = typeof users.$inferSelect; // return type when queried
export type NewUser = typeof users.$inferInsert; // insert type

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  posts: many(posts),
  comments: many(comments),
  ownedSubreddits: many(subreddits),
  subscriptions: many(subscriptions),
  postVotes: many(postVotes),
  commentVotes: many(commentVotes),
}));

export const accounts = mysqlTable(
  "account",
  {
    userId: varchar("userId", { length: 255 }).notNull(),
    type: varchar("type", { length: 255 })
      .$type<AdapterAccount["type"]>()
      .notNull(),
    provider: varchar("provider", { length: 255 }).notNull(),
    providerAccountId: varchar("providerAccountId", { length: 255 }).notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: int("expires_at"),
    token_type: varchar("token_type", { length: 255 }),
    scope: varchar("scope", { length: 255 }),
    id_token: text("id_token"),
    session_state: varchar("session_state", { length: 255 }),
  },
  (account) => ({
    compoundKey: primaryKey(account.provider, account.providerAccountId),
    userIdIdx: index("userId_idx").on(account.userId),
  }),
);

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const sessions = mysqlTable(
  "session",
  {
    sessionToken: varchar("sessionToken", { length: 255 })
      .notNull()
      .primaryKey(),
    userId: varchar("userId", { length: 255 }).notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (session) => ({
    userIdIdx: index("userId_idx").on(session.userId),
  }),
);

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const verificationTokens = mysqlTable(
  "verificationToken",
  {
    identifier: varchar("identifier", { length: 255 }).notNull(),
    token: varchar("token", { length: 255 }).notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey(vt.identifier, vt.token),
  }),
);
