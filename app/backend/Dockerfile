FROM node:24-alpine

# 開発に必要な最小限のパッケージをインストール（必要に応じて）
# alpineは軽量なので、もしビルドツールが必要なら apk add します
# RUN apk add --no-cache libc6-compat

WORKDIR /usr/src/app

# package.jsonが存在する場合のみコピーしてインストール
# 初期構築時はここがスキップされるか、空で動くようにします
COPY package*.json ./

# 依存関係のインストール
# ホストにpackage.jsonがない初期状態では、このRUNは失敗するか何もしません。
# なので、最初はコメントアウトしてビルドし、中でnpm initした後に戻すのが確実です。
RUN npm install

# アプリケーションのソースをコピー
COPY . .

# TypeScriptを実行するためのコマンド
# package.jsonのscriptsに "dev": "tsx watch src/index.ts" などと書く想定です
CMD [ "npm", "run", "dev" ]
# CMD ["sh"]