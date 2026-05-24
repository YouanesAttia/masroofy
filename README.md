# مصروفي — Masroofy

> تتبع مصاريفك بسهولة | Track your expenses with ease

A personal expense tracker built for Egyptian university students.
Manage your monthly budget, categorize spending, and get smart insights — all in Arabic.

---

## 📸 Screenshots

| Dashboard       | History         | Insights        | Settings        |
| --------------- | --------------- | --------------- | --------------- |
| _(coming soon)_ | _(coming soon)_ | _(coming soon)_ | _(coming soon)_ |

---

## ✨ Features

- 📊 **Dashboard** — Budget ring, spending summary, recent expenses
- 📝 **Add Expense** — Bottom sheet with category picker, recurring toggle
- 📅 **History** — Month navigation, category filters, swipe-to-delete, edit modal
- 📈 **Insights** — Bar chart comparison, pie chart breakdown, smart Arabic insights
- ⚙️ **Settings** — Budget config, theme (light/dark/system), CSV export, data deletion
- 🌙 **Dark mode** — Full dark theme support
- 📲 **PWA** — Installable on Android/iOS home screen
- 🔔 **Notifications** — Browser push notifications for budget warnings
- 🔒 **Secure** — Row Level Security via Supabase — each user sees only their own data

---

## 🛠 Tech Stack

| Layer    | Technology                       |
| -------- | -------------------------------- |
| Frontend | React 18 + TypeScript            |
| Styling  | Tailwind CSS v4                  |
| Routing  | React Router v6                  |
| Backend  | Supabase (Postgres + Auth + RLS) |
| Charts   | Recharts                         |
| Icons    | Lucide React                     |
| Build    | Vite                             |
| PWA      | vite-plugin-pwa                  |

---

## 🚀 Setup Instructions

### Prerequisites

- Node.js 18+
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
