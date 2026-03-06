# Insulin & Blood Sugar Simulation Lab

A deployable, web-based simulation lab built with HTML, CSS, JavaScript, and Tailwind CSS (CDN).

## Features

- Interactive controls for blood sugar concentration and insulin level
- Visual model of:
  - Blood vessel
  - Body cell and membrane receptors
  - Insulin particles
  - Glucose particles
- "Eating" button to raise blood sugar immediately
- Cause-and-effect simulation flow:
  - Eating -> blood sugar rises
  - Insulin binds receptors
  - Cells absorb glucose
  - Blood sugar decreases
- Live readouts for:
  - Blood sugar concentration
  - Insulin level
  - Cellular glucose uptake

## Project Structure

- `index.html` - UI and scene structure
- `styles.css` - custom styles and animations
- `script.js` - simulation logic and interactions

## Run Locally

This is a static site. You can open `index.html` directly, or use a local static server.

Example:

```bash
npx serve .
```

## Deploy to GitHub + Vercel

1. Push this folder to a GitHub repository.
2. In Vercel, import that GitHub repo.
3. Framework preset: `Other` (or no preset).
4. Build command: leave empty.
5. Output directory: leave empty (root).
6. Deploy.

No build step is required.
