# SEDS REC — Team Management & Sprint Platform (Mission OS)

A production-ready internal operating system designed for **SEDS REC** (Students for the Exploration and Development of Space) to coordinate multiple aerospace subsystems, engineering teams, agile sprints, collaborative tasks, telemetry deliverables, and operational performance.

Built with a **Mission Control × Modern Productivity OS** dark-first design language.

---

## 1. Project Overview

The SEDS REC platform solves the organizational challenges of high-tempo space engineering projects (sounding rockets, CanSats, high-altitude balloons, ground stations). 

### Key Capabilities:
* **Subsystem Hierarchy**: Teams operate in defined subsystems (`Project Medersia`, `Aerospace Systems`, `Ground Station`, `Content & Media`, `Outreach & PR`, `Technical & Avionics`, `Events & Operations`).
* **One-User-One-Team Model**: Each engineer belongs to exactly one team, while teams may have multiple team leads.
* **Three-Tier Role Security**:
  * `OFFICE_BEARER`: High-level command center, executive visibility, organization sprint health matrix, full drill-down from org → team → sprint → task → member.
  * `TEAM_LEAD`: Complete management over their team's deliverables, sprints, backlog, member workload, announcements, and task assignments. Zero access to other teams' private management data.
  * `TEAM_MEMBER`: Focused personal cockpit showing **My Tasks**, collaborative deliverables, active sprint pacing, and direct communication with leads. Members are never overwhelmed with administrative controls and cannot see other members' private tasks or the full unassigned board.
* **Collaborative Tasks**: Many-to-many task assignment (`task_assignees`). Collaborative tasks are visible simultaneously to all assigned engineers, their team leads, and office bearers.
* **Integrated Communication**: Contextual comments thread on tasks, system bulletins/announcements, and direct member-to-lead dispatch.
* **Dual Operation Engine**: Instant out-of-the-box local demo simulation with seeded aerospace workflows, and immediate production connectivity to Supabase PostgreSQL with Row Level Security (RLS).

---

## 2. Technology Stack

* **Frontend**: Next.js 15 (App Router, Server Components & Client Components), React 19, TypeScript
* **Styling**: Tailwind CSS v4, custom Mission Control dark theme tokens, glass surfaces
* **Icons**: Lucide Icons
* **Charts & Analytics**: Recharts (Sprint Burndown, Task Distribution, Member Workload)
* **Drag-and-Drop**: HTML5 drag-and-drop & pointer events for lag-free board interactions
* **Celebration Effects**: `canvas-confetti` on sprint completion
* **Validation**: Zod schema validation
* **Backend**: Next.js App Router Server Actions / API routes
* **Database & Auth**: Supabase PostgreSQL, Supabase Auth, Row Level Security (RLS), Supabase Realtime
* **Deployment Target**: GitHub → Vercel → Supabase (No paid services required)

---

## 3. Local Development Setup

### Prerequisites
* Node.js 18.x, 20.x, or 22+ (tested on Node v26)
* npm, yarn, or pnpm

### Quick Start (Clone & Run Immediately)

```bash
# 1. Clone the repository
git clone https://github.com/your-org/seds-sprint-planner.git
cd seds-sprint-planner

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

> [!NOTE]
> The application is pre-configured with a **Dual Data Provider**. It runs immediately out of the box with rich seeded aerospace data and a development role switcher in the top navigation bar. No database account is required to test and evaluate the entire UI.

---

## 4. Supabase Setup

To connect to a live Supabase cloud backend:

1. Create a free project at [supabase.com](https://supabase.com).
2. Go to **Project Settings** → **API**.
3. Copy **Project URL** and **anon public key**.
4. In your project root, create `.env.local` by copying `.env.example`:

```bash
cp .env.example .env.local
```

5. Fill in the keys:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

---

## 5. Database Migration Instructions

All database migrations are committed under `supabase/migrations/`:

```
supabase/migrations/00001_initial_schema.sql
```

### Option A: Using the Supabase Dashboard SQL Editor
1. In your Supabase Dashboard, open **SQL Editor**.
2. Click **New Query**.
3. Open `supabase/migrations/00001_initial_schema.sql`, copy its entire content, paste into the editor, and click **Run**.
4. The tables, enums, triggers, indexes, and RLS policies are immediately generated.

### Option B: Using the Supabase CLI
```bash
supabase link --project-ref your-project-ref
supabase db push
```

---

## 6. Seed Data Instructions

A realistic aerospace seed script is provided in `supabase/seed/seed.sql`:

```
supabase/seed/seed.sql
```

1. In Supabase Dashboard, go to **SQL Editor**.
2. Paste the contents of `supabase/seed/seed.sql` and run.
3. This creates:
   * 7 SEDS Subsystems (`Project Medersia`, `Aerospace Systems`, `Ground Station`, etc.)
   * Fictional personnel across all 3 roles
   * Active and completed sprints
   * Collaborative and single-assignee tasks
   * Technical comments, activity logs, announcements, and notifications

---

## 7. Environment Variables

Create `.env.local` for local execution or define these variables in your Vercel deployment settings:

| Variable | Description | Exposure |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project API URL | Client + Server |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon public key | Client + Server |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret admin key (server-side only) | Server Only |
| `NEXT_PUBLIC_APP_NAME` | SEDS Platform Title | Client + Server |

---

## 8. Authentication Setup

Authentication is handled via Supabase Auth with email and password:
* Protected routes with session verification
* User profile linking to `auth.users(id)` via foreign key constraint
* Role-based route protection
* Seamless dev simulation switcher in development mode:
  * **Dr. Ananya Sharma** (`president@sedsrec.org`) — *Office Bearer*
  * **Vikram Rao** (`vikram.rao@sedsrec.org`) — *Team Lead (Medersia)*
  * **Sneha Patel** (`sneha.patel@sedsrec.org`) — *Co-Lead (Medersia)*
  * **Arjun Kumar** (`arjun.k@sedsrec.org`) — *Team Member (Medersia)*
  * **Rithika Sen** (`rithika.s@sedsrec.org`) — *Team Member (Aerospace)*
  * **Karthik V** (`karthik.v@sedsrec.org`) — *Team Member (Ground Station)*

---

## 9. Vercel Deployment

Deploying the project on Vercel takes under 2 minutes:

1. Push your repository to GitHub.
2. In the [Vercel Dashboard](https://vercel.com), click **Add New** → **Project**.
3. Import your `seds-sprint-planner` repository.
4. Framework Preset: **Next.js**.
5. Under **Environment Variables**, add:
   * `NEXT_PUBLIC_SUPABASE_URL`
   * `NEXT_PUBLIC_SUPABASE_ANON_KEY`
6. Click **Deploy**.

Vercel will build the production application with optimized static and dynamic routes.

---

## 10. GitHub Deployment Workflow

The repository is structured for continuous deployment:

```
Developer commits changes
       ↓
