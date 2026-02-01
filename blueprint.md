# Life Sync - Application Blueprint

## Overview
Life Sync is a modern, responsive schedule management application designed to work seamlessly on both mobile and desktop devices. It features an interactive calendar, event management capabilities, and a visually appealing user interface.

## Project Outline
### Current State
*   **Framework:** Next.js (App Router)
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS (v4)
*   **Data:** Local file-based (JSON) for Events and Todos
*   **Internationalization:** Custom Context (English/Korean)
*   **Theme:** Dark/Light mode via `next-themes`

### Features (Implemented)
*   **Responsive Calendar:** Month view with event indicators.
*   **Event Management:** Add and delete events with color labels.
*   **To-Do List:** Daily to-do management with completion toggle.
*   **Calendar Sync:** Option to automatically add To-Dos to the calendar with customizable color labels.
*   **Visual Design:** Modern vibrant palette, noise texture, sidebar navigation.
*   **Dark Mode:** Fully supported.
*   **Localization:** English and Korean support.

## Current Plan: Feature Refinement
### Goal
Enhance user experience with integrated features.

### Steps
1.  **Sidebar Navigation:**
    *   Add persistent sidebar for PC and overlay drawer for Mobile.
    *   Navigation links for 'Calendar' and 'Today's To-Do'.
2.  **To-Do Integration:**
    *   Create `src/app/todo` page.
    *   Implement "Sync with Calendar" feature.
    *   Allow color selection for synced events.
3.  **Data Persistence:**
    *   Manage `todos.json` separately but link to `events.json` via ID.
