import { db } from './db';
import { friendships, playlistShares, sharedWatches } from '@shared/schema';

async function createFriendshipTables() {
  console.log('Creating missing social feature tables...');
  
  // First check if the tables exist
  try {
    await db.query.friendships.findFirst();
    console.log('Friendships table already exists');
  } catch (error) {
    console.log('Creating friendships table...');
    await db.execute(`
      CREATE TABLE IF NOT EXISTS "friendships" (
        "id" SERIAL PRIMARY KEY,
        "user_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "friend_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "status" TEXT DEFAULT 'pending' NOT NULL,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        UNIQUE("user_id", "friend_id")
      );
    `);
    console.log('Friendships table created successfully');
  }

  try {
    await db.query.playlistShares.findFirst();
    console.log('Playlist shares table already exists');
  } catch (error) {
    console.log('Creating playlist_shares table...');
    await db.execute(`
      CREATE TABLE IF NOT EXISTS "playlist_shares" (
        "id" SERIAL PRIMARY KEY,
        "playlist_id" INTEGER NOT NULL REFERENCES "playlists"("id") ON DELETE CASCADE,
        "shared_with_user_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "can_edit" BOOLEAN DEFAULT FALSE NOT NULL,
        "shared_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        UNIQUE("playlist_id", "shared_with_user_id")
      );
    `);
    console.log('Playlist shares table created successfully');
  }

  try {
    await db.query.sharedWatches.findFirst();
    console.log('Shared watches table already exists');
  } catch (error) {
    console.log('Creating shared_watches table...');
    await db.execute(`
      CREATE TABLE IF NOT EXISTS "shared_watches" (
        "id" SERIAL PRIMARY KEY,
        "movie_id" INTEGER NOT NULL REFERENCES "movies"("id"),
        "initiated_by_user_id" INTEGER NOT NULL REFERENCES "users"("id"),
        "watched_with_user_id" INTEGER NOT NULL REFERENCES "users"("id"),
        "watched_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        "rating" INTEGER,
        "notes" TEXT
      );
    `);
    console.log('Shared watches table created successfully');
  }

  console.log('All social feature tables created successfully');
}

createFriendshipTables()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Error creating tables:', error);
    process.exit(1);
  });