git push origin main
       ↓
GitHub Repository
       ↓ (Webhook)
Vercel Production Build
       ↓
Instant Live Update
```

Database schema migrations are tracked via versioned SQL files in `supabase/migrations/`.

---

## 11. Role / Permission Architecture

Security and access rules are enforced both client-side and at the database level via PostgreSQL RLS:

| Capability | OFFICE_BEARER | TEAM_LEAD | TEAM_MEMBER |
|---|:---:|:---:|:---:|
| View All Teams & Metrics | ✅ Yes | ❌ (Own team only) | ❌ (Own team only) |
| Create & Manage Teams | ✅ Yes | ❌ No | ❌ No |
| Create Sprints | ✅ Yes | ✅ Yes (Own team) | ❌ No |
| Start / Complete Sprints | ✅ Yes | ✅ Yes (Own team) | ❌ No |
| Create Tasks | ✅ Yes | ✅ Yes (Own team) | ❌ No |
| Drag & Reassign Tasks | ✅ Yes | ✅ Yes (Own team) | ❌ No |
| View Entire Team Kanban | ✅ Yes | ✅ Yes (Own team) | ❌ No (My Tasks only) |
| Update Task Status | ✅ Yes | ✅ Yes (Own team) | ✅ Yes (Only assigned tasks) |
| Collaborative Task Access | ✅ Yes | ✅ Yes (Own team) | ✅ Yes (If assigned) |
| Unassigned Task Visibility | ✅ Yes | ✅ Yes (Own team) | ❌ Restricted |
| Post Org Announcements | ✅ Yes | ❌ No | ❌ No |
| Post Team Announcements | ✅ Yes | ✅ Yes (Own team) | ❌ No |
| Send Lead Messages | ✅ Yes | ✅ Yes | ✅ Yes |

---

## 12. Database Architecture (Entity Relationships)

```
profiles (extends auth.users)
   ├── id (UUID, PK)
   ├── role (ENUM: OFFICE_BEARER, TEAM_LEAD, TEAM_MEMBER)
   └── team_id (UUID, FK -> teams.id)

teams
   ├── id (UUID, PK)
   ├── name, description, icon, color
   └── created_at, updated_at

sprints
   ├── id (UUID, PK)
   ├── team_id (UUID, FK -> teams.id)
   ├── name, goal, start_date, end_date
   └── status (ENUM: PLANNED, ACTIVE, COMPLETED, ARCHIVED)

tasks
   ├── id (UUID, PK)
   ├── team_id (UUID, FK -> teams.id)
   ├── sprint_id (UUID, FK -> sprints.id, NULLABLE)
   ├── title, description
   ├── status (ENUM: BACKLOG, TODO, IN_PROGRESS, IN_REVIEW, COMPLETED, BLOCKED)
   ├── priority (ENUM: LOW, MEDIUM, HIGH, URGENT)
   └── story_points (INTEGER)

task_assignees (Many-to-Many Collaborative Tasks)
   ├── task_id (UUID, FK -> tasks.id)
   └── user_id (UUID, FK -> profiles.id)

comments
   ├── id (UUID, PK)
   ├── task_id (UUID, FK -> tasks.id)
   ├── author_id (UUID, FK -> profiles.id)
   └── content (TEXT)

announcements
   ├── id (UUID, PK)
   ├── team_id (UUID, FK -> teams.id, NULL = ORG WIDE)
   ├── created_by (UUID, FK -> profiles.id)
   └── title, content, priority
```

---

## 13. Realtime Architecture

* Realtime publications are configured on `tasks`, `task_assignees`, `comments`, `announcements`, and `notifications`.
* When Team Leads reassign or move a task on the Kanban board, assigned members' screens update automatically.
* When comments are posted in the task drawer, discussion streams update in real time.
* Local event dispatchers keep multiple tabs in sync during offline or demo modes.

---

## 14. Troubleshooting

* **Build error with Next 15 App Router dynamic params**:
  In Next.js 15, `params` in dynamic routes (`[teamId]/page.tsx`) is a Promise. Ensure you use `const { teamId } = await params;`.
* **Database connection timeout**:
  Verify your Supabase project is active and that your IP is not blocked by database firewall rules.
* **RLS policy blocking queries**:
  Ensure the authenticated user profile exists in `profiles` and has the matching `role` and `team_id`.
* **Resetting local demo storage**:
  Click the **DEMO SWITCHER** in the top navigation bar and select **Reset Data** to re-initialize seed data from scratch.

---

Designed with 🚀 for **SEDS REC** Space Systems Engineering.
