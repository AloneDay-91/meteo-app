import sqlite3

import pytest


@pytest.fixture
def client(tmp_path, monkeypatch):
    db_path = tmp_path / "meteo.db"
    monkeypatch.setenv("METEO_DB_PATH", str(db_path))

    import importlib
    import app as app_module
    importlib.reload(app_module)

    app_module.app.config["TESTING"] = True
    with app_module.app.test_client() as test_client:
        yield test_client, app_module


def test_api_latest_returns_placeholders_when_db_empty(client):
    test_client, _ = client
    response = test_client.get("/api/latest")
    assert response.status_code == 200
    data = response.get_json()
    assert data["sensor1"]["label"] == "Capteur Principal (0x77)"
    assert data["sensor1"]["temperature"] == "--"
    assert data["sensor1"]["iaq_text"] == "En attente..."
    assert data["sensor2"]["label"] == "Capteur Secondaire (0x76)"
    assert data["sensor2"]["temperature"] == "--"


def test_api_latest_returns_latest_measurement(client):
    test_client, app_module = client
    conn = sqlite3.connect(app_module.DB_PATH)
    c = conn.cursor()
    c.execute(
        """INSERT INTO mesures
           (temperature, humidity, pressure, gas_resistance,
            temp_2, humidity_2, pressure_2, gas_resistance_2)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
        (21.3, 45.2, 1013.1, 52.3, 20.9, 47.8, 1012.8, 38.1),
    )
    conn.commit()
    conn.close()

    response = test_client.get("/api/latest")
    data = response.get_json()
    assert data["sensor1"]["temperature"] == 21.3
    assert data["sensor1"]["gas_resistance"] == 52.3
    assert data["sensor1"]["iaq_text"] == "Excellente"
    assert data["sensor1"]["iaq_color"] == "#28a745"
    assert data["sensor2"]["temperature"] == 20.9
    assert data["sensor2"]["gas_resistance"] == 38.1
    assert data["sensor2"]["iaq_text"] == "Bonne"
    assert data["sensor2"]["iaq_color"] == "#17a2b8"
