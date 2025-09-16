# UniName - Local NLP Username Generator

A full-stack app that generates unique, meaningful usernames from your name, date of birth, and an optional flavor word. Uses only local, free NLP libraries (no external AI calls).

## Run (Windows)

1. Install Node.js 18+
2. In PowerShell:

```
cd C:\Users\Asus\Desktop\IWISHYOUSEARCH
npm install --prefix server
npm run dev
```

Open `http://localhost:3001` and use the UI.

## API

POST `/api/generate`
```json
{
  "name": "Ayesha Khan",
  "birthDate": "2001-06-15",
  "word": "galaxy",
  "style": "smart",
  "count": 10
}
```

Returns `{ "usernames": string[] }`.

## Deploy to Render (free tier)

1. Push this repo to GitHub.
2. Go to Render and create a new Web Service.
3. Choose "Use Docker" and point to this repo; Render will detect `render.yaml`.
4. Deploy. Health check path: `/api/health`.

Alternatively, build and run locally with Docker:

```
docker build -t uniname .
docker run -p 3001:3001 uniname
```
