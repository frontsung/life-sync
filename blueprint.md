# Blueprint

## Overview
This blueprint outlines the current state and planned modifications for the Life Sync application, focusing on resolving a bug related to the mobile menu toggle functionality.

## Project Outline
The Life Sync application is a Next.js project using the App Router. It includes:
- Authentication managed by Firebase.
- UI components developed with React, utilizing a custom UI library based on `shadcn/ui` principles.
- Global state management for theme, language, and sidebar visibility.
- File-based routing for different sections like dashboard, finance, friends, schedule, secret, and todo.

Key components and their roles:
- `src/app/layout.tsx`: Root layout, integrating `Providers` and `AuthLayout`.
- `src/components/providers.tsx`: Wraps the application with various context providers, including `ThemeProvider`, `LanguageProvider`, `SidebarProvider`, and `AuthProvider`.
- `src/components/AuthLayout.tsx`: Handles authentication checks and conditionally renders `AppLayout` or redirects.
- `src/lib/hooks/use-auth.tsx`: Manages Firebase authentication state and user profiles.
- `src/lib/sidebar-context.tsx`: Provides the `isOpen` state and `toggle`/`close` functions for the sidebar.
- `src/components/ui/navbar.tsx`: Contains the mobile menu toggle button which calls the `toggle` function from `SidebarContext`.
- `src/components/ui/sidebar.tsx`: Consumes `isOpen` from `SidebarContext` to control sidebar visibility.

## Current Plan: Debugging Mobile Menu Toggle Issue

**Problem:** The mobile menu toggle is not behaving as expected. When the toggle button is clicked, the `isOpen` state briefly changes to `true` and then immediately reverts to `false`, preventing the sidebar from staying open.

**Hypotheses:**
1.  **Multiple `toggle` calls:** The `toggle` function is being invoked multiple times in quick succession.
2.  **Immediate `close` call:** The `toggle` function is called to open the sidebar, but another part of the code immediately calls `close` or `setIsOpen(false)`.
3.  **Component re-rendering/re-mounting:** A parent component is re-rendering in a way that causes `SidebarProvider` to re-initialize its state, or the `Navbar`/toggle button to unmount/remount, leading to state loss or flickering.
4.  **Strict Mode behavior:** React's Strict Mode (in development) double-invokes effects/render methods, which might be exposing a timing issue.

**Steps to Investigate:**
1.  **Instrument `toggle` function:** Added `console.log` to `src/lib/sidebar-context.tsx` inside the `toggle` function to observe when it's called and the `isOpen` state. (Completed)
2.  **Instrument `onClick` handler:** Added `console.log` to `src/components/ui/navbar.tsx` inside the mobile menu toggle button's `onClick` handler to check for multiple click events. (Completed)
3.  **Analyze console output:** Await user interaction and console output to determine the sequence of events and narrow down the cause.
    *   If "Mobile menu toggle button clicked" appears once, but "toggle called" appears twice or more, the issue might be in event propagation or React's internal handling.
    *   If both appear once, but `isOpen` immediately goes `false`, then another mechanism is closing the sidebar.

**Next Action:** Await user feedback on the console output after interacting with the mobile menu toggle.