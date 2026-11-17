# SWEN 383 Todo App — one project, one JavaScript file

All app JavaScript is in **src/todo.js**, including every class for Weeks 3, 4, 6, 7, 9 and 11. There are no separate lab folders. index.html and style.css remain the page and original stylesheet.

This uses your uploaded swen383-todo.zip as the base. The broken pasted snippets were reorganized into working classes. Your original license, stylesheet, SMELLS.md and Git history are retained.

**File-structure difference:** Weeks 3 onward explicitly ask for one file per class and removal of todo.js. You requested a single JavaScript file, so this version intentionally differs from that submission requirement. The design responsibilities are still separated into classes. Confirm with your instructor whether this layout is accepted.

## Run without Node.js
Open this project folder in VS Code. Install Live Server by Ritwick Dey if needed. Right-click index.html → Open with Live Server. No setup script and no Node.js installation are required to use the app. Use a server rather than double-clicking the HTML because the script is a module.

## Lab implementation
| Lab | Classes in src/todo.js |
| --- | --- |
| Week 3 SOLID | TodoService, TodoRenderer, LocalStorageHandler; storage dependency injected |
| Week 4 / Week 5 studio GRASP | TodoController, TodoService.getWorkloadSummary; service initiates creation |
| Week 6 Factory Method | StorageHandler, LocalStorageHandler, InMemoryStorageHandler, StorageFactory and subclasses |
| Week 6 Builder | Task and TaskBuilder; normal/urgent methods use builder steps |
| Week 7 Adapter | IdeaBox and IdeaBoxAdapter |
| Week 7 Decorator | LoggingTodoServiceDecorator |
| Week 9 Composite | StorageGroup, ArchiveStorageHandler, ArchivingStorageFactory |
| Week 9 Proxy | ConfirmDeleteProxy |
| Week 11 Observer | TaskObserver, TaskCounter, TodoService.subscribe/notify |
| Week 11 Command | Command, AddTaskCommand, CommandHistory, TodoController.removeTask |

startTodoApp at the bottom is the composition root: it creates the objects and connects the buttons. Only this wiring chooses the storage factory. Prototype and Singleton are omitted as instructed by Week 6.

## Behavior
Add Task and Enter add normal tasks. Add Urgent builds a highlighted urgent task. Get Suggestion adapts a random idea. Done moves tasks to Completed, and the row's Undo reopens a completed task. Delete asks for confirmation. The top Undo reverses successful normal Adds, newest first; urgent and suggestion additions remain outside that lab's Undo scope. Cancelled Undo remains retryable. Undo history resets on refresh. The current tasks persist, and the archive keeps every task first saved. Counter updates come from the service's observer notifications.

Original headings, oldest task, empty messages, truncation and brief highlighting are retained. Task text is inserted safely. IDs avoid collisions for rapid Adds and remain compatible with existing numeric IDs.

## Tests
Optional developer command, if Node.js is installed: `node tests/smoke.mjs`.
The tests check task creation/validation, workload counts, storage choices, archive retention, proxy cancellation, adapter output, counter notifications, Undo ordering and cancel/retry. A minimal DOM double exercises the actual startup function, renderer and buttons, Enter, persistence on startup, safe text and flash expiry. This is not a real-browser layout test. A headless browser launch was blocked by this environment; use the short manual check below.

Manual check: Add three tasks → mark one Done → Undo three times and accept confirmation. The counter must follow. Add again → Undo → Cancel → Undo → OK. Add Urgent and Get Suggestion should work. Refresh to check persistence. In the browser console, localStorage.getItem('todo-archive') retains deleted tasks.

## GitHub status and remaining lab evidence
No remote changes were made. The ZIP preserves the supplied history and places this uncommitted repair on repair/labs-through-week11. Origin points to JonYmeri/swen383-todo; upstream points to the lecturer repository. No past commits were backdated or recreated. The labs require GitHub Issues as well as weekly commits. Twelve retrospective issue drafts are in docs/LAB-ISSUES.md; they have not been posted. Final code and a catch-up commit do not replace historical weekly workflow evidence.

## Connect the code to GitHub
Open Terminal → New Terminal inside that folder. Run:

```powershell
git status
git remote -v
```
You should see branch `repair/labs-through-week11` and origin `https://github.com/JonYmeri/swen383-todo.git`. Upstream is your lecturer's repository; do not push there.

Your Git name/email were configured earlier. Check with:

```powershell
git config user.name
git config user.email
```
If either is empty or incorrect, set it for this project using these prompts, one command at a time:

```powershell
git config user.name (Read-Host "Enter your full name")
git config user.email (Read-Host "Enter your GitHub email")
```

The repair has not yet been committed. Save it and upload the branch, running one line at a time. Stop if a command gives an error:

```powershell
git add README.md index.html src docs tests package.json
git commit -m "fix: complete Todo lab implementation through Week 11"
git push -u origin repair/labs-through-week11
```

Sign in to GitHub as JonYmeri if prompted. No password or token should be pasted into this chat.

## Put the repair on main
Open https://github.com/JonYmeri/swen383-todo/compare/main...repair/labs-through-week11
Choose Create pull request, use the title "Complete Todo labs through Week 11", and review the changed files. Then Merge pull request → Confirm merge if GitHub reports it is mergeable. If it reports conflicts or permission errors, stop and send the error; do not force push.

After merging, return to the VS Code terminal:

```powershell
git fetch origin
git switch main
git branch --set-upstream-to=origin/main main
git merge --ff-only origin/main
```

If the final merge cannot fast-forward, keep using the repair branch and ask for help. Your repair is already saved on GitHub; do not reset or delete anything.

## Lab paperwork
The code implements the final design. The lab sheets also request GitHub issues. Use docs/LAB-ISSUES.md to file the required decisions as retrospective catch-up documentation. Do not claim they were filed before the original work or that the original weekly commits were completed when they were not.
