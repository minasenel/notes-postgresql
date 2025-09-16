from flask import Flask, render_template, request, redirect, session, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
import psycopg2
import psycopg2.errors #burada psycopg2.errors modülünü import ediyoruz. bu modül unique violation hatasını yakalamak için kullanılır. unique violation hatası kullanıcı adının tekrar edilmesi hatasıdır.
import os
from dotenv import load_dotenv
from ai_service import summarize_note #burada ai_service.py dosyasından summarize_note fonksiyonunu import ediyoruz. bu fonksiyon notları özetlemek için kullanılır.

# Environment variables'ları yükle
load_dotenv()

app = Flask(__name__)
# Session management secret
app.secret_key = os.getenv("SECRET_KEY", "dev-secret-key") #burada session management secret'ı ayarlıyoruz. . env dosyasında SECRET_KEY olarak ayarladık.


# PostgreSQL bağlantısı - environment variables kullanarak burada postgresql bağlantısı yapıyoruz.
conn = psycopg2.connect(
    dbname=os.getenv("DB_NAME", "mydb"),
    user=os.getenv("DB_USER", "myuser"),
    password=os.getenv("DB_PASSWORD"),
    host=os.getenv("DB_HOST", "localhost"),
    port=os.getenv("DB_PORT", "5432") 
)
cur = conn.cursor()

@app.route("/", methods=["GET"]) # Burada index fonksiyonu oluşturuldu. bu fonksiyon ana sayfayı görüntülemek için kullanılır.
def index():
    # Kullanıcı oturumuna göre notları çek
    if "user_id" in session:
        notebook_filter = request.args.get("notebook")
        # Not defterlerini getir
        cur.execute("SELECT id, name FROM notebooks WHERE user_id = %s ORDER BY name ASC;", (session["user_id"],))
        notebooks = cur.fetchall()
        # Notları getir (notebook filtresi varsa uygula)
        if notebook_filter:
            cur.execute( #burada notebook filtresi varsa uygulanır.
                """
                SELECT n.id, n.title, n.content, n.created_at, n.pinned,
                       nb.id AS notebook_id, nb.name AS notebook_name
                FROM notes n
                LEFT JOIN notebooks nb ON nb.id = n.notebook_id
                WHERE n.user_id = %s AND n.notebook_id = %s
                ORDER BY n.pinned DESC, n.created_at DESC;
                """,
                (session["user_id"], notebook_filter)
            )
        else:
            cur.execute( #burada notebook filtresi yoksa tüm notları çeker.
                """
                SELECT n.id, n.title, n.content, n.created_at, n.pinned,
                       nb.id AS notebook_id, nb.name AS notebook_name
                FROM notes n
                LEFT JOIN notebooks nb ON nb.id = n.notebook_id
                WHERE n.user_id = %s
                ORDER BY n.pinned DESC, n.created_at DESC;
                """,
                (session["user_id"],)
            )
        notes = cur.fetchall()
    else:
        notes = []
        notebooks = []
    return render_template("index.html", notes=notes, notebooks=notebooks)

@app.post("/notes")
def create_note():
    if "user_id" not in session:
        return redirect("/login")
    title = request.form["title"] #burada title ve content formlarından gelen verileri alıyoruz.
    content = request.form["content"]
    notebook_id_raw = request.form.get("notebook_id")
    notebook_id = int(notebook_id_raw) if notebook_id_raw else None
    cur.execute(
        "INSERT INTO notes (title, content, user_id, notebook_id) VALUES (%s, %s, %s, %s)", #burada notes tablosuna title, content, user_id ve notebook_id verilerini ekliyoruz.
        (title, content, session["user_id"], notebook_id)
    )
    conn.commit()
    return redirect("/")

@app.post("/notes/<int:note_id>/delete") #notu silme
def delete_note(note_id: int):
    if "user_id" not in session:
        return redirect("/login")
    cur.execute("DELETE FROM notes WHERE id = %s AND user_id = %s", (note_id, session["user_id"])) #burada sadece kendi notunu silmesine izin veriyoruz.
    conn.commit()
    return redirect("/")

@app.post("/notes/<int:note_id>/update") #notu güncelleme
def update_note(note_id: int):
    if "user_id" not in session:
        return redirect("/login")
    title = request.form["title"]
    content = request.form["content"]
    notebook_id_raw = request.form.get("notebook_id")
    notebook_id = int(notebook_id_raw) if notebook_id_raw else None
    cur.execute("UPDATE notes SET title = %s, content = %s, notebook_id = %s WHERE id = %s AND user_id = %s", (title, content, notebook_id, note_id, session["user_id"])) #burada sadece kendi notunu güncellemesine izin veriyoruz.
    conn.commit()
    return redirect("/")


