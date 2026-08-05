import os
import sqlite3
from flask import Flask, request, jsonify, render_template_string

app = Flask(__name__)
DB_PATH = os.environ.get('METEO_DB_PATH', '/app/db/meteo.db')

def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    # Nous ajoutons les colonnes avec le suffixe _2 pour le second capteur
    c.execute('''CREATE TABLE IF NOT EXISTS mesures
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                  temperature REAL,
                  humidity REAL,
                  pressure REAL,
                  gas_resistance REAL,
                  temp_2 REAL,
                  humidity_2 REAL,
                  pressure_2 REAL,
                  gas_resistance_2 REAL)''')
    conn.commit()
    conn.close()

init_db()

def evaluate_iaq(gas_res):
    if gas_res == "--":
        return "En attente...", "#6c757d" # Gris
    try:
        res = float(gas_res)
        if res > 50: return "Excellente", "#28a745" # Vert
        elif res > 20: return "Bonne", "#17a2b8"    # Bleu
        elif res > 10: return "Moyenne", "#ffc107"  # Jaune
        else: return "Mauvaise", "#dc3545"          # Rouge
    except (ValueError, TypeError):
        return "Erreur", "#6c757d"

def get_latest_readings():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''SELECT temperature, humidity, pressure, gas_resistance,
                        temp_2, humidity_2, pressure_2, gas_resistance_2
                 FROM mesures ORDER BY timestamp DESC LIMIT 1''')
    row = c.fetchone()
    conn.close()

    if row:
        d = {
            "temperature": row[0], "humidity": row[1], "pressure": row[2], "gas_resistance": row[3],
            "temp_2": row[4], "humidity_2": row[5], "pressure_2": row[6], "gas_resistance_2": row[7]
        }
    else:
        d = {k: "--" for k in ["temperature", "humidity", "pressure", "gas_resistance",
                               "temp_2", "humidity_2", "pressure_2", "gas_resistance_2"]}

    iaq_text_1, iaq_color_1 = evaluate_iaq(d["gas_resistance"])
    iaq_text_2, iaq_color_2 = evaluate_iaq(d["gas_resistance_2"])
    return d, iaq_text_1, iaq_color_1, iaq_text_2, iaq_color_2

@app.route('/update', methods=['POST'])
def update_data():
    if request.is_json:
        try:
            data = request.get_json()
            keys = ["temperature", "humidity", "pressure", "gas_resistance", 
                    "temp_2", "humidity_2", "pressure_2", "gas_resistance_2"]
            
            # Vérification que les 8 clés sont bien présentes dans le JSON
            if all(k in data for k in keys):
                conn = sqlite3.connect(DB_PATH)
                c = conn.cursor()
                c.execute('''INSERT INTO mesures 
                             (temperature, humidity, pressure, gas_resistance, 
                              temp_2, humidity_2, pressure_2, gas_resistance_2) 
                             VALUES (?, ?, ?, ?, ?, ?, ?, ?)''',
                          (data['temperature'], data['humidity'], data['pressure'], data['gas_resistance'],
                           data['temp_2'], data['humidity_2'], data['pressure_2'], data['gas_resistance_2']))
                conn.commit()
                conn.close()
                return jsonify({"status": "success"}), 200
            else:
                return jsonify({"status": "missing keys"}), 400
        except Exception as e:
            print(f"Erreur serveur: {e}")
            return jsonify({"status": "server error"}), 500
            
    return jsonify({"status": "bad request"}), 400

@app.route('/api/latest')
def api_latest():
    d, iaq_text_1, iaq_color_1, iaq_text_2, iaq_color_2 = get_latest_readings()
    return jsonify({
        "sensor1": {
            "label": "Capteur Principal (0x77)",
            "temperature": d["temperature"],
            "humidity": d["humidity"],
            "pressure": d["pressure"],
            "gas_resistance": d["gas_resistance"],
            "iaq_text": iaq_text_1,
            "iaq_color": iaq_color_1,
        },
        "sensor2": {
            "label": "Capteur Secondaire (0x76)",
            "temperature": d["temp_2"],
            "humidity": d["humidity_2"],
            "pressure": d["pressure_2"],
            "gas_resistance": d["gas_resistance_2"],
            "iaq_text": iaq_text_2,
            "iaq_color": iaq_color_2,
        }
    })

@app.route('/api/history')
def api_history():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''SELECT date(timestamp) AS day,
                        ROUND(AVG(temperature), 1), ROUND(AVG(humidity), 1),
                        ROUND(AVG(pressure), 1), ROUND(AVG(gas_resistance), 1),
                        ROUND(AVG(temp_2), 1), ROUND(AVG(humidity_2), 1),
                        ROUND(AVG(pressure_2), 1), ROUND(AVG(gas_resistance_2), 1)
                 FROM mesures
                 GROUP BY day
                 ORDER BY day''')
    rows = c.fetchall()
    conn.close()

    history = [
        {
            "date": day,
            "sensor1": {
                "temperature": t1, "humidity": h1, "pressure": p1, "gas_resistance": g1,
            },
            "sensor2": {
                "temperature": t2, "humidity": h2, "pressure": p2, "gas_resistance": g2,
            },
        }
        for day, t1, h1, p1, g1, t2, h2, p2, g2 in rows
    ]
    return jsonify(history)

