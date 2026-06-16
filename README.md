# MemeFlow

MemeFlow is a lightweight social platform for sharing short memes/videos built with React + TypeScript and Supabase.

## Overview
- Frontend: React, Vite, TypeScript
- Backend: Supabase (Auth + Postgres)
- Features: user profiles, posts (video), likes, comments, follows, direct messages

## Quick start
1. Install dependencies

```bash
npm install
```

2. Create environment file

```bash
cp example.env .env
# then edit .env with your Supabase URL and anon key
```

3. Run development server

```bash
npm run dev
```

4. Build for production

```bash
npm run build
```

## Database
- See `supabase/schema.sql` for the database schema and RLS policies.
- To run migrations locally, review `supabase/MIGRATION.sh`.

## Contributing
- Open issues or PRs on the repository. Keep commits atomic and descriptive.

## Notes
- `.env` is ignored by default. `example.env` is included as a template and should not contain secrets.

---

If you want, I can add more sections (architecture, API endpoints, deployment guide).