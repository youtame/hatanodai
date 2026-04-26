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

CREATE TABLE print_pdfs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- 誰のプリントか
    file_name TEXT NOT NULL,                             -- 元のファイル名
    r2_key TEXT UNIQUE NOT NULL,                         -- R2上の保存パス（例: users/uuid/filename.pdf）
    file_size INTEGER,                                   -- 容量（バイト）
    content_type TEXT DEFAULT 'application/pdf',         -- MIMEタイプ
    ocr_status TEXT DEFAULT 'pending',                   -- pending, processing, completed, failed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


DELETE FROM session WHERE expire < NOW();
ALTER TABLE "session" ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE;
CREATE INDEX "IDX_session_expire" ON "session" ("expire");
CREATE INDEX idx_print_pdfs_user_id ON print_pdfs(user_id);
