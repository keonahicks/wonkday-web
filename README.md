# Wonkday: Course Registration Redesign (CS597)

A high-fidelity web prototype that helps Stevens students plan a semester around the classes, work shifts and commitments they already have.

## Tasks

1. **Sync external calendars:** connect Google or Outlook Calendar to import your events, and sync your classes back to it (`calendar.html`).
2. **Build and compare a saved schedule:** add candidate sections and compare the schedule against your existing commitments (`schedules.html`).
3. **Generate schedules:** pick the classes you need and see every schedule that fits your commitments (`generate.html`).

## Running the prototype

The pages share data through `localStorage`, so run them from a local web server rather than opening the files directly.

**Option A: Python** (already installed on macOS)
```
cd wonkday-web
python3 -m http.server 8000
```
Then open <http://localhost:8000> in Chrome.

**Option B: VS Code**
Install the **Live Server** extension, right-click `index.html`, and choose **Open with Live Server**.

To reset the prototype to its starting state, open the browser's DevTools → Application → Local Storage and clear it. You can also use **Reset to default example data** on the Saved schedules page.

## Project structure

```
index.html        Home page with links to the three tasks
calendar.html     Task 1: calendar sync
schedules.html    Task 2: saved schedule builder
generate.html     Task 3: schedule generator
css/app.css       Shared colors, nav bar, buttons, switches
js/store.js       Shared data (localStorage) and time helpers, all inside WonkStore
js/calendar.js    Task 1 logic
```

Data shared between pages:
- `scheduleItems_v1`: existing commitments (classes, work, other). Events imported on the Calendar page are added here, so they appear on Saved schedules automatically.
- `scheduleCandidates_v1`: the saved schedule being built.
- `calendarConnection_v1`: which calendar is connected and the class-sync settings.

## Team contribution statement

- **Keona Hicks:** App base (shared layout, nav, styling, shared data store, home page) and Task 1 (calendar sync).
- **[Name]:** Task 2 (saved schedule builder).
- **[Name]:** [Contribution]
- **[Name]:** [Contribution]
