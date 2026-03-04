# Internal Team Tracker — User Manual

This manual covers how to use the Internal Team Tracker for both **Employee** and **Admin** roles.

---

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [Dashboard Overview](#2-dashboard-overview)
3. [Task Management](#3-task-management)
4. [Shift Status & Presence](#4-shift-status--presence)
5. [Team Sidebar](#5-team-sidebar)
6. [Profile & Avatar](#6-profile--avatar)
7. [Theme Toggle](#7-theme-toggle)
8. [Signing Out](#8-signing-out)
9. [Admin Panel](#9-admin-panel-admin-only)

---

## 1. Getting Started

### Signing In

1. Go to the login page.
2. Click **Sign in with Google**.
3. Complete the Google authentication flow.

### First-Time Users

- After signing in for the first time, your account is **pending approval**.
- You will see a waiting screen until an admin approves your access.
- Once approved, you will be redirected to the main dashboard.

### First User (Initial Admin)

- The very first person to sign up automatically becomes an **Admin** and is approved immediately.

---

## 2. Dashboard Overview

After signing in, you land on the main dashboard which contains:

- **Welcome Header** — Displays your name, email, role badge (Admin/Employee), and avatar.
- **Task Panel** — Your personal task list with timer controls.
- **Team Sidebar** — List of all team members with presence status.
- **Status Dropdown** — Your current shift status selector (top navigation).
- **Theme Toggle** — Switch between dark and light mode (top navigation).
- **Sign Out Button** — Sign out of your account (top navigation).

---

## 3. Task Management

### Adding a Task

1. Click the **Add Task** button at the top of the task panel.
2. Enter a task description (max 120 characters).
3. Select a department: **Automation** or **Web Dev**.
4. Click **Add** to create the task.

The task appears in your queue.

### Starting Work on a Task

- **Double-click** a queued task to start working on it.
- The task moves to the **"Currently working on"** section at the top.
- A live timer begins counting your work time.

### Switching Tasks

- **Double-click** a different queued task to switch to it.
- The previous task's timer pauses and its accumulated time is saved.
- The new task's timer starts.

### Editing a Task

1. Click the **three-dot menu** (⋯) on a task.
2. Select **Edit**.
3. Modify the description and/or department.
4. Click **Save**.

### Completing a Task

1. Click the **three-dot menu** (⋯) on a task.
2. Select **Mark as done**.
3. Confirm in the dialog.
4. The task moves to the **Completed** section with a timestamp.

### Restoring a Completed Task

1. Expand the **Completed** section at the bottom of the task panel.
2. Click the **restore icon** on a completed task.
3. Confirm in the dialog.
4. The task returns to your active queue.

### Deleting a Task

1. Click the **three-dot menu** (⋯) on a task.
2. Select **Delete**.
3. Confirm in the dialog.
4. The task is permanently removed.

### Understanding the Timer

- The timer shows accumulated time in the format: **1h 30m**, **45m**, **2d 3h**, etc.
- Time only counts while the task is active and your shift status is a "working" status.
- Switching to Off Shift, Be Right Back, or Appear Away **automatically pauses** the timer.
- Switching back to Available, Busy, or Do Not Disturb **automatically resumes** the timer.

---

## 4. Shift Status & Presence

### Changing Your Status

1. Click the **status dropdown** in the top navigation bar.
2. Select one of the available statuses.

### Available Statuses

| Status | Presence Shown | Timer Effect |
|--------|---------------|--------------|
| **Off Shift** | Offline | Pauses timer |
| **Available** | Online | Resumes timer |
| **Busy** | Busy | Resumes timer |
| **Do Not Disturb** | Busy | Resumes timer |
| **Be Right Back** | Offline | Pauses timer |
| **Appear Away** | Offline | Pauses timer |

### Shift Toggle

- The status dropdown includes a **shift toggle switch** on the right side.
- Turning it **On** sets you to "Available" and resumes your timer.
- Turning it **Off** sets you to "Off Shift" and pauses your timer.

### How Presence Works

- Your presence is visible to all team members in the team sidebar.
- **Green dot** = Online
- **Red dot** = Busy
- **Gray dot** = Offline

---

## 5. Team Sidebar

### Desktop

- The team sidebar appears as a fixed panel on the right side of the screen.
- It shows all approved team members sorted by online status (online first).
- Each member displays:
  - Avatar with presence dot
  - Full name
  - Green pulsing indicator if they have an active task

### Mobile

- On mobile, tap the **floating red button** (bottom-right corner) to open the team sidebar.
- The button shows a badge with the number of online members.
- Tap outside the panel or the close button to dismiss.

### Viewing a Team Member's Tasks

1. Click the **three-dot menu** next to a team member's name.
2. Select **View all tasks**.
3. A modal opens showing their active tasks (with timers) and completed tasks.

### Search

- Use the search bar at the top of the sidebar to filter members by name or email.

---

## 6. Profile & Avatar

### Uploading an Avatar

1. Click on your avatar image in the welcome header.
2. Select an image file (max 2MB).
3. The avatar uploads and updates immediately.

### Avatar Display

- Your avatar appears in the welcome header, team sidebar, and admin panel.
- If no avatar is uploaded, a default icon is shown.

---

## 7. Theme Toggle

- Click the **sun/moon icon** in the top navigation to switch between dark and light mode.
- Dark mode is the default.
- Your preference is saved and persists across sessions.

---

## 8. Signing Out

1. Click the **Sign Out** button in the top navigation.
2. A confirmation dialog appears.
3. Click **Sign out** to confirm.
4. You are redirected to the login page.

---

## 9. Admin Panel (Admin Only)

Access the admin panel by clicking the **Admin** link in the top navigation. This section is only visible to users with the Admin role.

### Dashboard Statistics

At the top of the admin panel, you'll see:

- **Total Members** — Count of all registered users
- **Online Now** — Currently online members
- **Approved** — Approved users
- **Pending** — Users awaiting approval (amber highlight when > 0)
- **Rejected** — Previously rejected users

### Department Activity

Below the stats, two cards show the number of active tasks in each department:
- **Automation** — Active task count
- **Web Dev** — Active task count

### Currently Working

A grid showing all team members who have an active task running:
- Member avatar, name, and shift status
- Task department badge and description
- Live elapsed time

### Managing Pending Approvals

When new users sign up, they appear in the **Pending Approvals** section.

**To approve a user:**
1. Select a role from the dropdown: **Employee** or **Admin**.
2. Click the **Approve** button (green).
3. Confirm in the dialog.
4. The user gains access to the dashboard.

**To reject a user:**
1. Click the **Reject** button (red outline).
2. Confirm in the dialog.
3. The user is denied access and sees a rejection message.

When there are no pending users, the section shows "All caught up!"

### Managing Team Members

The **Team Members** section lists all approved users with:

- Avatar, name, email
- Current task (if working)
- Role badge (Admin / Employee)
- Presence and shift status

**To change a member's role:**
1. Select **Employee** or **Admin** from the dropdown next to their name.
2. Click **Update**.
3. Confirm in the dialog.

Note: You cannot change your own role.

### Task Overview

The **Task Overview** section shows all tasks grouped by user.

Each task displays:
- Status indicator:
  - **Green dot** = Currently running (with live timer)
  - **Gray dot** = Paused/queued
  - **Empty circle** = Completed
- Task description and department badge
- Elapsed time
- Created/completed dates

**To edit a task's logged time:**
1. Click the **pencil icon** next to the time display.
2. Enter hours and minutes in the inline editor.
3. Click **Save**.

This is useful for correcting time entries (e.g., if someone forgot to pause their timer).

### Re-approving Rejected Users

Rejected users appear in the **Rejected Users** section.

**To restore a rejected user:**
1. Select a role from the dropdown.
2. Click **Re-approve**.
3. Confirm in the dialog.
4. The user regains access with the selected role.

---

## Quick Reference

| Action | How |
|--------|-----|
| Add a task | Click "Add Task", fill description + department, click "Add" |
| Start working | Double-click a queued task |
| Switch tasks | Double-click a different task |
| Complete a task | Three-dot menu > Mark as done > Confirm |
| Delete a task | Three-dot menu > Delete > Confirm |
| Edit a task | Three-dot menu > Edit > Save |
| Restore a task | Completed section > Restore icon > Confirm |
| Go on break | Select "Be Right Back" from status dropdown |
| End shift | Toggle shift off or select "Off Shift" |
| View teammate tasks | Team sidebar > Three-dot menu > View all tasks |
| Upload avatar | Click your avatar in the welcome header |
| Switch theme | Click the sun/moon icon in the top nav |
| Sign out | Click "Sign Out" > Confirm |
| Approve a user (Admin) | Admin panel > Pending > Select role > Approve > Confirm |
| Reject a user (Admin) | Admin panel > Pending > Reject > Confirm |
| Edit task time (Admin) | Admin panel > Task Overview > Pencil icon > Edit > Save |
| Change role (Admin) | Admin panel > Team Members > Select role > Update > Confirm |
