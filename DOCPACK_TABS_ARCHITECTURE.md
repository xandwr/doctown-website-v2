# Docpack Tabs Architecture

## Overview

The docpack generation UI has been refactored to use a tab-based interface with modal viewing, replacing the previous separate page approach.

## Architecture Changes

### Before
```
User clicks "Generate" → Navigates to /docpack/{jobId} → View progress on separate page
```

### After
```
User clicks "Generate" → Docpack added to store → Switches to Docpacks tab → Click docpack → Modal opens
```

## New Components

### 1. Docpack Store (`src/lib/stores/docpacks.ts`)

A Svelte store that manages all docpack state with localStorage persistence.

**Interface:**
```typescript
interface Docpack {
  id: string;              // Job ID from RunPod
  repoOwner: string;       // Repository owner
  repoName: string;        // Repository name
  branch: string;          // Branch name
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;        // 0-100
  createdAt: string;       // ISO timestamp
  completedAt?: string;    // ISO timestamp
  logs: string[];          // Log messages
  jsonlData: string[];     // JSONL output lines
  errorMessage?: string;   // Error if failed
}
```

**Store Methods:**
- `add(docpack)` - Add new docpack
- `update(jobId, updates)` - Update docpack fields
- `addLog(jobId, log)` - Append log message
- `addJsonlData(jobId, data)` - Append JSONL line
- `remove(jobId)` - Delete docpack
- `hasDocpack(owner, repo)` - Check if repo has docpack
- `getById(jobId)` - Get docpack by ID
- `getByRepo(owner, repo)` - Get docpack for repo
- `clear()` - Remove all docpacks

**Persistence:**
- Automatically saves to `localStorage` on every change
- Loads from `localStorage` on page load
- Survives page refreshes and browser sessions

### 2. DocpackCard Component (`src/components/DocpackCard.svelte`)

Displays a docpack in the dashboard grid.

**Features:**
- Shows repo name, owner, branch
- Color-coded status badge
- Animated progress bar (for in-progress jobs)
- File count for completed jobs
- Error message preview for failed jobs
- Timestamps for created/completed
- Click to open modal

### 3. DocpackModal Component (`src/components/DocpackModal.svelte`)

Full-screen modal for viewing docpack details.

**Features:**
- Real-time SSE streaming for active jobs
- Progress bar with percentage
- Scrollable log viewer with auto-scroll
- JSONL output preview (first 10 lines)
- Download JSONL button
- Copy to clipboard button
- Delete docpack button
- Close button and backdrop click to close

**SSE Integration:**
- Connects to `/api/docpack/stream/{jobId}` on mount
- Automatically updates store with new data
- Closes connection when job completes/fails
- Handles disconnection gracefully

### 4. Updated Dashboard (`src/routes/dashboard/+page.svelte`)

**Two Tabs:**

1. **Your Docpacks** - Shows all generated docpacks
   - Grid of DocpackCard components
   - Empty state with "Browse Repositories" button
   - Click any card to open modal

2. **Your Repositories** - Shows available repos
   - Filters out repos that already have docpacks
   - Grid of RepoCard components
   - Empty state if all repos have docpacks
   - "View Docpacks" button in empty state

**State Management:**
- Subscribes to docpack store (`$docpackStore.docpacks`)
- Filters repositories: `filteredRepositories = repos.filter(not hasDocpack)`
- Auto-switches to Docpacks tab when new docpack is created

### 5. Updated RepoCard (`src/components/RepoCard.svelte`)

**Changes:**
- Removed navigation to separate page
- Added `onDocpackCreated` callback prop
- Creates docpack in store when generation starts
- Calls callback to switch to Docpacks tab
- No longer uses `goto()` for navigation

## User Flow

### Creating a Docpack

1. User is on **Your Repositories** tab
2. User clicks a repository card → Menu opens
3. User clicks "Generate Docpack" button
4. Frontend calls `/api/docpack/generate`
5. Backend returns job ID
6. New docpack added to store with status "queued"
7. Repository disappears from Repositories tab
8. Dashboard auto-switches to **Your Docpacks** tab
9. New docpack appears with progress bar

### Viewing Progress

