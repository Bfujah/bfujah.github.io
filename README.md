# Research website: Olabode T. Ajenifujah

A single-page static site (HTML, CSS and a little JavaScript, no build step). It works on GitHub Pages as is.

## Preview on your computer
Unzip the folder and double-click `index.html`. The 3D scroll scene needs an internet connection (three.js loads from a CDN);
without it, or with reduced motion turned on, the section shows a static version.

## Publish on GitHub Pages (about 10 minutes)
1. Sign in to github.com as **bfujah** and create a new **public** repository named exactly `bfujah.github.io`.
   That name makes the site live at `https://bfujah.github.io`.
2. On the new repository page, click **uploading an existing file**, drag in everything inside this folder
   (`index.html`, `assets/`, `.nojekyll`, `README.md`), and click **Commit changes**.
3. Go to **Settings > Pages**. Under "Build and deployment", choose **Deploy from a branch**, branch `main`, folder `/ (root)`, and save.
4. Wait one or two minutes, then open `https://bfujah.github.io`.

To update later, upload the changed files again (same names) and commit.

## Things to add
- **Headshot:** save a square photo as `headshot.jpg`. It replaces the "OA" initials automatically.
- **GM results:** welding and stamping projects show questions and methods only. Add numbers in the project
  `<template>` blocks after the papers are approved and published.
- **CV:** `Ajenifujah_CV.pdf` is a public version (no phone number, no unpublished GM numbers).

## Where to edit
- Text and projects: `index.html` (each project's pop-up is a `<template id="p-...">` block near the projects section).
- Colors and fonts: the variables at the top of `style.css`.

## Effects and how they are built
- **Shader gradient** (hero background): `gradient.js`, a small WebGL fragment shader, no libraries.
- **Liquid glass** (hero card, nav, panels): CSS `backdrop-filter` with an SVG displacement filter for refraction in Chromium browsers.
- **Liquid logo** (nav): an SVG gooey-blob monogram animated with SVG animation.
- **Scroll world** ("From powder to a verified decision"): `world.js`, a scroll-driven three.js scene (three@0.160.0 from jsDelivr).
- **Factory floor** animation: `floor.js`.
All effects pause when off screen and respect the "reduce motion" system setting.
