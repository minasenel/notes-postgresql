from flask import Flask, render_template, request, redirect
import psycopg2
import os
from dotenv import load_dotenv

# Environment variables'ları yükle
load_dotenv()

app = Flask(__name__)

# PostgreSQL bağlantısı - environment variables kullanarak
conn = psycopg2.connect(
    dbname=os.getenv("DB_NAME", "mydb"),
    user=os.getenv("DB_USER", "myuser"),
    password=os.getenv("DB_PASSWORD"),
    host=os.getenv("DB_HOST", "localhost"),
    port=os.getenv("DB_PORT", "5432")
)
cur = conn.cursor()

@app.route("/", methods=["GET", "POST"])
def index():
    if request.method == "POST":
        title = request.form["title"]
        content = request.form["content"]
        cur.execute(
            "INSERT INTO notes (title, content) VALUES (%s, %s)",
            (title, content)
        )
        conn.commit()
        return redirect("/")

    # Tüm notları çek
    cur.execute("SELECT id, title, content, created_at FROM notes ORDER BY created_at DESC;")
    notes = cur.fetchall()
    return render_template("index.html", notes=notes)

if __name__ == "__main__":
    app.run(debug=True)
