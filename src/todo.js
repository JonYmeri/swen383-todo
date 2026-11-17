// SWEN 383 Todo App: all lab classes in one file, as requested.
// Responsibilities remain separate classes even though they share this file.

// StorageHandler
// Factory Method Product / Composite Component.
export class StorageHandler {
  load() { throw new Error('override me'); }
  save(tasks) { throw new Error('override me'); }
}

// LocalStorageHandler

// Leaf: the current task list.
export class LocalStorageHandler extends StorageHandler {
  load() {
    const raw = localStorage.getItem('todo-tasks');
    return raw ? JSON.parse(raw) : [];
  }
  save(tasks) {
    localStorage.setItem('todo-tasks', JSON.stringify(tasks));
  }
}

// InMemoryStorageHandler

// Alternative backend: tasks disappear after reloading.
export class InMemoryStorageHandler extends StorageHandler {
  constructor() {
    super();
    this.tasks = [];
  }
  load() { return this.tasks; }
  save(tasks) { this.tasks = tasks; }
}

// ArchiveStorageHandler

// Leaf: preserve the original version of every task ever added.
export class ArchiveStorageHandler extends StorageHandler {
  load() {
    const raw = localStorage.getItem('todo-archive');
    return raw ? JSON.parse(raw) : [];
  }
  save(tasks) {
    const archive = this.load();
    for (const task of tasks) {
      const known = archive.some(saved => saved.id === task.id);
      if (!known) archive.push({ ...task });
    }
    localStorage.setItem('todo-archive', JSON.stringify(archive));
  }
}

// StorageGroup

// Composite: callers treat multiple storage backends as one.
export class StorageGroup extends StorageHandler {
  constructor() {
    super();
    this.members = [];
  }
  add(handler) { this.members.push(handler); }
  load() { return this.members.length ? this.members[0].load() : []; }
  save(tasks) {
    for (const member of this.members) member.save(tasks);
  }
}

