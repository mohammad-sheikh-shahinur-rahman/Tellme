# TellMe Developer Documentation

This document outlines the features, architecture, and production procedures for the TellMe application.

## Core Features Implemented

### 1. Social Media Integration
- **Direct Share**: Users can share their profile link via WhatsApp, Facebook, and X (formerly Twitter).
- **Deep Linking**: Dynamic URL generation based on the user's registered username.

### 2. Smart Letter Editor
- **Auto-save Drafts**: Automatically persists the letter content, template selection, and font size to `localStorage`. Prevents data loss on accidental refresh or navigation.
- **Visual Font Previews**: The template selection grid now displays live previews of the typography (Handwriting vs. Serif vs. Sans Serif) before the user selects it.
- **End-to-End Encryption**: All messages are encrypted client-side using AES-256 before being sent to the database.

### 3. Enhanced UX & Validation
- **Real-time Input Feedback**: Visual border-color changes (Red/Indigo) in the username search field. Prevents spaces and special characters.
- **Micro-animations**: Staggered entry transitions using `motion/react` for a polished feel.

## Technical Architecture

### Tech Stack
- **Frontend**: React 18, Vite, Tailwind CSS, Lucide React, Framer Motion.
- **Backend**: Node.js (Express), esbuild (for CJS bundling).
- **Database**: Dual-mode support (Firebase Firestore or MySQL/Local JSON).
- **Encryption**: CryptoJS for secure message handling.

### Build System
The application uses a hybrid build process to ensure compatibility with Cloud Run:
- **Client**: `vite build` outputs to `/dist`.
- **Server**: `esbuild` bundles `server.ts` into a CommonJS file (`dist/server.cjs`) to handle Node.js module constraints.

## Production Build & Deployment

To prepare the application for production, follow these steps:

### 1. Environment Configuration
Ensure your `.env` file contains the required keys (do not commit these):
```env
# Database Configuration
DATABASE_TYPE=firebase # or mysql
GEMINI_API_KEY=your_key

# If using Firebase:
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
# ... (all other Firebase variables)
```

### 2. Run Build Command
```bash
npm run build
```
This will:
1. Compile the React frontend into `dist/`.
2. Bundle the Express server into `dist/server.cjs`.

### 3. Start Production Server
```bash
npm start
```
The server will serve the static frontend from `dist/` and handle all API requests on port 3000.

## Maintenance
- **Security Rules**: Always verify `firestore.rules` when modifying data structures.
- **Asset Optimization**: New fonts should be added to `src/index.css` before use in `constants.ts`.

---
*Developed by Mohammad Sheikh Shahinur rahman*
