# PostgreSQL Database Schema for 10x-cards Project

## 1. Tables List

### `users` table (this table is managed by Supabase Auth)
Stores user authentication information.

| Column Name          | Data Type     | Constraints                        | Description                                          |
|----------------------|---------------|------------------------------------|------------------------------------------------------|
| `id`                 | `uuid`        | `PRIMARY KEY`                      | Unique identifier for the user (Primary Key).        |
| `email`              | `VARCHAR`     | `NOT NULL UNIQUE`                  | User's email address.                                |
| `encrypted_password` | `VARCHAR`     |                                    | User's encrypted password.                           |
| `created_at`         | `TIMESTAMPTZ` | `DEFAULT now()`                    | Timestamp of when the user account was created.      |
| `email_confirmed_at` | `TIMESTAMPTZ` |                                    | Timestamp of when the user's email was confirmed.    |

---

### `flashcards` table
Stores flashcards created by users.

| Column Name    | Data Type                                    | Constraints                                                                     | Description                                                                  |
|----------------|----------------------------------------------|---------------------------------------------------------------------------------|------------------------------------------------------------------------------|
| `id`           | `BIGSERIAL`                                  | `PRIMARY KEY`,                                                                  | Unique identifier for the flashcard.                                         |
| `user_id`      | `uuid`                                       | `NOT NULL`, `FOREIGN KEY REFERENCES auth.users(id) ON DELETE CASCADE`           | Identifier of the user who owns the flashcard.                               |
| `generation_id`| `uuid`                                       | `NULL`, `FOREIGN KEY REFERENCES generations(id) ON DELETE SET NULL`             | Identifier of the generation process (if the flashcard was created by AI).   |
| `front`        | `VARCHAR(200)`                               | `NOT NULL`                                                                      | Content of the front of the flashcard.                                       |
| `back`         | `VARCHAR(500)`                               | `NOT NULL`                                                                      | Content of the back of the flashcard.                                        |
| `source`       | `flashcard_source` (ENUM)                    | `NOT NULL`                                                                      | The source of the flashcard (`manual`, `ai-full`, `ai-edited`).              |
| `created_at`   | `TIMESTAMPTZ`                                | `NOT NULL`, `DEFAULT now()`                                                     | Timestamp of when the record was created.                                    |
| `updated_at`   | `TIMESTAMPTZ`                                | `NOT NULL`, `DEFAULT now()`                                                     | Timestamp of the last record modification (updated by a trigger).            |

**`flashcard_source` ENUM Type:**
```sql
CREATE TYPE flashcard_source AS ENUM ('manual', 'ai-full', 'ai-edited');
```

---

### `generations` table
Stores metadata about the AI flashcard generation process.

| Column Name               | Data Type       | Constraints                                                             | Description                                                                   |
|---------------------------|-----------------|-------------------------------------------------------------------------|-------------------------------------------------------------------------------|
| `id`                      | `BIGSERIAL`     | `PRIMARY KEY`,                                                          | Unique identifier for the generation process.                                 |
| `user_id`                 | `uuid`          | `NOT NULL`, `FOREIGN KEY REFERENCES users(id) ON DELETE CASCADE`.       | Identifier of the user who initiated the generation.                          |
| `generation_time`         | `TIMESTAMPTZ`   | `NOT NULL`, `DEFAULT now()`                                             | Timestamp of when the generation process started.                             |
| `duration_ms`             | `INTEGER`       | `NOT NULL`                                                              | Duration of the generation process in milliseconds.                           |
| `model`                   | `VARCHAR(255)`  |                                                                         | Name of the AI model used for generation.                                     |
| `generated_count`         | `INTEGER`       | `NOT NULL`                                                              | Total number of flashcards suggested by the AI.                               |
| `accepted_unedited_count` | `INTEGER`       | `NOT NULL`                                                              | Number of accepted flashcards without edits.                                  |
| `accepted_edited_count`   | `INTEGER`       | `NOT NULL`                                                              | Number of accepted flashcards after edits.                                    |
| `source_text_hash`        | `VARCHAR`.      | `NOT NULL`                                                              |
| `source_text_length`      | `INTEGER`       | `NOT NULL`, `CHECK (source_text_length >= 1000 AND source_text_length <= 10000)` | Length of the source text in characters.                                      |

