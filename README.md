# Notes Project

Flask + PostgreSQL notes application with notebooks, pinning, and AI-powered summarization. Modern UI uses a semantic color system, Inter font, and an accessible modal system.

## Features

- Notes CRUD: create, preview, pin/unpin, delete
- Notebooks: organize notes, bookshelf UI with two scrollable shelves
- Bento notes layout: latest note is emphasized; others shown in uniform cards
- Edit modal: click any note to edit in a popup; auto-saves on close/outside click
- AI Summarization: per-note “🤖 Özetle” using Google Gemini (1.5 Flash)
- Confirm modals: delete confirmations, including a detailed notebook delete warning
- Theming: light/dark via prefers-color-scheme, semantic CSS variables, Inter font
- Accessibility: keyboard focus styles, readable contrasts

## Demo (local)

- Homepage: banner with features, notebooks + bookshelf, create note, bento notes
- Notebook preview: click “books” in the bookshelf to preview notes in a modal
- Edit: click any note to open the edit popup; saves automatically on dismiss

## Setup

1. Clone
   ```bash
   git clone <repository-url>
   cd notes_project
   ```

2. Virtual environment
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies
   ```bash
   pip install -r requirements.txt
   ```

4. Environment variables (.env)
   ```env
   # Flask session
   SECRET_KEY=dev-secret-key

   # Database
   DB_NAME=mydb
   DB_USER=myuser
   DB_PASSWORD=your_password_here
   DB_HOST=localhost
   DB_PORT=5432

   # Google Gemini
   GEMINI_API_KEY=your_gemini_api_key
   ```

5. PostgreSQL schema (minimum)
   ```sql
   -- Users
   CREATE TABLE users (
     id SERIAL PRIMARY KEY,
     username VARCHAR(50) UNIQUE NOT NULL,
     password_hash TEXT NOT NULL
   );

   -- Notebooks
   CREATE TABLE notebooks (
     id SERIAL PRIMARY KEY,
     name VARCHAR(120) NOT NULL,
     user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE
   );

   -- Notes
   CREATE TABLE notes (
     id SERIAL PRIMARY KEY,
     title VARCHAR(100),
     content TEXT,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     pinned BOOLEAN DEFAULT FALSE,
     notebook_id INTEGER REFERENCES notebooks(id) ON DELETE SET NULL
   );

   -- Indexes for better performance
   CREATE INDEX idx_notebooks_user_id_name ON notebooks(user_id, name);
   CREATE INDEX idx_notes_notebook_id ON notes(notebook_id);
   ```

6. Run
   ```bash
   python app.py
   ```

7. Open
   - http://localhost:5000

## Project Structure

```
notes_project/
├── app.py              # Flask routes (auth, notes CRUD, notebooks, summarize)
├── ai_service.py       # Gemini API integration (summarize_note)
├── requirements.txt    # Python dependencies
├── .env                # Environment variables (not tracked)
├── static/
│   ├── style.css       # Color system, layout, components, modals
│   └── script.js       # Modals, autosize, summarize, edit popup, bookshelf
└── templates/
    ├── index.html      # Homepage (banner, notebooks, bookshelf, bento notes)
    ├── login.html      # Auth
    ├── register.html   # Auth
    └── notebook_notes.html # Per-notebook view
```

## Environment & Security Notes

- Keep `SECRET_KEY` and `GEMINI_API_KEY` private
- `.env` is not tracked by git
- DB access is scoped per `session.user_id`

## Troubleshooting

- Summarization returns error: ensure `GEMINI_API_KEY` is set and internet access is available
- Notes don’t show: ensure you’re logged in and DB tables exist
- Styles look off: clear cache/hard refresh after CSS changes
