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

@app.route("/", methods=["GET"]) # Burada index fonksiyonu oluşturuldu.
def index():
    # Tüm notları çek
    cur.execute("SELECT id, title, content, created_at FROM notes ORDER BY created_at DESC;")
    notes = cur.fetchall()
    return render_template("index.html", notes=notes)

@app.post("/notes")
def create_note():
    title = request.form["title"] #burada title ve content formlarından gelen verileri alıyoruz.
    content = request.form["content"]
    cur.execute(
        "INSERT INTO notes (title, content) VALUES (%s, %s)", #burada notes tablosuna title ve content verilerini ekliyoruz.
        (title, content)
    )
    conn.commit()
    return redirect("/")

@app.post("/notes/<int:note_id>/delete")
def delete_note(note_id: int):
    cur.execute("DELETE FROM notes WHERE id = %s", (note_id,)) #burada notes tablosundan seçilen notu siliyoruz.
    conn.commit()
    return redirect("/")

@app.post("/notes/<int:note_id>/update")
def update_note(note_id: int):
    title = request.form["title"]
    content = request.form["content"]
    cur.execute("UPDATE notes SET title = %s, content = %s WHERE id = %s", (title, content, note_id)) #burada notes tablosundaki seçilen notun title ve content verilerini güncelliyoruz.
    conn.commit()
    return redirect("/")

if __name__ == "__main__":
    app.run(debug=True)
