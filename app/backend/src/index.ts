import express from 'express';
import session from 'express-session';
import pgSession from 'connect-pg-simple';
import pg from 'pg';
import dotenv from 'dotenv';
import { OAuth2Client } from 'google-auth-library';

dotenv.config();

const app = express();
const port = 3000;

// 1. PostgreSQL接続プールの作成
const { Pool } = pg;
const pool = new Pool({
    host: process.env.DB_HOST || 'db',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: 5432,
});

const googleClient = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_CALLBACK_URL
);

// 2. セッションの設定（DBに保存する設定）
const PgStore = pgSession(session);
app.use(session({
    store: new PgStore({
        pool: pool,
        tableName: 'session' // SQLで作成したテーブル名
    }),
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30日間
        secure: false // 開発環境(http)なのでfalse。本番(https)はtrue
    }
}));

// 3. ルート（動作確認用）
app.get('/', (req, res) => {
    if (req.session && (req.session as any).userId) {
        res.send(`ログイン済みです。ユーザーID: ${(req.session as any).userId}`);
    } else {
        res.send('こんにちは！ログインしていません。<a href="/auth/google">Googleでログイン</a>');
    }
});

// 4. サーバー起動
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
    
    // DB接続確認
    pool.query('SELECT NOW()', (err, res) => {
        if (err) console.error('DB Connection Error:', err);
        else console.log('DB Connected Successfully at:', res.rows[0].now);
    });
});

app.get('/auth/google', (req, res) => {
    const url = googleClient.generateAuthUrl({
        access_type: 'offline',
        scope: [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email',
        ],
    });
    res.redirect(url);
});

app.get('/auth/google/callback', async (req, res) => {
    const { code } = req.query;

    try {
        const { tokens } = await googleClient.getToken(code as string);
        googleClient.setCredentials(tokens);

        const ticket = await googleClient.verifyIdToken({
        idToken: tokens.id_token!,
        audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();

        if (!payload || !payload.email) {
        throw new Error('ユーザー情報の取得に失敗しました');
        }

        // --- ここに制限アクセス（ホワイトリスト）のロジックを追加 ---
        const allowedEmails = (process.env.ALLOWED_EMAILS || "").split(',').map(email => email.trim());
        
        if (!allowedEmails.includes(payload.email)) {
        console.warn(`アクセス拒否: 許可されていないメールアドレスです (${payload.email})`);
        return res.status(403).send('このサイトへのアクセス権限がありません。');
        }
        // ---------------------------------------------------------

        // 許可されたユーザーのみ、DB保存・セッション開始へ進む
        const query = `
        INSERT INTO users (google_id, email, display_name, avatar_url, last_login)
        VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
        ON CONFLICT (google_id) DO UPDATE SET
            display_name = EXCLUDED.display_name,
            avatar_url = EXCLUDED.avatar_url,
            last_login = CURRENT_TIMESTAMP
        RETURNING *;
        `;
        const values = [payload.sub, payload.email, payload.name, payload.picture];
        const dbRes = await pool.query(query, values);

        (req.session as any).userId = dbRes.rows[0].id;

        res.redirect('/'); 
    } catch (error) {
        console.error('OAuth Error:', error);
        res.status(500).send('認証エラーが発生しました');
    }
});

const isAuthenticated = (req: any, res: any, next: any) => {
    if (req.session && req.session.userId) {
        return next(); // ログインしてればOK、次の処理へ
    }
    res.redirect('/'); // ログインしてなければトップへ飛ばす
};

// 使い方：守りたいルートに第2引数として差し込む
app.get('/dashboard', isAuthenticated, (req, res) => {
    res.send('ここは秘密のダッシュボードです');
});

app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
});