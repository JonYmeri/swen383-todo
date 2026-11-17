import assert from 'node:assert/strict';
import { TodoService } from '../src/todo.js';
import { ArchivingStorageFactory, InMemoryStorageFactory, LocalStorageFactory } from '../src/todo.js';
import { ConfirmDeleteProxy } from '../src/todo.js';
import { LoggingTodoServiceDecorator } from '../src/todo.js';
import { IdeaBox } from '../src/todo.js';
import { IdeaBoxAdapter } from '../src/todo.js';
const memory = new Map();
globalThis.localStorage = { getItem: k => memory.get(k) ?? null, setItem: (k,v) => memory.set(k,v) };
globalThis.alert = () => {};
let allowed = false;
globalThis.confirm = () => allowed;
const storage = new ArchivingStorageFactory();
const real = storage.createService();
assert.ok(real instanceof TodoService);
const app = new ConfirmDeleteProxy(new LoggingTodoServiceDecorator(real));
assert.equal(app.addTask('no'), null);
const normalId = app.addTask('Normal task');
const urgentId = app.addUrgentTask('Urgent task');
assert.equal(app.tasks.length, 2);
assert.equal(app.tasks[1].priority, 'high');
assert.ok(app.tasks[1].desc.startsWith('[URGENT]'));
assert.notEqual(normalId, urgentId);
assert.ok(app.getWorkloadSummary().includes('1 urgent'));
app.toggleComplete(normalId);
assert.ok(app.tasks[0].completed);
app.deleteTask(normalId);
assert.equal(app.tasks.length, 2, 'cancel preserves task');
allowed = true;
app.deleteTask(normalId);
assert.equal(app.tasks.length, 1);
assert.equal(storage.createService().tasks.length, 1, 'current list persists');
assert.equal(JSON.parse(memory.get('todo-archive')).length, 2, 'archive preserves deleted task');
assert.equal(new InMemoryStorageFactory().createService().tasks.length, 0);
assert.equal(new LocalStorageFactory().createService().tasks.length, 1);
assert.match(new IdeaBoxAdapter(new IdeaBox()).getSuggestion(), /\(\d+ min\)$/);
console.log('PASS: 18 core checks (builder, controller service API, storage, archive, proxy, adapter)');

const { TaskCounter } = await import('../src/todo.js');
const { TodoController } = await import('../src/todo.js');
const { AddTaskCommand, CommandHistory } = await import('../src/todo.js');
const label = { textContent: '' };
globalThis.document = { getElementById: () => label };
const observed = new InMemoryStorageFactory().createService();
const counter = new TaskCounter();
observed.subscribe(counter);
counter.update(observed.tasks);
assert.equal(label.textContent, 'Open: 0 · Done: 0');
let renders = 0;
const controller = new TodoController(new ConfirmDeleteProxy(observed), { render() { renders++; } });
const history = new CommandHistory();
history.undo();
history.run(new AddTaskCommand(controller, 'no'));
assert.equal(history.done.length, 0);
for (const description of ['First task', 'Second task', 'Third task']) history.run(new AddTaskCommand(controller, description));
assert.equal(label.textContent, 'Open: 3 · Done: 0');
observed.toggleComplete(observed.tasks[0].id);
assert.equal(label.textContent, 'Open: 2 · Done: 1');
allowed = false;
history.undo();
assert.equal(history.done.length, 3);
assert.equal(observed.tasks.length, 3);
allowed = true;
history.undo();
assert.deepEqual(observed.tasks.map(task => task.desc), ['First task', 'Second task']);
assert.equal(label.textContent, 'Open: 1 · Done: 1');
history.undo();
history.undo();
assert.equal(label.textContent, 'Open: 0 · Done: 0');
assert.equal(history.done.length, 0);
assert.ok(renders >= 7);
console.log('PASS: Week 11 counter, notifications, invalid Add, LIFO Undo, cancel/retry, empty history');

await (async () => {
// Integration check for the real main.js event wiring with a minimal DOM double.
// This is not a replacement for a real browser layout check.

class Element {
  constructor(tag = 'div') { this.tagName = tag; this.children = []; this.dataset = {}; this.listeners = {}; this.textContent = ''; this.value = ''; this.classes = new Set(); this.classList = { add: c => this.classes.add(c), remove: c => this.classes.delete(c) }; }
  append(...items) { this.children.push(...items); }
  replaceChildren(...items) { this.children = items; }
  setAttribute(name, value) { this[name] = value; }
  addEventListener(name, handler) { this.listeners[name] = handler; }
  fire(name, event = {}) { this.listeners[name]?.(event); }
}
const ids = Object.fromEntries(['task-container', 'task-counter', 'task-input', 'add-task-btn', 'add-urgent-btn', 'suggest-btn', 'undo-btn'].map(id => [id, new Element()]));
globalThis.document = { getElementById: id => ids[id], createElement: tag => new Element(tag) };
const saved = new Map();
globalThis.localStorage = { getItem: k => saved.get(k) ?? null, setItem: (k, v) => saved.set(k, v) };
globalThis.alert = () => {};
let allow = true;
globalThis.confirm = () => allow;
await import('../src/todo.js?ui');
const count = expected => assert.equal(ids['task-counter'].textContent, expected);
const tasks = () => JSON.parse(saved.get('todo-tasks') || '[]');
const click = id => ids[id].fire('click');
const add = text => { ids['task-input'].value = text; click('add-task-btn'); };
const all = node => [node, ...node.children.flatMap(all)];
const action = label => {
 const button = all(ids['task-container']).find(el => el['aria-label'] === label);
 assert.ok(button, `Rendered action exists: ${label}`); button.fire('click');
};
count('Open: 0 · Done: 0');
add('no'); count('Open: 0 · Done: 0');
for (const text of ['First task', 'Second task', 'Third task']) add(text);
assert.equal(ids['task-input'].value, ''); count('Open: 3 · Done: 0');
action('Complete First task'); count('Open: 2 · Done: 1');
allow = false; click('undo-btn'); count('Open: 2 · Done: 1');
allow = true; click('undo-btn'); assert.deepEqual(tasks().map(t => t.desc), ['First task', 'Second task']);
click('undo-btn'); click('undo-btn'); click('undo-btn'); count('Open: 0 · Done: 0');
ids['task-input'].value = 'Urgent task'; click('add-urgent-btn');
assert.equal(tasks()[0].priority, 'high');
click('suggest-btn'); assert.match(tasks()[1].desc, /\(\d+ min\)$/);
ids['task-input'].value = 'Enter task'; ids['task-input'].fire('keydown', { key: 'Enter' }); count('Open: 3 · Done: 0');
allow = false; action('Delete Enter task'); count('Open: 3 · Done: 0');
allow = true; action('Delete Enter task'); count('Open: 2 · Done: 0');
assert.ok(JSON.parse(saved.get('todo-archive')).some(t => t.desc === 'Enter task'));
add('<img src=x onerror=alert(1)>');
assert.ok(all(ids['task-container']).some(el => el.textContent === '<img src=x onerror=alert(1)>'));
assert.equal(all(ids['task-container']).filter(el => el.tagName === 'img').length, 0);
await new Promise(resolve => setTimeout(resolve, 1550));
assert.ok(all(ids['task-container']).every(el => !el.classes.has('flash')));
// A new module evaluation simulates fresh startup using persisted storage.
await import('../src/todo.js?reload'); count('Open: 3 · Done: 0');
console.log('PASS: single-file app and renderer integration (DOM double), button wiring, Enter, suggestions, completion, cancel/retry Undo, archive, reload, safe text and flash expiry');

})();
