DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS session;

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    google_id TEXT UNIQUE NOT NULL,    -- Googleから返ってくる一意の識別子 (sub)
    email TEXT UNIQUE NOT NULL,        -- あなたのメールアドレス
    display_name TEXT,                 -- 表示名（任意）
    avatar_url TEXT,                   -- アイコンURL（任意）
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- セッション管理用テーブル（これがあると、Docker再起動してもログインが切れません）
-- connect-pg-simple などのライブラリを使う場合の標準的な構成です
CREATE TABLE "session" (
  "sid" varchar NOT NULL COLLATE "default",
  "sess" json NOT NULL,
  "expire" timestamp(6) NOT NULL
)
WITH (OIDS=FALSE);


DELETE FROM session WHERE expire < NOW();
ALTER TABLE "session" ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE;
CREATE INDEX "IDX_session_expire" ON "session" ("expire");
