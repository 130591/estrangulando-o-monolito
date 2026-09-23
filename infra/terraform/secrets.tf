resource "random_password" "jwt_secret" {
	length = 32
	special = true
}

resource "random_password" "db_password" {
	length = 16
	special = false
}

resource "google_secret_manager_secret" "jwt_secret" {
	secret_id = "jwt-secret"
	replication { 
    auto {}
  }
}

resource "google_secret_manager_secret" "db_password" {
  secret_id = "db-password"
  replication { 
    auto {} 
  }
}

resource "google_secret_manager_secret" "db_user" {
  secret_id = "db-user"
  replication { 
    auto {} 
  }
}

resource "google_secret_manager_secret_version" "jwt_secret_version" {
  secret      = google_secret_manager_secret.jwt_secret.id
  secret_data = random_password.jwt_secret.result
}
resource "google_secret_manager_secret_version" "db_password_version" {
  secret      = google_secret_manager_secret.db_password.id
  secret_data = random_password.db_password.result
}
resource "google_secret_manager_secret_version" "db_user_version" {
  secret      = google_secret_manager_secret.db_user.id
  secret_data = "app" # O nome de usuário pode ser fixo
}