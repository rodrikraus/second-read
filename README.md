# Second Read

An internal tool for reviewing customer support replies after they went out: a team lead records what they thought of a reply, the specialist reads it back.

Built for the Sellervate Product Engineer technical exercise.

## Run it locally

You need Node 22 or newer (Supabase's JavaScript client requires it) and Docker Desktop running.

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

`db:start` loads the seed only the first time. Seed dates are relative to the day the seed runs, so run `npm run db:reset` before trying the app on any later day: it rebuilds the database from the migrations and the seed, and yesterday has replies waiting again.

## Being each role

Open http://localhost:3000 and pick a person. Sign-in is stubbed: the picker opens a real Supabase session for a seeded account (they all share the password `second-read-demo`), so the database enforces what that person can see. Switch person from the menu in the top-right corner.

| Person | Role | Brands |
|---|---|---|
| Marta Ruiz | Team lead | Voltra, Boxwell |
| Nuria Campos | Team lead | Oddbird Coffee |
| Dani Ortega | Specialist | Voltra, Oddbird Coffee |
| Sofía Méndez | Specialist | Voltra, Boxwell |
| Leo Varela | Specialist | Boxwell, Oddbird Coffee |

## Checking the isolation yourself

`npm run db:test` runs the pgTAP checks in `supabase/tests`, as anon, a lead and two specialists.

To ask the API directly, sign in as Dani and request Boxwell's replies. Boxwell is not one of his brands:

```bash
KEY=sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH
TOKEN=$(curl -s "http://127.0.0.1:54321/auth/v1/token?grant_type=password" -H "apikey: $KEY" -H "Content-Type: application/json" -d '{"email":"dani@second-read.test","password":"second-read-demo"}' | node -pe "JSON.parse(require('fs').readFileSync(0)).access_token")
curl -s "http://127.0.0.1:54321/rest/v1/replies?brand_id=eq.20000000-0000-4000-8000-000000000002&select=id" -H "apikey: $KEY" -H "Authorization: Bearer $TOKEN"
# []
```

## Stack

Next.js 16 (App Router, TypeScript), Supabase (local Postgres and Auth), Tailwind CSS 4 with daisyUI 5. Started from `create-next-app` 16.3.6.
