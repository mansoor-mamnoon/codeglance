import pytest
from fastapi.testclient import TestClient
from src.main import app

client = TestClient(app)


def test_list_users_empty():
    response = client.get("/users/")
    assert response.status_code == 200
    assert response.json() == []


def test_create_user():
    response = client.post(
        "/users/",
        json={"email": "test@example.com", "password": "secret"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "test@example.com"
    assert "id" in data


def test_get_user_not_found():
    response = client.get("/users/99999")
    assert response.status_code == 404
