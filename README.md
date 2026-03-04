# Internal Team Tracker

A real-time task management and team coordination platform built for internal teams. Track tasks with live timers, monitor team presence, manage departments, and oversee operations with a full admin panel.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Backend/Auth**: Supabase (PostgreSQL, Auth, Storage)
- **Runtime**: React 19

## Features

### Authentication & Access Control
- Google OAuth sign-in via Supabase
- Role-based access (Admin / Employee)
- New user approval workflow — admins approve or reject signups
- First registered user automatically becomes admin

### Task Management
- Create tasks with description and department (Automation / Web Dev)
- Live timer that tracks active work sessions in real time
- Start, pause, switch between, complete, and restore tasks
- Timer automatically pauses/resumes with shift status changes
- Completed tasks section with timestamps

### Team Presence & Visibility
- Real-time shift status: Available, Busy, Do Not Disturb, Be Right Back, Appear Away, Off Shift
- Presence indicators (online/busy/offline) across the app
- Team sidebar showing all members, their status, and current tasks
- "Currently Working" overview for the whole team

### Admin Panel
- Dashboard stats: total members, online count, approved, pending, rejected
- Department activity overview
- Pending approval queue with role assignment
- Team member role management
- Task overview grouped by user with inline time editing
- Re-approve previously rejected users

### UI/UX
- Dark/light mode with toggle (dark by default)
- YouTube-inspired color scheme with CSS custom properties
- Fully responsive — mobile floating sidebar, adaptive layouts
- Confirmation dialogs for destructive actions
- Avatar upload with Supabase Storage

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase project

### Environment Variables

Create a `.env.local` file in the project root:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Supabase Setup

1. Create a new Supabase project
2. Run the database schema (see [Database Schema](#database-schema) below)
3. Enable Google OAuth in Authentication > Providers
4. Add your app URL to Authentication > URL Configuration:
   - Site URL: `https://your-domain.com`
   - Redirect URLs: `https://your-domain.com/auth/callback`
5. Create a public storage bucket named `avatars`

### Google Cloud Console

1. Create OAuth 2.0 credentials in Google Cloud Console
2. Add authorized JavaScript origins: `https://your-domain.com`
3. Add authorized redirect URI: `https://your-supabase-url.supabase.co/auth/v1/callback`
4. Copy Client ID and Secret into Supabase Auth > Providers > Google

### Install & Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Build for Production

```bash
npm run build
npm start
```

## Database Schema

### profiles

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| id | UUID (PK, FK → auth.users) | — | User ID |
| email | TEXT | — | User email |
| full_name | TEXT | null | Display name |
| avatar_url | TEXT | null | Avatar image URL |
| role | TEXT | 'employee' | admin or employee |
| status | TEXT | 'pending' | pending, approved, or rejected |
| presence_status | TEXT | 'offline' | online, offline, or busy |
| shift_status | TEXT | 'off_shift' | off_shift, available, busy, do_not_disturb, be_right_back, appear_away |
| approved_by | UUID (FK → profiles) | null | Admin who approved |
| approved_at | TIMESTAMPTZ | null | Approval timestamp |
| created_at | TIMESTAMPTZ | now() | Account creation |

### tasks

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| id | UUID (PK) | gen_random_uuid() | Task ID |
| user_id | UUID (FK → profiles) | — | Owner |
| description | TEXT | — | Task description |
| department | TEXT | — | automation or webdev |
| is_current | BOOLEAN | false | Currently being timed |
| total_seconds | BIGINT | 0 | Accumulated work time |
| session_started_at | TIMESTAMPTZ | null | Current session start |
| completed_at | TIMESTAMPTZ | null | Completion timestamp |
| created_at | TIMESTAMPTZ | now() | Task creation |

### Row Level Security

- All authenticated users can read all profiles and tasks (team transparency)
- Users can only create/update/delete their own tasks
- Users can update their own profile (avatar, shift status)
- Only approved admins can update other users' profiles (role, status)
- Admins can edit any task's logged time

### Triggers

- `handle_new_user()`: Auto-creates a profile on signup. First user becomes admin + approved; subsequent users are employee + pending.

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Dashboard
│   ├── login/page.tsx        # Login page
│   ├── pending/page.tsx      # Pending approval page
│   ├── admin/page.tsx        # Admin panel
│   ├── auth/callback/route.ts # OAuth callback
│   ├── layout.tsx            # Root layout
│   └── globals.css           # Theme & global styles
├── components/
│   ├── TaskPanel.tsx         # Task management UI
│   ├── TeamSidebar.tsx       # Team member sidebar
│   ├── TeamTasksModal.tsx    # View team member tasks
│   ├── StatusDropdown.tsx    # Shift status selector
│   ├── WelcomeHeader.tsx     # User greeting & avatar
│   ├── ThemeToggle.tsx       # Dark/light mode switch
│   ├── Avatar.tsx            # Avatar display
│   ├── AvatarUpload.tsx      # Avatar upload
│   ├── SignOutButton.tsx     # Sign out with confirm
│   ├── ConfirmDialog.tsx     # Confirmation modal
│   ├── PresenceContext.tsx   # Presence state provider
│   ├── AdminPendingActions.tsx
│   ├── AdminRoleUpdate.tsx
│   ├── AdminReapprove.tsx
│   └── AdminTaskTimeEdit.tsx
└── lib/
    ├── supabase/
    │   ├── client.ts         # Browser Supabase client
    │   ├── server.ts         # Server Supabase client
    │   └── middleware.ts     # Session refresh
    ├── actions/
    │   ├── tasks.ts          # Task server actions
    │   ├── presence.ts       # Presence server actions
    │   └── users.ts          # User management actions
    └── utils/
        └── time.ts           # Time formatting helpers
```

## Deployment

Deployed on Vercel. Set the same environment variables in your Vercel project settings and configure Supabase + Google Cloud Console redirect URLs to match your production domain.

## License

Private — internal use only.
