import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  timestamp,
  doublePrecision,
  primaryKey,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";

// Movies table
export const movies = pgTable("movies", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  year: integer("year").notNull(),
  rating: doublePrecision("rating").notNull(),
  imageUrl: text("image_url").notNull(),
  director: text("director"),
  actors: text("actors"),
  duration: integer("duration"),
  country: text("country"),
  language: text("language"),
  releaseDate: text("release_date"),
});

export const insertMovieSchema = createInsertSchema(movies).pick({
  title: true,
  description: true,
  year: true,
  rating: true,
  imageUrl: true,
  director: true,
  actors: true,
  duration: true,
  country: true,
  language: true,
  releaseDate: true,
});

export type InsertMovie = z.infer<typeof insertMovieSchema>;
export type Movie = typeof movies.$inferSelect;

export const moviesRelations = relations(movies, ({ many }) => ({
  movieGenres: many(movieCategories),
  watchHistory: many(watchHistory),
  playlistItems: many(playlistItems),
  sharedWatches: many(sharedWatches),
}));

// Genres table (renamed from categories)
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
});

export const insertGenreSchema = createInsertSchema(categories).pick({
  name: true,
});

export type InsertGenre = z.infer<typeof insertGenreSchema>;
export type Genre = typeof categories.$inferSelect;

export const categoriesRelations = relations(categories, ({ many }) => ({
  movieCategories: many(movieCategories),
}));

// Movie Genres (junction table) - renamed from Movie Categories
export const movieCategories = pgTable("movie_categories", {
  id: serial("id").primaryKey(),
  movieId: integer("movie_id")
    .notNull()
    .references(() => movies.id),
  categoryId: integer("category_id")
    .notNull()
    .references(() => categories.id),
});

export const insertMovieGenreSchema = createInsertSchema(movieCategories).pick({
  movieId: true,
  categoryId: true,
});

export type InsertMovieGenre = z.infer<typeof insertMovieGenreSchema>;
export type MovieGenre = typeof movieCategories.$inferSelect;

export const movieCategoriesRelations = relations(
  movieCategories,
  ({ one }) => ({
    movie: one(movies, {
      fields: [movieCategories.movieId],
      references: [movies.id],
    }),
    genre: one(categories, {
      fields: [movieCategories.categoryId],
      references: [categories.id],
    }),
  })
);

