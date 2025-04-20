import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision, primaryKey } from "drizzle-orm/pg-core";
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
});

export const insertMovieSchema = createInsertSchema(movies).pick({
  title: true,
  description: true,
  year: true,
  rating: true,
  imageUrl: true,
});

export type InsertMovie = z.infer<typeof insertMovieSchema>;
export type Movie = typeof movies.$inferSelect;

export const moviesRelations = relations(movies, ({ many }) => ({
  movieGenres: many(movieCategories),
  watchHistory: many(watchHistory),
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
  movieId: integer("movie_id").notNull().references(() => movies.id),
  categoryId: integer("category_id").notNull().references(() => categories.id),
});

export const insertMovieGenreSchema = createInsertSchema(movieCategories).pick({
  movieId: true,
  categoryId: true,
});

export type InsertMovieGenre = z.infer<typeof insertMovieGenreSchema>;
export type MovieGenre = typeof movieCategories.$inferSelect;

export const movieCategoriesRelations = relations(movieCategories, ({ one }) => ({
  movie: one(movies, {
    fields: [movieCategories.movieId],
    references: [movies.id],
  }),
  genre: one(categories, {
    fields: [movieCategories.categoryId],
    references: [categories.id],
  }),
}));

// Watch History table
export const watchHistory = pgTable("watch_history", {
  id: serial("id").primaryKey(),
  movieId: integer("movie_id").notNull().references(() => movies.id),
  userId: integer("user_id").notNull().references(() => users.id),
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
  movie: one(movies, {
    fields: [watchHistory.movieId],
    references: [movies.id],
  }),
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
}));
