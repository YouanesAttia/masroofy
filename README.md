# مصروفي — Masroofy

> **Track your money. Own your month.**  
> تطبيق تتبع المصاريف للطلاب المصريين

<div align="center">

![Masroofy](https://img.shields.io/badge/مصروفي-Expense%20Tracker-teal?style=for-the-badge)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?style=for-the-badge&logo=supabase)
![Tailwind](https://img.shields.io/badge/Tailwind-CSS-06B6D4?style=for-the-badge&logo=tailwindcss)

</div>

---

## What is Masroofy?

Masroofy (مصروفي) is a personal expense tracker designed specifically for Egyptian university students. It helps you understand where your money goes, set a monthly budget, and actually stick to it — with smart insights, spending breakdowns, and a brutally honest notification system that roasts you when you overspend.

Built fully in Arabic with English support. Works on mobile as a PWA (installable on your home screen).

---

## Screenshots

| Dashboard       | Add Expense     | History         | Insights        | Settings        |
| --------------- | --------------- | --------------- | --------------- | --------------- |
| _(coming soon)_ | _(coming soon)_ | _(coming soon)_ | _(coming soon)_ | _(coming soon)_ |

---

## Features

### 💰 Budget Management

- Set a monthly spending limit in EGP
- Visual circular progress ring showing how much you've spent
- Color-coded: green → yellow → red as you approach your limit
- Customizable warning threshold and budget reset day

### 📝 Expense Tracking

- Add expenses in seconds with a smooth bottom sheet
- 10 categories: Food, Transport, Recharge, Printing, Entertainment, Stationery, Clothes, Health, Rent, Other
- Optional notes, recurring expenses, and custom dates

### 📅 History

- Browse expenses by month with forward/back navigation
- Filter by category or search by name in real time
- Swipe to delete, tap to edit
- Grouped by day with Arabic date headers

### 📊 Insights

- Bar chart comparing this month vs last month
- Donut chart showing spending by category
- Smart insights: top spending day, month-over-month comparison, budget pace warning, savings projection
- Monthly savings goal with progress bar

### 🔔 Tough Love Notifications

- Browser push notifications when you hit your warning threshold
- Exceeded your budget? You'll hear about it
- Roast messages that are sharp, funny, and brutally honest
- In-app roast banner on dashboard for users without notifications enabled
- 20% chance of encouragement when you're actually doing well

### 🌙 Dark Mode

- Full dark theme support
- Light / Dark / System options
- Applied before React renders — zero white flash on load

### 🌐 Bilingual

- Full Arabic and English support
- Instant language switching — no refresh needed
- RTL / LTR layout direction changes automatically
- Preference saved to Supabase and localStorage

### 📲 PWA — Installable App

- Works offline (with cached assets)
- Installable on Android and iOS home screens
- Standalone mode — no browser bar
- Offline banner when internet is lost

### 🔒 Secure by Design

- Supabase Row Level Security on every table
- Users can only ever see their own data
- Auth via Supabase email + password
- Auto-created profile and default budget on signup

---

## Tech Stack

| Layer     | Technology            | Why                                      |
| --------- | --------------------- | ---------------------------------------- |
| Framework | React 18 + TypeScript | Type-safe, component-based UI            |
| Styling   | Tailwind CSS v4       | Utility-first, dark mode, fast iteration |
| Routing   | React Router v6       | Client-side navigation                   |
| Backend   | Supabase              | Postgres + Auth + RLS out of the box     |
| Charts    | Recharts              | Responsive SVG charts in React           |
| Icons     | Lucide React          | Clean, consistent icon set               |
| Build     | Vite                  | Fastest dev server and build tool        |
| PWA       | vite-plugin-pwa       | Service worker + manifest generation     |

---

## Project Structure

```
masroofy/
├── public/
│   ├── icons/                  # PWA icons (192×192, 512×512)
│   └── manifest.json           # PWA web manifest
├── src/
│   ├── components/
│   │   ├── AddExpenseSheet.tsx  # Bottom sheet expense form
│   │   ├── ErrorBoundary.tsx   # Catches render errors
│   │   ├── Header.tsx          # Mobile top bar
│   │   ├── InstallPrompt.tsx   # PWA install banner
│   │   ├── Layout.tsx          # Sidebar + bottom nav shell
│   │   ├── OfflineBanner.tsx   # No internet banner
│   │   ├── Skeleton.tsx        # Loading skeleton screens
│   │   ├── Spinner.tsx         # Centered loading spinner
│   │   └── Toast.tsx           # Success / error toasts
│   ├── context/
│   │   ├── AuthContext.tsx     # Supabase auth state
│   │   └── LanguageContext.tsx # Language + t() translation
│   ├── hooks/
│   │   └── useFadeIn.ts        # Page fade-in animation
│   ├── lib/
│   │   ├── categories.ts       # 10 expense categories
│   │   ├── format.ts           # Date, time, currency formatters
│   │   ├── notifications.ts    # Browser push notifications
│   │   ├── roastMessages.ts    # Tough love notification messages
│   │   ├── supabase.ts         # Supabase client
│   │   └── translations.ts     # AR + EN translation strings
│   ├── pages/
│   │   ├── Dashboard.tsx       # Home: budget ring + recent expenses
│   │   ├── History.tsx         # Monthly expense list
│   │   ├── Insights.tsx        # Charts + smart insights
│   │   ├── Login.tsx           # Sign in page
│   │   ├── NotFound.tsx        # 404 page
│   │   ├── Settings.tsx        # Budget, theme, language, data
│   │   └── Signup.tsx          # Create account page
│   ├── types/
│   │   └── index.ts            # TypeScript interfaces
│   ├── App.tsx                 # Router + providers
│   └── main.tsx               # Entry point + theme init
├── supabase-setup.sql          # Full database setup script
├── .env.example                # Environment variable template
├── vite.config.ts              # Vite + PWA config
└── tailwind.config.js          # Tailwind dark mode config
```

---

## Getting Started

### Prerequisites

- Node.js 18 or higher
- A free [Supabase](https://supabase.com) account

### 1. Clone the repository

```bash
git clone https://github.com/your-username/masroofy.git
cd masroofy
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Find these at:
**Supabase Dashboard → Your Project → Project Settings → API**

### 4. Set up the database

- Go to **Supabase Dashboard → SQL Editor → New Query**
- Open the file `supabase-setup.sql` from this repo
- Copy the entire contents and paste into the editor
- Click **Run**

You should see: `Success. No rows returned.`

This creates all 4 tables, enables Row Level Security, sets up RLS policies, and adds triggers that auto-create a profile and default budget when a user signs up.

### 5. Start the development server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## Deployment

### Deploy to Vercel (Recommended)

#### 1. Push to GitHub

```bash
git add .
git commit -m "initial commit"
git push origin main
```

#### 2. Import on Vercel

- Go to [vercel.com](https://vercel.com) and sign in with GitHub
- Click **Add New Project**
- Import your `masroofy` repository
- Framework preset will be detected as **Vite** automatically

#### 3. Add environment variables

In the Vercel project setup, under **Environment Variables**, add:

| Key                      | Value                                 |
| ------------------------ | ------------------------------------- |
| `VITE_SUPABASE_URL`      | `https://your-project-id.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `your-anon-key-here`                  |

#### 4. Deploy

Click **Deploy**. Your app will be live in about 60 seconds.

Every future `git push` to `main` triggers an automatic redeployment.

---

## Pre-Deployment Checklist

Go through this before releasing:

**Environment**

- [ ] `.env` file exists with real Supabase credentials
- [ ] `npm run build` completes with no errors
- [ ] No console errors in the browser

**Database**

- [ ] `supabase-setup.sql` has been run in Supabase SQL Editor
- [ ] All 4 tables visible: `profiles`, `budgets`, `expenses`, `savings_goals`
- [ ] Test signup → profile and budget rows are auto-created
- [ ] RLS works: two different users cannot see each other's data

**Functionality**

- [ ] Sign up, log in, log out all work
- [ ] Adding an expense updates the dashboard immediately
- [ ] Budget ring animates on load
- [ ] History month navigation works
- [ ] Edit and delete expense work correctly
- [ ] Settings save and persist after page refresh
- [ ] Dark mode applies instantly and persists after refresh
- [ ] Language switching works on all pages
- [ ] CSV export downloads a valid file

**Mobile**

- [ ] Tested on a real phone (Chrome on Android)
- [ ] Bottom navigation taps work correctly
- [ ] Add expense sheet slides up smoothly
- [ ] Swipe-to-delete works on expense rows

**PWA**

- [ ] Chrome shows "Install app" option
- [ ] App installs to home screen
- [ ] Installed app opens in standalone mode (no browser bar)
- [ ] Offline banner appears when internet is disconnected

**Vercel**

- [ ] Environment variables added in Vercel dashboard
- [ ] Production URL works on mobile
- [ ] No build errors in Vercel deployment log

---

## Supabase Configuration Tips

### Disable email confirmation (for easier testing)

Go to **Supabase Dashboard → Authentication → Email Templates → Confirm signup** and disable it. Users can sign in immediately without confirming their email.

### View your data

Go to **Supabase Dashboard → Table Editor** to browse all rows in all tables and verify data is being saved correctly.

### Monitor auth

Go to **Supabase Dashboard → Authentication → Users** to see all registered users.

---

## Contributing

This is a personal project built for Egyptian students. If you want to contribute:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "add your feature"`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## License

MIT License — free to use, modify, and distribute.

---

<div align="center">

Built with ❤️ for Egyptian students

صُنع بـ ❤️ للطلاب المصريين

**[Live Demo](https://masroofy.vercel.app)** • **[Report a Bug](https://github.com/your-username/masroofy/issues)** • **[Request a Feature](https://github.com/your-username/masroofy/issues)**

</div>
