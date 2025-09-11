# Notes Project

A simple Flask web application for managing notes with PostgreSQL database.

## Features

- Create and view notes
- PostgreSQL database integration
- Clean and simple web interface
- Environment-based configuration

## Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd notes_project
   ```

2. **Create a virtual environment**
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**
   - Create a `.env` file in the project root
   - Add your database configuration:
     ```
     DB_NAME=mydb
     DB_USER=myuser
     DB_PASSWORD=your_password_here
     DB_HOST=localhost
     DB_PORT=5432
     ```

5. **Set up PostgreSQL database**
   - Make sure PostgreSQL is running
   - Create the database and user as specified in your `.env` file
   - Create the notes table:
     ```sql
     CREATE TABLE notes (
         id SERIAL PRIMARY KEY,
         title VARCHAR(255) NOT NULL,
         content TEXT,
         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
     );
     ```

6. **Run the application**
   ```bash
   python app.py
   ```

7. **Access the application**
   - Open your browser and go to `http://localhost:5000`

## Project Structure

```
notes_project/
├── app.py              # Main Flask application
├── requirements.txt    # Python dependencies
├── .env               # Environment variables (not tracked in git)
├── .gitignore         # Git ignore rules
├── static/
│   ├── style.css      # CSS styles
│   └── script.js      # JavaScript
└── templates/
    └── index.html     # Main HTML template
```

## Dependencies

- Flask 2.3.3
- psycopg2-binary 2.9.7
- python-dotenv 1.0.0

## Security Notes

- Database credentials are stored in environment variables
- The `.env` file is not tracked in git for security
- Make sure to keep your database credentials secure

## License

Private repository - All rights reserved.
