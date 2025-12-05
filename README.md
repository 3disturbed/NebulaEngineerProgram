# Nebula Nexus Interactive Lessons (Modular Version)

This folder contains the refactored, modular version of the interactive lessons.

## Structure

- **index.html**: The main entry point (Application Shell).
- **css/**: Contains the stylesheets.
  - `style.css`: Main application styles.
- **js/**: Contains the JavaScript logic.
  - `index.js`: Main application logic (loading lessons, navigation).
  - `labs.js`: Definitions for the interactive labs.
- **steps/**: Contains the lesson content in JSON format.
  - `index.json`: Manifest of all available lessons.
  - `lesson-*.json`: Individual lesson content.

## How to Add Content

1.  **Create a new JSON file** in the `steps/` directory (e.g., `lesson-2.json`).
2.  **Format the content** following the structure of existing lesson files.
3.  **Add the lesson** to `steps/index.json` to make it appear in the sidebar.

## Features

- **Modular Architecture**: Content is separated from logic and presentation.
- **JSON-driven**: Easy to update and expand content.
- **Interactive Labs**: Integrated code editor and console.
- **Sleek UI**: Modern, dark-themed interface.
