This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Home Assistant

Family Hub reads Home Assistant from server-side API routes. Configure these
values in `.env.local` for local development and in your production runtime for
deployment:

```bash
HA_URL="http://homeassistant.local:8123"
HA_TOKEN="your-long-lived-access-token"
```

Use server-only `HA_URL` and `HA_TOKEN`. Do not use `NEXT_PUBLIC_*` names for
Home Assistant credentials because those variables are exposed to browser
JavaScript.

You can start from the checked-in example file:

```bash
cp .env.example .env.local
```

The dashboard currently calls:

- `/api/health` for a basic app health check
- `/api/home-assistant/status` for Home Assistant connectivity and entity counts
- `/api/home-assistant/tasks` for to-do lists and task actions
- `/api/home-assistant/calendar` for upcoming events

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
