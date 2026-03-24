import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: url });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Ensure UUID generation is available.
    await client.query('CREATE EXTENSION IF NOT EXISTS pgcrypto');

    // 1) Create conversations table if missing.
    await client.query(`
      CREATE TABLE IF NOT EXISTS conversations (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        uid text NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
        title text,
        created_at bigint NOT NULL,
        updated_at bigint NOT NULL
      )
    `);

    // 2) Add conversation_id column if missing (nullable for backfill).
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema='public'
            AND table_name='chats'
            AND column_name='conversation_id'
        ) THEN
          ALTER TABLE chats ADD COLUMN conversation_id uuid;
        END IF;
      END $$;
    `);

    // 3) Create a default conversation per uid with existing chats (if not already present).
    //    We use a deterministic title to avoid duplicating defaults.
    const now = Date.now();
    await client.query(
      `
      INSERT INTO conversations (uid, title, created_at, updated_at)
      SELECT DISTINCT c.uid, 'Imported Conversation', $1::bigint, $1::bigint
      FROM chats c
      LEFT JOIN conversations conv
        ON conv.uid = c.uid AND conv.title = 'Imported Conversation'
      WHERE conv.id IS NULL
      `,
      [now],
    );

    // 4) Backfill chats.conversation_id for any NULL rows.
    await client.query(`
      UPDATE chats
      SET conversation_id = conv.id
      FROM conversations conv
      WHERE chats.conversation_id IS NULL
        AND conv.uid = chats.uid
        AND conv.title = 'Imported Conversation'
    `);

    // 5) Enforce NOT NULL.
    await client.query('ALTER TABLE chats ALTER COLUMN conversation_id SET NOT NULL');

    // 6) Add FK if missing.
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM information_schema.table_constraints tc
          WHERE tc.table_schema='public'
            AND tc.table_name='chats'
            AND tc.constraint_type='FOREIGN KEY'
            AND tc.constraint_name='chats_conversation_id_conversations_id_fk'
        ) THEN
          ALTER TABLE chats
            ADD CONSTRAINT chats_conversation_id_conversations_id_fk
            FOREIGN KEY (conversation_id)
            REFERENCES conversations(id)
            ON DELETE CASCADE;
        END IF;
      END $$;
    `);

    await client.query('COMMIT');

    console.log('Migration complete: conversations + chats.conversation_id ready.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err?.message || err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main();
