import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
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

// Categories table
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
});

export const insertCategorySchema = createInsertSchema(categories).pick({
  name: true,
});

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;

// Movie Categories (junction table)
export const movieCategories = pgTable("movie_categories", {
  id: serial("id").primaryKey(),
  movieId: integer("movie_id").notNull().references(() => movies.id),
  categoryId: integer("category_id").notNull().references(() => categories.id),
});

export const insertMovieCategorySchema = createInsertSchema(movieCategories).pick({
  movieId: true,
  categoryId: true,
});

export type InsertMovieCategory = z.infer<typeof insertMovieCategorySchema>;
export type MovieCategory = typeof movieCategories.$inferSelect;

// Watch History table
export const watchHistory = pgTable("watch_history", {
  id: serial("id").primaryKey(),
  movieId: integer("movie_id").notNull().references(() => movies.id),
  watchedAt: timestamp("watched_at").notNull().defaultNow(),
});

export const insertWatchHistorySchema = createInsertSchema(watchHistory).pick({
  movieId: true,
});

export type InsertWatchHistory = z.infer<typeof insertWatchHistorySchema>;
export type WatchHistory = typeof watchHistory.$inferSelect;

// Users table (keeping from existing schema)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
