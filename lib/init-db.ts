import { pool } from '@/lib/db'

// Initialize Better Auth database tables
export async function initializeAuthDatabase() {
  try {
    const client = await pool.connect()

    try {
      // Create users table
      await client.query(`
        CREATE TABLE IF NOT EXISTS "user" (
          id TEXT NOT NULL PRIMARY KEY,
          email TEXT NOT NULL UNIQUE,
          name TEXT,
          password_hash TEXT,
          image TEXT,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `)

      // Create sessions table
      await client.query(`
        CREATE TABLE IF NOT EXISTS "session" (
          id TEXT NOT NULL PRIMARY KEY,
          user_id TEXT NOT NULL,
          token TEXT NOT NULL UNIQUE,
          expires_at TIMESTAMP NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT session_user_fk FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE
        )
      `)

      // Create indexes
      await client.query(`CREATE INDEX IF NOT EXISTS idx_session_user_id ON "session"(user_id)`)
      await client.query(`CREATE INDEX IF NOT EXISTS idx_session_token ON "session"(token)`)
      await client.query(`CREATE INDEX IF NOT EXISTS idx_user_email ON "user"(email)`)

      console.log('✓ Authentication tables initialized successfully')
      return true
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('❌ Failed to initialize auth tables:', error)
    return false
  }
}
