# Taskbeheer — Task Manager
### ITC6355 WebApp Design |  JavaScript Application



---

## Project Overview

Taakbeheer is a task management web application built with JavaScript, HTML, and CSS. It supports full CRUD operations, category filtering, priority sorting, real-time search, dark/light theme toggling, and a notification system.


**Live Demo:** https://kaleidoscope-ss.github.io/ITC6355-Yan/

---

## JavaScript Architecture

The application uses an Object-Oriented Programming (OOP) architecture, divided into 4 classes each with a single, clearly defined responsibility.

---

### What's inside

#### `Task` Class 

Defines the data structure of a single task — `id`, `title`, `description`, `priority`, `category`, `completed`, `createdAt`, `updatedAt`. Provides methods to operate on its own data: `toggleComplete()`, `update()`, `formattedDate()`. Uses a static method `generateId()` to produce unique IDs.

#### `TaskManager` Class 

Maintains a private array `_tasks` holding all task instances. Provides full CRUD methods: `addTask()`, `getTaskById()`, `updateTask()`, `deleteTask()`, `toggleComplete()`. Provides `getFilteredTasks()` supporting combined filtering by category, status, keyword, and priority. Provides `getStats()` for real-time task count statistics.

#### `NotificationSystem` Class 

Accepts notification title, content, icon, and duration as parameters. Dynamically creates DOM elements and inserts them into the notification container. Uses `setTimeout` to control auto-dismissal, CSS transitions for fade-out animation. Includes a built-in `_escape()` method to prevent XSS injection.

#### `TaskUI` Class

Caches all DOM references into `this.dom` on initialization. Uses `_bindEvents()` to centrally manage all event listeners. Applies event delegation on the task list — one `click` listener on the parent container, distinguishing actions via `data-action` attributes. Uses `_render()` as the single rendering entry point, regenerating the full list after every data change.

---

## UI & Visual Design

The interface draws inspiration from the Dutch Golden Age painting _The Milkmaid_ by Johannes Vermeer.

---

### What's inside

#### Color System

|Token|Hex|Role|
|---|---|---|
|Cobalt Blue|`#2B4C8C`|Header, primary buttons, focus borders|
|Amber Yellow|`#E8B84A`|Stats panel accent, medium priority|
|Sienna Red|`#8E4A35`|High priority, error messages|
|Sage Green|`#626D51`|Low priority, filter panel|
|Stone Grey|`#B9B4A9`|Borders, placeholder text|

#### Layout

Desktop uses a fixed 320px sidebar + flexible main area via CSS Grid (`grid-template-columns: 320px 1fr`). Tablet (≤900px) collapses the sidebar into a two-column grid above the task board. Mobile (≤580px) stacks everything in a single column with action buttons arranged horizontally.


#### Panel & Card Distinction

The three sidebar panels are distinguished by a thin top border in different accent colors combined with subtly tinted backgrounds — avoiding heavy left-side stripes to keep the layout quiet and unified. Task cards use overall border color and a very faint background tint to indicate priority level.

#### Theme System

All colors are defined as CSS custom properties (variables). Switching themes only requires toggling the `data-theme="dark"` attribute on `<html>` , the browser cascades updates to every component automatically.

#### Typography

Display headings use Georgia (serif). Form labels use Trebuchet MS (sans-serif) for small-text legibility. Body text uses Palatino.



## Feature Implementation


### What's inside

#### Search & Filtering 

All four controls (search, category, sort, status) listen to the `input` event and trigger `getFilteredTasks()` on every change for real-time results. Inside `TaskManager`, the four conditions are applied as a chain: category filter → status filter → keyword match → sort.


#### Priority Notifications

Only high-priority tasks trigger notifications, on three occasions: add, update, and complete. Notification duration varies by context — standard notifications last 3 seconds, high-priority completion notifications last 5 seconds. Notifications support click-to-dismiss with a CSS fade-out transition before the DOM node is removed.


#### Form Validation

The title field clears error messages in real-time on the `input` event, and performs full validation on submission. On failure, the field receives automatic `focus()` to minimize user steps. Rules: non-empty and minimum 2 characters.


#### Edit Flow

Clicking edit fills task data back into the form and changes the button label to "Save Changes" while revealing the Cancel button. The corresponding card receives an `editing` CSS class showing a highlighted border, creating a visual link between the form and the card being edited.


#### Delete Animation

On delete, JavaScript directly modifies the card's `opacity` and `transform` for a slide-fade exit. After 250ms when the animation completes, data is removed from `TaskManager` and `_render()` is called. This ensures users see a smooth transition rather than an abrupt disappearance.

#### Task Completion

Completed task titles receive CSS `text-decoration: line-through`. The full card's `opacity` drops to 0.72, visually receding to the background. The stats bar updates the completed count in real time.

#### XSS Protection

All user-supplied content (title, description) passes through `_escapeHtml()` before being inserted into HTML. A temporary `div` is created, assigned via `textContent` (browser auto-escapes), then `innerHTML` is read back. Even if a user enters `<script>alert(1)</script>`, it renders as plain text.


---

## File Structure


```
task-manager/
├── index.html   — Page structure and semantic markup
├── style.css    — All styling, CSS variables, responsive layout 
└── app.js       — OOP logic, CRUD, events, rendering
```

---

_ITC6355 WebApp Design — Taskbeheer Task Manager_