1. User sees docpack card in Docpacks tab
2. Progress bar shows current status
3. User clicks docpack card
4. Modal opens showing full details
5. Logs stream in real-time
6. JSONL data accumulates
7. Progress bar updates
8. When complete, status changes to "completed"

### Completed Docpacks

1. Docpack shows green "completed" badge
2. Progress bar at 100%
3. Shows file count
4. Click to open modal
5. View all logs and download JSONL
6. Can delete docpack to regenerate

### Failed Docpacks

1. Docpack shows red "failed" badge
2. Error message displayed
3. Click to view full error details
4. Can delete and retry

## Data Flow

```
RepoCard
  ↓ (Generate button clicked)
POST /api/docpack/generate
  ↓ (Returns job ID)
Store.add(docpack)
  ↓ (Saves to localStorage)
Dashboard switches to Docpacks tab
  ↓ (Docpack appears in grid)
User clicks docpack
  ↓ (Modal opens)
Modal connects to SSE
  ↓ (Real-time updates)
Store.update() / Store.addLog() / Store.addJsonlData()
  ↓ (UI updates reactively)
Job completes
  ↓ (Store updated)
Modal shows download buttons
```

## Benefits

### UX Improvements
- **No page navigation** - Stay in dashboard context
- **See all docpacks** - Easy overview of all generations
- **One docpack per repo** - Prevents duplicates
- **Persistent state** - Survives page refreshes
- **Modal viewing** - Quick access to details
- **Tab switching** - Logical separation of content

### Technical Benefits
- **Centralized state** - Single source of truth
- **localStorage persistence** - No database needed yet
- **Reactive updates** - Svelte stores handle reactivity
- **Modular components** - Reusable and maintainable
- **SSE streaming** - Real-time updates without polling
- **Automatic filtering** - Repos with docpacks hidden

## State Persistence

### localStorage Structure
```json
{
  "docpacks": [
    {
      "id": "abc-123",
      "repoOwner": "octocat",
      "repoName": "Hello-World",
      "branch": "main",
      "status": "completed",
      "progress": 100,
      "createdAt": "2025-11-14T10:30:00.000Z",
      "completedAt": "2025-11-14T10:32:15.000Z",
      "logs": ["[LOG] Starting...", "..."],
      "jsonlData": ["{...}", "{...}"],
      "errorMessage": null
    }
  ]
}
```

### Clearing Data
Users can:
- Delete individual docpacks (delete button in modal)
- Clear browser data to reset all docpacks

## Future Enhancements

Potential improvements:
1. **Backend persistence** - Store docpacks in database
2. **User accounts** - Associate docpacks with users
3. **Sharing** - Share docpack links with others
4. **History** - Keep multiple versions per repo
5. **Export options** - More output formats (CSV, JSON)
6. **Filtering/search** - Find docpacks by name/status
7. **Bulk operations** - Delete multiple, regenerate all
8. **Notifications** - Alert when docpack completes
9. **Scheduling** - Auto-regenerate on commits
10. **Analytics** - Track usage and performance

## Migration Notes

### Removed Files
- `src/routes/docpack/[jobId]/+page.svelte` - Old progress page

### No Breaking Changes
- API endpoints unchanged
- Backend logic unchanged
- Only frontend UI refactored

### Testing Checklist
- [x] Create docpack from repo
- [x] View progress in modal
- [x] Logs stream in real-time
- [x] JSONL data accumulates
- [x] Download JSONL works
- [x] Copy to clipboard works
- [x] Delete docpack works
- [x] Repo disappears after creation
- [x] Tab switching works
- [x] localStorage persistence works
- [x] Page refresh preserves state
- [x] Multiple docpacks work
- [x] Modal closes properly
- [x] SSE connection handles errors

## Troubleshooting

### Docpack not appearing
- Check browser console for errors
- Verify API call succeeded
- Check localStorage (DevTools → Application → Local Storage)
- Try hard refresh (Ctrl+Shift+R)

### Progress not updating
- Check modal is connected to SSE (Network tab)
- Verify RunPod job is running
- Check backend logs for errors
- Try closing and reopening modal

### Repos not filtered
- Check store has docpack for repo
- Verify owner/name match exactly
- Check `hasDocpack()` logic
- Clear localStorage and retry

### localStorage full
- Browser limit: ~5-10MB
- JSONL data can be large
- Delete old docpacks
- Consider backend storage for production