// Task
// Builder Product.
export class Task {
  constructor(builder) {
    // Avoid collisions if two tasks are added in the same millisecond.
    this.id = (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`);
    this.desc = builder.desc;
    this.completed = false;
    this.priority = builder.priority;
    this.createdAt = new Date().toLocaleTimeString();
  }
}

// TaskBuilder

// Builder: construct normal or urgent tasks without a type branch.
export class TaskBuilder {
  constructor(desc) {
    this.desc = desc;
    this.priority = 'normal';
  }
  setPriority(priority) {
    this.priority = priority;
    return this;
  }
  addLabel(label) {
    this.desc = `[${label}] ${this.desc}`;
    return this;
  }
  build() { return new Task(this); }
}

// TodoService

// SRP: business logic only. DIP: storage is injected, not constructed here.
// GRASP Information Expert: this object owns the tasks and their summary.
export class TodoService {
  constructor(storage) {
    this.storage = storage;
    this.tasks = this.storage.load();
    this.observers = [];
  }
  subscribe(observer) { this.observers.push(observer); }
  notify() { for (const observer of this.observers) observer.update(this.tasks); }
  addTask(description) {
    const trimmed = this.validate(description);
    if (!trimmed) return null;
    return this.store(new TaskBuilder(trimmed).build());
  }
  addUrgentTask(description) {
    const trimmed = this.validate(description);
    if (!trimmed) return null;
    return this.store(new TaskBuilder(trimmed).setPriority('high').addLabel('URGENT').build());
  }
  validate(description) {
    const trimmed = String(description ?? '').trim();
    if (trimmed.length < 3) {
      alert('Task needs at least a few characters.');
      return null;
    }
    if (this.tasks.length >= 20) {
      console.warn('This list is getting long - consider clearing completed tasks.');
    }
    return trimmed;
  }
  store(task) {
    this.tasks.push(task);
    this.storage.save(this.tasks);
    this.notify();
    return task.id;
  }
  toggleComplete(id) {
    const task = this.tasks.find(task => String(task.id) === String(id));
    if (!task) return;
    task.completed = !task.completed;
    this.storage.save(this.tasks);
    this.notify();
  }
  deleteTask(id) {
    this.tasks = this.tasks.filter(task => String(task.id) !== String(id));
    this.storage.save(this.tasks);
    this.notify();
  }
  getWorkloadSummary() {
    let done = 0;
    let urgent = 0;
    let normal = 0;
    for (const task of this.tasks) {
      if (task.completed) done++;
      else if (task.priority === 'high') urgent++;
      else normal++;
    }
    return `${done}/${this.tasks.length} done - ${urgent} urgent, ${normal} normal remaining`;
  }
}

// StorageFactory

// Factory Method Creator.
export class StorageFactory {
  createService() { return new TodoService(this.createStorage()); }
  createStorage() { throw new Error('override me'); }
}
export class LocalStorageFactory extends StorageFactory {
  createStorage() { return new LocalStorageHandler(); }
}
export class InMemoryStorageFactory extends StorageFactory {
  createStorage() { return new InMemoryStorageHandler(); }
}
export class ArchivingStorageFactory extends StorageFactory {
  createStorage() {
    const group = new StorageGroup();
    group.add(new LocalStorageHandler());
    group.add(new ArchiveStorageHandler());
    return group;
  }
}

// IdeaBox
// Third-party style class supplied by the Week 7 lab: do not modify its API.
export class IdeaBox {
  pickRandomIdea() {
    const ideas = [
      { title: 'Learn a new skill', minutes: 60 },
      { title: 'Clean your desk', minutes: 15 },
      { title: 'Call a friend', minutes: 20 },
    ];
    const i = Math.floor(Math.random() * ideas.length);
    return ideas[i];
  }
}

// IdeaBoxAdapter
// Adapter: convert IdeaBox's object into a plain description string.
export class IdeaBoxAdapter {
  constructor(ideaBox) { this.ideaBox = ideaBox; }
  getSuggestion() {
    const idea = this.ideaBox.pickRandomIdea();
    return `${idea.title} (${idea.minutes} min)`;
  }
}

// LoggingTodoServiceDecorator
// Decorator: same public service API, with logging added on task creation.
export class LoggingTodoServiceDecorator {
  constructor(todoService) { this.todoService = todoService; }
  addTask(description) {
    console.log('LOG: addTask', description);
    return this.todoService.addTask(description);
  }
  addUrgentTask(description) {
    console.log('LOG: addUrgentTask', description);
    return this.todoService.addUrgentTask(description);
  }
  toggleComplete(id) { return this.todoService.toggleComplete(id); }
  deleteTask(id) { return this.todoService.deleteTask(id); }
  getWorkloadSummary() { return this.todoService.getWorkloadSummary(); }
  get tasks() { return this.todoService.tasks; }
}

// ConfirmDeleteProxy
// Protection Proxy: only forward deleteTask when the user accepts.
export class ConfirmDeleteProxy {
  constructor(todoService) { this.todoService = todoService; }
  deleteTask(id) {
    if (confirm('Delete this task?')) return this.todoService.deleteTask(id);
  }
  addTask(description) { return this.todoService.addTask(description); }
  addUrgentTask(description) { return this.todoService.addUrgentTask(description); }
  toggleComplete(id) { return this.todoService.toggleComplete(id); }
  getWorkloadSummary() { return this.todoService.getWorkloadSummary(); }
  get tasks() { return this.todoService.tasks; }
}

// TodoRenderer
// SRP: all HTML rendering and task row button events live here.
export class TodoRenderer {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) throw new Error(`Missing task container: ${containerId}`);
    this.controller = null;
  }
  setController(controller) { this.controller = controller; }
  render(service, justAddedId = null) {
    this.container.replaceChildren();
    const status = document.createElement('p');
    status.className = 'status';
    const oldest = service.tasks.find(task => !task.completed)?.desc || 'none';
    status.textContent = `${service.getWorkloadSummary()} - oldest: ${oldest}`;
    this.container.append(status);
    const pending = service.tasks.filter(task => !task.completed);
    const completed = service.tasks.filter(task => task.completed);
    this.renderSection('To do', pending, justAddedId);
    this.renderSection('Completed', completed, justAddedId);
    document.title = `Todo App (${pending.length} pending)`;
  }
  renderSection(title, tasks, justAddedId) {
    const heading = document.createElement('h2');
    heading.className = 'section-title';
    heading.textContent = title;
    this.container.append(heading);
    const list = document.createElement('ul');
    if (!tasks.length) {
      const empty = document.createElement('li');
      empty.textContent = title === 'To do' ? 'Nothing pending. Add a task above.' : 'Nothing completed yet.';
      list.append(empty);
    }
    for (const task of tasks) list.append(this.buildTaskRow(task, justAddedId));
    this.container.append(list);
  }
  buildTaskRow(task, justAddedId) {
    const row = document.createElement('li');
    if (task.completed) row.classList.add('completed');
    row.dataset.row = task.id;
    if (task.id === justAddedId) {
      row.classList.add('flash');
      setTimeout(() => row.classList.remove('flash'), 1500);
    }
    const description = document.createElement('span');
    description.className = 'task-desc';
    if (task.priority === 'high') description.classList.add('priority-high');
    description.textContent = task.desc.length > 40 ? `${task.desc.slice(0, 40)}...` : task.desc;
    description.title = task.desc;
    const time = document.createElement('span');
    time.className = 'task-time';
    time.textContent = task.createdAt || '';
    const actions = document.createElement('span');
    actions.className = 'task-actions';
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.textContent = task.completed ? 'Undo' : 'Done';
    toggle.setAttribute('aria-label', `${task.completed ? 'Undo' : 'Complete'} ${task.desc}`);
    toggle.addEventListener('click', () => this.controller.toggleTask(task.id));
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.textContent = 'Delete';
    remove.setAttribute('aria-label', `Delete ${task.desc}`);
    remove.addEventListener('click', () => this.controller.deleteTask(task.id));
    actions.append(toggle, remove);
    row.append(description, time, actions);
    return row;
  }
}

// TodoController
// GRASP Controller: coordinate service calls and UI refreshes.
export class TodoController {
  constructor(todoService, todoRenderer) {
    this.todoService = todoService;
    this.todoRenderer = todoRenderer;
  }
  start() { this.todoRenderer.render(this.todoService); }
  addTask(description) {
    const id = this.todoService.addTask(description);
    if (id) this.todoRenderer.render(this.todoService, id);
    return id;
  }
  addUrgentTask(description) {
    const id = this.todoService.addUrgentTask(description);
    if (id) this.todoRenderer.render(this.todoService, id);
    return id;
  }
  toggleTask(id) {
    this.todoService.toggleComplete(id);
    this.todoRenderer.render(this.todoService);
  }
  removeTask(id) {
    this.todoService.deleteTask(id);
    this.todoRenderer.render(this.todoService);
    return !this.todoService.tasks.some(task => String(task.id) === String(id));
  }
  deleteTask(id) {
    this.todoService.deleteTask(id);
    this.todoRenderer.render(this.todoService);
  }
}

// TaskObservers
export class TaskObserver {
  update(tasks) { throw new Error('override me'); }
}

export class TaskCounter extends TaskObserver {
  update(tasks) {
    const open = tasks.filter(task => !task.completed).length;
    const done = tasks.length - open;
    document.getElementById('task-counter').textContent = `Open: ${open} · Done: ${done}`;
  }
}

// Commands
export class Command {
  execute() { throw new Error('override me'); }
  undo() { throw new Error('override me'); }
}

export class AddTaskCommand extends Command {
  constructor(controller, description) {
    super();
    this.controller = controller;
    this.description = description;
  }
  execute() {
    this.id = this.controller.addTask(this.description);
    return this.id;
  }
  undo() { return this.controller.removeTask(this.id); }
}

export class CommandHistory {
  constructor() { this.done = []; }
  run(command) {
    const result = command.execute();
    if (result) this.done.push(command);
    return result;
  }
  undo() {
    const last = this.done.at(-1);
    // Keep the command available when deletion is cancelled in the proxy.
    if (last && last.undo() !== false) this.done.pop();
  }
}

export function startTodoApp() {
  
  // Composition root: decide what the app uses in one place.
  const factory = new ArchivingStorageFactory();
  const todoService = factory.createService();
  const service = new ConfirmDeleteProxy(
    new LoggingTodoServiceDecorator(todoService)
  );
  const renderer = new TodoRenderer('task-container');
  const controller = new TodoController(service, renderer);
  renderer.setController(controller);
  controller.start();
  const counter = new TaskCounter();
  todoService.subscribe(counter);
  counter.update(todoService.tasks);
  const history = new CommandHistory();
  document.getElementById('undo-btn').addEventListener('click', () => history.undo());
  
  const input = document.getElementById('task-input');
  const addBtn = document.getElementById('add-task-btn');
  const addUrgentBtn = document.getElementById('add-urgent-btn');
  const suggestBtn = document.getElementById('suggest-btn');
  const suggestions = new IdeaBoxAdapter(new IdeaBox());
  
  function add(urgent = false) {
    const newId = urgent ? controller.addUrgentTask(input.value) : history.run(new AddTaskCommand(controller, input.value));
    if (newId) input.value = '';
  }
  addBtn.addEventListener('click', () => add(false));
  addUrgentBtn.addEventListener('click', () => add(true));
  input.addEventListener('keydown', event => {
    if (event.key === 'Enter') add(false);
  });
  suggestBtn.addEventListener('click', () => controller.addTask(suggestions.getSuggestion()));
}

if (typeof document !== "undefined" && document.getElementById("task-container")) {
  startTodoApp();
}
