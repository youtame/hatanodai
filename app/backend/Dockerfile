FROM node:24

WORKDIR /usr/src/app

# package.jsonだけ先にコピー（これがDockerのビルドを速くするコツです）
COPY package*.json ./
RUN npm install

# ここでソースコードを全部入れる
COPY . .

# TSを直接動かすためのツールをグローバルに入れるか、npxで叩く
# CMD [ "npx", "tsx", "watch", "src/index.ts" ] # TS移行後はこれ！
CMD [ "npm", "run", "dev" ]