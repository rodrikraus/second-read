# Second Read

An internal tool for reviewing customer support replies after they went out: a team lead records what they thought of a reply, the specialist reads it back.

Built for the Sellervate Product Engineer technical exercise.

## Run it locally

You need Node 20.9 or newer and Docker Desktop running.

```bash
git clone https://github.com/rodrikraus/second-read.git
cd second-read
npm install
npm run db:start          # first run pulls the Supabase images, a few minutes
cp .env.example .env.local
npm run dev               # http://localhost:3000
```

`.env.example` holds the local Supabase URL and keys. They are the same on every machine that runs Supabase locally, and `npm run db:status` prints them if you want to check.

To keep the first start fast, `supabase/config.toml` turns off the Supabase services this app does not use: Studio, Storage, Realtime, Edge Functions, analytics and the mail catcher. Set `enabled = true` under `[studio]` if you want the table browser at http://127.0.0.1:54323.

## Stack

Next.js 16 (App Router, TypeScript), Supabase (local Postgres and Auth), Tailwind CSS 4 with daisyUI 5. Started from `create-next-app` 16.3.6.