// Watch History table
export const watchHistory = pgTable("watch_history", {
  id: serial("id").primaryKey(),
  movieId: integer("movie_id").notNull(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  watchedAt: timestamp("watched_at").notNull().defaultNow(),
  rating: integer("rating"), // Optional user rating (1-10)
  notes: text("notes"), // Optional user notes about the movie
});

export const insertWatchHistorySchema = createInsertSchema(watchHistory).pick({
  movieId: true,
  userId: true,
  rating: true,
  notes: true,
});

export type InsertWatchHistory = z.infer<typeof insertWatchHistorySchema>;
export type WatchHistory = typeof watchHistory.$inferSelect;

export const watchHistoryRelations = relations(watchHistory, ({ one }) => ({
  user: one(users, {
    fields: [watchHistory.userId],
    references: [users.id],
  }),
}));

// Users table (enhanced with profile information)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").unique(),
  fullName: text("full_name"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  preferences: text("preferences"), // JSON string to store user preferences
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  fullName: true,
  avatarUrl: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const usersRelations = relations(users, ({ many }) => ({
  watchHistory: many(watchHistory),
  playlists: many(playlists),
  sentFriendRequests: many(friendships, { relationName: "userFriends" }),
  receivedFriendRequests: many(friendships, { relationName: "friendUsers" }),
  sharedWithMe: many(playlistShares, { relationName: "sharedPlaylists" }),
  initiatedWatches: many(sharedWatches, { relationName: "initiatedWatches" }),
  participatedWatches: many(sharedWatches, {
    relationName: "participatedWatches",
  }),
}));

// Playlists table
export const playlists = pgTable("playlists", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  name: text("name").notNull(),
  description: text("description"),
  isPublic: boolean("is_public").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertPlaylistSchema = createInsertSchema(playlists).pick({
  userId: true,
  name: true,
  description: true,
  isPublic: true,
});

export type InsertPlaylist = z.infer<typeof insertPlaylistSchema>;
export type Playlist = typeof playlists.$inferSelect;

export const playlistsRelations = relations(playlists, ({ one, many }) => ({
  user: one(users, {
    fields: [playlists.userId],
    references: [users.id],
  }),
  playlistItems: many(playlistItems),
  sharedWith: many(playlistShares),
}));

// Playlist Items table (junction table between playlists and movies)
export const playlistItems = pgTable(
  "playlist_items",
  {
    id: serial("id").primaryKey(),
    playlistId: integer("playlist_id")
      .notNull()
      .references(() => playlists.id, { onDelete: "cascade" }),
    movieId: integer("movie_id").notNull(),
    addedAt: timestamp("added_at").notNull().defaultNow(),
    notes: text("notes"),
    sortOrder: integer("sort_order").notNull(),
  },
  (table) => {
    return {
      playlistMovieUnique: primaryKey({
        columns: [table.playlistId, table.movieId],
      }),
    };
  }
);

export const insertPlaylistItemSchema = createInsertSchema(playlistItems).pick({
  playlistId: true,
  movieId: true,
  notes: true,
  sortOrder: true,
});

export type InsertPlaylistItem = z.infer<typeof insertPlaylistItemSchema>;
export type PlaylistItem = typeof playlistItems.$inferSelect;

export const playlistItemsRelations = relations(playlistItems, ({ one }) => ({
  playlist: one(playlists, {
    fields: [playlistItems.playlistId],
    references: [playlists.id],
  }),
  movie: one(movies, {
    fields: [playlistItems.movieId],
    references: [movies.id],
  }),
}));

// Friendships/Social table
export const friendships = pgTable(
  "friendships",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    friendId: integer("friend_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("pending"), // pending, accepted, rejected
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => {
    return {
      userFriendUnique: primaryKey({
        columns: [table.userId, table.friendId],
      }),
    };
  }
);

export const insertFriendshipSchema = createInsertSchema(friendships).pick({
  userId: true,
  friendId: true,
  status: true,
});

export type InsertFriendship = z.infer<typeof insertFriendshipSchema>;
export type Friendship = typeof friendships.$inferSelect;

// Update users relations to include friendships
export const friendshipsRelations = relations(friendships, ({ one }) => ({
  user: one(users, {
    fields: [friendships.userId],
    references: [users.id],
    relationName: "userFriends",
  }),
  friend: one(users, {
    fields: [friendships.friendId],
    references: [users.id],
    relationName: "friendUsers",
  }),
}));

// Playlist shares table (for shared playlists)
export const playlistShares = pgTable(
  "playlist_shares",
  {
    id: serial("id").primaryKey(),
    playlistId: integer("playlist_id")
      .notNull()
      .references(() => playlists.id, { onDelete: "cascade" }),
    sharedWithUserId: integer("shared_with_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    canEdit: boolean("can_edit").notNull().default(false),
    sharedAt: timestamp("shared_at").notNull().defaultNow(),
  },
  (table) => {
    return {
      playlistUserUnique: primaryKey({
        columns: [table.playlistId, table.sharedWithUserId],
      }),
    };
  }
);

export const insertPlaylistShareSchema = createInsertSchema(
  playlistShares
).pick({
  playlistId: true,
  sharedWithUserId: true,
  canEdit: true,
});

export type InsertPlaylistShare = z.infer<typeof insertPlaylistShareSchema>;
export type PlaylistShare = typeof playlistShares.$inferSelect;

export const playlistSharesRelations = relations(playlistShares, ({ one }) => ({
  playlist: one(playlists, {
    fields: [playlistShares.playlistId],
    references: [playlists.id],
  }),
  sharedWithUser: one(users, {
    fields: [playlistShares.sharedWithUserId],
    references: [users.id],
  }),
}));

// Shared watching experiences
export const sharedWatches = pgTable("shared_watches", {
  id: serial("id").primaryKey(),
  movieId: integer("movie_id").notNull(),
  initiatedByUserId: integer("initiated_by_user_id")
    .notNull()
    .references(() => users.id),
  watchedWithUserId: integer("watched_with_user_id")
    .notNull()
    .references(() => users.id),
  watchedAt: timestamp("watched_at").notNull().defaultNow(),
  rating: integer("rating"), // Combined rating
  notes: text("notes"), // Shared notes
});

export const insertSharedWatchSchema = createInsertSchema(sharedWatches).pick({
  movieId: true,
  initiatedByUserId: true,
  watchedWithUserId: true,
  rating: true,
  notes: true,
});

export type InsertSharedWatch = z.infer<typeof insertSharedWatchSchema>;
export type SharedWatch = typeof sharedWatches.$inferSelect;

export const sharedWatchesRelations = relations(sharedWatches, ({ one }) => ({
  movie: one(movies, {
    fields: [sharedWatches.movieId],
    references: [movies.id],
  }),
  initiatedByUser: one(users, {
    fields: [sharedWatches.initiatedByUserId],
    references: [users.id],
    relationName: "initiatedWatches",
  }),
  watchedWithUser: one(users, {
    fields: [sharedWatches.watchedWithUserId],
    references: [users.id],
    relationName: "participatedWatches",
  }),
}));
