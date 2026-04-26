# Vuetifyのインストール方法を簡単に

## はじめに

このページでは、docker + vite + vuetifyの入れ方を簡単に紹介します。　この方法を使えば、自分のPC本体には関連ファイルを入れる必要がないのでとてもメンテナンスフリーです。

## 各ファイルを用意する

docker-compose.yml
```yml
services:
  vue-app:
    build:
      context: .
      dockerfile: Dockerfile
    volumes:
      - ./app:/app
    ports:
      - 5173:5173
    tty: true
```

Dockerfile
```text
FROM node:20-alpine

WORKDIR /app

# COPY app/package*.json ./

# RUN npm install

COPY . .

EXPOSE 5173

# CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
CMD ["sh"]
```

そして、現在のファイルの配置
```bash
|--Dockerfile
|--docker-compose.yml
```

## container内での手順

そして、以下のコマンドを実行します

```bash
docker compose up -d --build
```

そして、containerの中に入る
```bash
docker exec -it (containerの名前) sh
```

以下、コンテナ内で以下のコマンドを実行しインストールする

```sh
npm create vue@latest .
```

インストールについて質問されたら、
1. OK to proceed - yes
2. Package name - その時のプロジェクト名
3. Select features to include in your project - 大体Typescript
4. その次のやつはEnterで飛ばしていいっぽい
5. 具体例のやつが欲しいかいらないか

それから、vuetifyの依存関係のものをインストール
```sh
npm install vuetify
npm install -D sass vite-plugin-vuetify
npm install
```

一回コンテナを抜けて、自分のPCのDockerfileを

```text
FROM node:20-alpine

WORKDIR /app

COPY app/package*.json ./

RUN npm install

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
# CMD ["sh"]
```

変えます。そして、containerを作り直します。

```bash
docker compose down 
docker compose up -d --build
````

そして、以下のファイルを改造し、vuetifyに備えます。

main.ts
```typescript
import { createApp } from 'vue'
import App from './App.vue'

// Vuetify
import 'vuetify/styles'
import { createVuetify } from 'vuetify'

const vuetify = createVuetify()

createApp(App)
    .use(vuetify)
    .mount('#app')
```

vite.config.js
```js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'

export default defineConfig({
  plugins: [
    vue(),
    vuetify({ autoImport: true })
  ],
})
```

そして、localhost:5173にアクセスしましょう。　すると、vueのdefault pageをあなたは見るはずです。　しかしながら、それには別れを告げ、App.vueを

App.vue
```js
<template>
  <v-app>
    <v-app-bar color="primary" title="Vuetify Test" />

    <v-main>
      <v-container class="mt-6">
        <v-card class="pa-4" max-width="400">
          <v-card-title>Vuetify works</v-card-title>

          <v-card-text>
            Vuetify が正しく適用されています
          </v-card-text>

          <v-card-actions>
            <v-btn color="primary" variant="flat">
              Test Button
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
</script>
```

以上のような手続きを踏むことで、vuetifyをあなたの環境に導入できました。

## おまけ
この方法だとコンテナをわざわざ終わらせる、立ち上げるをしないとdevサーバーが起動しないので、Dockerfileを

Dockerfile
```text
FROM node:20-alpine

WORKDIR /app

COPY app/package*.json ./

RUN npm install

COPY . .

EXPOSE 5173

CMD ["sh"]
```

にし、この後にpackage.jsonの該当部分を

```json
  },
  "scripts": {
    "dev": "vite --host 0.0.0.0"
```
以上のように、`--host 0.0.0.0`をつければ、docker compose up -dでcontainerを立ち上げた後にdocker execでコンテナ内に入ってnpm run devすれば、localhost:5173でページを見ることができます。　これなら、containerをいちいち潰さなくてもnpm run devを終わらせることができます。

## 最後に
これで終わりです。