#add a new function to see what notes are inside a notebook
@app.route("/notebook/<int:notebook_id>", methods=["GET"])
def notebook_notes(notebook_id: int):
    if "user_id" not in session:
        return redirect("/login")
    # current notebook 
    cur.execute("SELECT id, name FROM notebooks WHERE id = %s AND user_id = %s", (notebook_id, session["user_id"]))
    notebook = cur.fetchone()
    if not notebook:
        return redirect("/")
    # list notes in this notebook
    cur.execute("SELECT id, title, content, created_at FROM notes WHERE notebook_id = %s AND user_id = %s ORDER BY created_at DESC", (notebook_id, session["user_id"]))
    notes = cur.fetchall()
    # all notebooks 
    cur.execute("SELECT id, name FROM notebooks WHERE user_id = %s ORDER BY name ASC", (session["user_id"],))
    notebooks = cur.fetchall()
    return render_template("notebook_notes.html", notes=notes, notebooks=notebooks, current_notebook_id=notebook[0], current_notebook_name=notebook[1])


@app.post("/notes/<int:note_id>/pin")
def toggle_pin(note_id: int):
    if "user_id" not in session:
        return redirect("/login")
    # pinned kolonunu tersine çevir
    cur.execute(
        "UPDATE notes SET pinned = NOT COALESCE(pinned, FALSE) WHERE id = %s AND user_id = %s",
        (note_id, session["user_id"]) 
    )
    conn.commit()
    return redirect("/")

# Notebooks CRUD (simple create/delete + list via index)
@app.post("/notebooks")
def create_notebook():
    if "user_id" not in session:
        return redirect("/login")
    name = request.form["name"].strip()
    if not name:
        return redirect("/")
    cur.execute("INSERT INTO notebooks (name, user_id) VALUES (%s, %s)", (name, session["user_id"]))
    conn.commit()
    return redirect("/")

@app.post("/notebooks/<int:notebook_id>/delete") #not defteri silme
def delete_notebook(notebook_id: int):
    if "user_id" not in session:
        return redirect("/login")
    # Not defteri sadece sahibince silinebilir
    cur.execute("DELETE FROM notebooks WHERE id = %s AND user_id = %s", (notebook_id, session["user_id"]))
    conn.commit()
    return redirect("/")

@app.post("/notes/<int:note_id>/summarize")
def summarize_note_route(note_id: int):
    if "user_id" not in session:
        return jsonify({"error": "Not logged in"}), 401
    
    # Get note content
    cur.execute("SELECT content FROM notes WHERE id = %s AND user_id = %s", (note_id, session["user_id"]))
    note = cur.fetchone()
    if not note:
        return jsonify({"error": "Note not found"}), 404
    
    # Generate summary
    summary = summarize_note(note[0])
    return jsonify({"summary": summary})

@app.route("/register", methods=["GET", "POST"]) #burada register fonksiyonu oluşturuldu.
def register():
    if request.method == "POST":
        username = request.form["username"]
        password = request.form["password"]
        password_hash = generate_password_hash(password) #burada password hash'i oluşturuluyor.

        try:
            cur.execute(
                "INSERT INTO users (username, password_hash) VALUES (%s, %s)", #burada users tablosuna username ve password_hash verilerini ekliyoruz.
                (username, password_hash)
            )
            conn.commit()
        except psycopg2.errors.UniqueViolation: #burada UniqueViolation hatası yakalanıyor.
            conn.rollback()
            return "Username already exists!", 400

        return redirect("/login") #burada login sayfasına yönlendiriliyor.

    return render_template("register.html")

@app.route("/login", methods=["GET", "POST"]) #burada login fonksiyonu oluşturuldu.
def login():
    if request.method == "POST": 
        username = request.form["username"]
        password = request.form["password"]

        # kullanıcıyı getir 
        cur.execute("SELECT id, password_hash FROM users WHERE username = %s", (username,))
        row = cur.fetchone()
        if not row:
            return "Invalid username or password", 400

        user_id, password_hash = row #burada user_id ve password_hash değerlerini alıyoruz.
        if not check_password_hash(password_hash, password):
            return "Invalid username or password", 400

        session["user_id"] = user_id
        session["username"] = username
        return redirect("/")

    return render_template("login.html")

@app.post("/logout") #burada logout fonksiyonu oluşturuldu.
def logout(): 
    session.clear() 
    return redirect("/login") #burada login sayfasına yönlendiriliyor.

if __name__ == "__main__": #burada app.run fonksiyonu çalıştırılıyor.
    app.run(debug=True)