---

### `generation_error_logs` table
Logs errors that occurred during communication with the AI model's API.

| Column Name          | Data Type      | Constraints                                                           | Description                                                    |
|----------------------|----------------|-----------------------------------------------------------------------|----------------------------------------------------------------|
| `id`                 | `uuid`         | `PRIMARY KEY`, `DEFAULT gen_random_uuid()`                            | Unique identifier for the error log.                           |
| `user_id`            | `uuid`         | `NULL`, `FOREIGN KEY REFERENCES auth.users(id) ON DELETE CASCADE`     | Identifier of the user (if the error is associated with one).  |
| `model`              | `VARCHAR(255)` |                                                                       | Name of the AI model that caused the error.                    |
| `source_text_hash`   | `VARCHAR(64)`  |                                                                       | SHA-256 hash of the source text.                               |
| `source_text_length` | `INTEGER`      |                                                                       | Length of the source text.                                     |
| `error_code`         | `VARCHAR(100)` |                                                                       | Error code returned by the API.                                |
| `error_message`      | `TEXT`         |                                                                       | Full content of the error message.                             |
| `created_at`         | `TIMESTAMPTZ`  | `NOT NULL`, `DEFAULT now()`                                           | Timestamp of when the error occurred.                          |

## 2. Table Relationships

-   **`users` (from `users`) to `flashcards`**: One-to-many. One user can have many flashcards.
-   **`users` (from `users`) to `generations`**: One-to-many. One user can initiate many generation processes.
-   **`users` (from `users`) to `generation_error_logs`**: One-to-many. One user can be associated with many error logs.
-   **`generations` to `flashcards`**: One-to-many (optional). One generation process can result in many flashcards. The relationship is optional (`generation_id` can be `NULL`) to handle manually created flashcards.

## 3. Indexes

To ensure high query performance, indexes will be created on all foreign key columns.

```sql
-- Index for flashcards table
CREATE INDEX idx_flashcards_user_id ON flashcards(user_id);
CREATE INDEX idx_flashcards_generation_id ON flashcards(generation_id);

-- Index for generations table
CREATE INDEX idx_generations_user_id ON generations(user_id);

-- Index for generation_error_logs table
CREATE INDEX idx_generation_error_logs_user_id ON generation_error_logs(user_id);
```

## 4. PostgreSQL Policies (Row-Level Security)

All tables (`flashcards`, `generations`, `generation_error_logs`) will be protected by RLS policies in Supabase. This will ensure that users can only access their own data.

**Example policy for the `flashcards` table:**
```sql
-- Enable RLS for the table
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;

-- Policy to allow full access (SELECT, INSERT, UPDATE, DELETE) only for the data owner
CREATE POLICY "Enable all actions for users based on user_id"
ON flashcards
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```
Similar policies will be defined for the `generations` and `generation_error_logs` tables.

## 5. Additional Notes and Design Decisions

1.  **Automatic `updated_at` update**:
    A trigger function in PostgreSQL must be implemented to automatically update the `updated_at` column in the `flashcards` table upon each row modification.
    ```sql
    -- Trigger function
    CREATE OR REPLACE FUNCTION handle_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    -- Trigger for the flashcards table
    CREATE TRIGGER on_flashcards_update
    BEFORE UPDATE ON flashcards
    FOR EACH ROW
    EXECUTE PROCEDURE handle_updated_at();
    ```

2.  **GDPR Compliance**:
    The use of the `ON DELETE CASCADE` rule for the `user_id` foreign keys in all tables ensures that if a user's account is deleted from `auth.users`, all their associated data (flashcards, generation history, error logs) will be automatically and permanently deleted from the database.

3.  **`users` Table**:
    The schema does not define a `users` table because it is managed by the Supabase Auth service and is located in the `auth` schema (`auth.users`). All references to `user_id` point to the `id` column in that table.
