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


def test_api_history_returns_empty_list_when_db_empty(client):
    test_client, _ = client
    response = test_client.get("/api/history")
    assert response.status_code == 200
    assert response.get_json() == []


def test_api_history_groups_and_averages_by_day(client):
    test_client, app_module = client
    conn = sqlite3.connect(app_module.DB_PATH)
    c = conn.cursor()
    # Two readings on the same day (should be averaged) and one on the next day.
    c.executemany(
        """INSERT INTO mesures
           (timestamp, temperature, humidity, pressure, gas_resistance,
            temp_2, humidity_2, pressure_2, gas_resistance_2)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        [
            ("2026-08-04 08:00:00", 20.0, 44.0, 1012.0, 50.0, 19.0, 46.0, 1011.0, 36.0),
            ("2026-08-04 20:00:00", 22.0, 46.0, 1014.0, 54.0, 21.0, 48.0, 1013.0, 40.0),
            ("2026-08-05 12:00:00", 21.3, 45.2, 1013.1, 52.3, 20.9, 47.8, 1012.8, 38.1),
        ],
    )
    conn.commit()
    conn.close()

    response = test_client.get("/api/history")
    data = response.get_json()

    assert data == [
        {
            "date": "2026-08-04",
            "sensor1": {"temperature": 21.0, "humidity": 45.0, "pressure": 1013.0, "gas_resistance": 52.0},
            "sensor2": {"temperature": 20.0, "humidity": 47.0, "pressure": 1012.0, "gas_resistance": 38.0},
        },
        {
            "date": "2026-08-05",
            "sensor1": {"temperature": 21.3, "humidity": 45.2, "pressure": 1013.1, "gas_resistance": 52.3},
            "sensor2": {"temperature": 20.9, "humidity": 47.8, "pressure": 1012.8, "gas_resistance": 38.1},
        },
    ]


def test_api_measures_returns_empty_list_when_db_empty(client):
    test_client, _ = client
    response = test_client.get("/api/measures")
    assert response.status_code == 200
    assert response.get_json() == []


def test_api_measures_returns_every_reading_in_chronological_order(client):
    test_client, app_module = client
    conn = sqlite3.connect(app_module.DB_PATH)
    c = conn.cursor()
    c.executemany(
        """INSERT INTO mesures
           (timestamp, temperature, humidity, pressure, gas_resistance,
            temp_2, humidity_2, pressure_2, gas_resistance_2)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        [
            ("2026-08-04 08:00:00", 20.0, 44.0, 1012.0, 50.0, 19.0, 46.0, 1011.0, 36.0),
            ("2026-08-04 08:10:00", 22.0, 46.0, 1014.0, 54.0, 21.0, 48.0, 1013.0, 40.0),
        ],
    )
    conn.commit()
    conn.close()

    response = test_client.get("/api/measures")
    data = response.get_json()

    assert data == [
        {
            "timestamp": "2026-08-04 08:00:00",
            "sensor1": {"temperature": 20.0, "humidity": 44.0, "pressure": 1012.0, "gas_resistance": 50.0},
            "sensor2": {"temperature": 19.0, "humidity": 46.0, "pressure": 1011.0, "gas_resistance": 36.0},
        },
        {
            "timestamp": "2026-08-04 08:10:00",
            "sensor1": {"temperature": 22.0, "humidity": 46.0, "pressure": 1014.0, "gas_resistance": 54.0},
            "sensor2": {"temperature": 21.0, "humidity": 48.0, "pressure": 1013.0, "gas_resistance": 40.0},
        },
    ]
