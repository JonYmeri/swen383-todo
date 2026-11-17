# GitHub issue drafts — retrospective catch-up

All implementation classes now live in src/todo.js at the user's request; any class names below refer to sections in that file. The single-file layout differs from the lab's separate-file requirement. These are drafts, not existing GitHub issues. Create them in JonYmeri/swen383-todo → Issues → New issue. If Issues is missing, enable it under repository Settings → General → Features. Check for existing matching issues first. Label the descriptions as retrospective documentation of this catch-up repair. The final implementation is complete locally; close resolved issues only after its PR merges. Do not invent issue numbers in commits.

## 1. [SRP Violation] TodoManager mixes task rules, rendering and persistence
In the uploaded base src/todo.js, TodoManager.addTask saves and renders; render builds the DOM; loadTasks/saveTasks access storage. A display change therefore risks task and storage behavior. Split into TodoService (task data/rules), TodoRenderer (DOM), and LocalStorageHandler (load/save). Startup belongs in startTodoApp in src/todo.js. Row markup belongs in the renderer. Workload counting ultimately belongs in TodoService in Week 4. The repair uses this split. This records the design retrospectively, not a planning discussion held before coding.

## 2. [OCP Violation] Task construction branches on urgent type
The uploaded base TodoManager.addTask contains the urgent-type branch. Adding types requires editing that existing construction method. Week 3 leaves this issue open; Week 6 resolves it with TaskBuilder and separate addTask/addUrgentTask methods. Final repair: all creation goes through TaskBuilder, with priority and label configured fluently. Close after the repair merges.

## 3. [DIP Violation] TodoManager depends directly on localStorage
The uploaded base loadTasks/saveTasks methods directly access localStorage. This couples business logic to the browser backend and makes isolated tests difficult. LocalStorageHandler now owns persistence. TodoService receives a load/save object; StorageFactory chooses the implementation at the composition root. An in-memory handler can replace browser persistence without editing TodoService.

## 4. [GRASP Controller] TodoController handles UI actions
UI buttons should delegate to TodoController. It calls the service and then renders. Validation stays in TodoService. The renderer's task buttons also delegate to the controller, keeping coordination out of task rules and DOM construction.

## 5. [GRASP Creator] TodoService initiates task creation
TodoService owns the task collection and has the data needed to add to it. It initiates creation and storage. After Week 6, it delegates object assembly to TaskBuilder. Neither startTodoApp in src/todo.js nor TodoController builds a Task itself. This verifies Creator in the final design.

## 6. [Information Expert] TodoService owns workload counts
The base summarizeWorkload function inspected another object's tasks. TodoService already owns the array, so getWorkloadSummary now counts done, urgent and normal tasks. TodoRenderer asks for the result instead of duplicating the calculation.

## 7. [Design] Factory Method for storage backends
Product: StorageHandler. Concrete products: LocalStorageHandler and InMemoryStorageHandler. Creator: StorageFactory, whose createService calls createStorage. Concrete creators: LocalStorageFactory and InMemoryStorageFactory. Factory method: createStorage. Week 9 adds ArchivingStorageFactory. The domain service stays unaware of the backend choice.

## 8. [Design] Builder for Task, removes the urgent-task branch
Product: Task. Builder: TaskBuilder. The description is required; priority and label are optional fluent steps. TodoService calls build for normal tasks, and setPriority('high').addLabel('URGENT').build for urgent tasks. The old type-string branch is removed.

## 9. [Design] Adapter for IdeaBox suggestions
Target method: getSuggestion(), returning a string. Adapter: IdeaBoxAdapter. Adaptee: IdeaBox with pickRandomIdea(), returning title/minutes. The adapter translates the object into a title and duration string. TodoController and TodoService do not depend on IdeaBox.

## 10. [Design] Logging Decorator around TodoService
Component API: TodoService's creation, toggle, deletion, summary and tasks members. Decorator: LoggingTodoServiceDecorator. It logs normal/urgent creation then forwards; all other members pass through. startTodoApp in src/todo.js wraps the real service. Domain logic does not implement logging.

## 11. [Design] Composite StorageGroup for the task archive
Component: StorageHandler. Leaves: LocalStorageHandler and ArchiveStorageHandler. Composite: StorageGroup. load reads the first member; save forwards to every member. ArchivingStorageFactory groups the current list and append-only archive. Deleted tasks remain in the archive.

## 12. [Design] Protection Proxy for deleting tasks
Proxy: ConfirmDeleteProxy. Real service: TodoService, accessed through LoggingTodoServiceDecorator. The proxy asks for confirmation before forwarding deleteTask. Cancel blocks deletion; other members pass through. The same protection applies to Command Undo.

## Week 11 notes
The Week 11 sheet requests Observer and Command commits but does not explicitly require additional issues. Observer roles: TodoService / TaskObserver / TaskCounter / startTodoApp in src/todo.js. Command roles: Command / AddTaskCommand / TodoController / CommandHistory / startTodoApp in src/todo.js. Historical weekly commit requirements are not reproduced by a single catch-up commit.