@app.route('/')
def index():
    d, iaq_text_1, iaq_color_1, iaq_text_2, iaq_color_2 = get_latest_readings()

    html_template = """
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Station Météo Double Capteur</title>
        <style>
            body { font-family: 'Segoe UI', Tahoma, sans-serif; text-align: center; background-color: #e9ecef; margin: 0; padding: 40px 20px; }
            h1 { color: #343a40; margin-bottom: 30px; }
            .container { display: flex; flex-wrap: wrap; justify-content: center; gap: 20px; max-width: 1000px; margin: 0 auto; }
            .card { background: white; padding: 25px; border-radius: 15px; box-shadow: 0 10px 20px rgba(0,0,0,0.1); flex: 1; min-width: 300px; text-align: left; }
            .card h2 { color: #495057; border-bottom: 2px solid #dee2e6; padding-bottom: 10px; margin-top: 0; font-size: 1.4em; }
            p { font-size: 1.1em; color: #495057; margin: 12px 0; }
            .badge { color: white; padding: 5px 12px; border-radius: 20px; font-weight: bold; font-size: 0.9em; margin-left: 5px; }
            .raw-data { font-size: 0.85em; color: #adb5bd; }
        </style>
    </head>
    <body>
        <h1>🌡️ Tableau de Bord Environnemental</h1>
        <div class="container">
            <div class="card">
                <h2>Capteur Principal (0x77)</h2>
                <p>🌡️ Température : <strong>{{ d.temperature }} °C</strong></p>
                <p>💧 Humidité : <strong>{{ d.humidity }} %</strong></p>
                <p>⏱️ Pression : <strong>{{ d.pressure }} hPa</strong></p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                <p>🌬️ Qualité de l'air : <span class="badge" style="background-color: {{ c1 }};">{{ t1 }}</span></p>
                <p class="raw-data">Valeur brute : {{ d.gas_resistance }} kOhms</p>
            </div>
            
            <div class="card">
                <h2>Capteur Secondaire (0x76)</h2>
                <p>🌡️ Température : <strong>{{ d.temp_2 }} °C</strong></p>
                <p>💧 Humidité : <strong>{{ d.humidity_2 }} %</strong></p>
                <p>⏱️ Pression : <strong>{{ d.pressure_2 }} hPa</strong></p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                <p>🌬️ Qualité de l'air : <span class="badge" style="background-color: {{ c2 }};">{{ t2 }}</span></p>
                <p class="raw-data">Valeur brute : {{ d.gas_resistance_2 }} kOhms</p>
            </div>
        </div>
    </body>
    </html>
    """
    return render_template_string(html_template, d=d, t1=iaq_text_1, c1=iaq_color_1, t2=iaq_text_2, c2=iaq_color_2)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
