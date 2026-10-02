resource "google_cloud_run_v2_service" "new_api" {
  name                = "new-api"
  location            = var.region
  deletion_protection = false

  # Segurança: Bloqueia acesso direto pela URL do Cloud Run. 
  # Só aceita requisições que venham do nosso Load Balancer.
  ingress = "INGRESS_TRAFFIC_INTERNAL_LOAD_BALANCER"

  template {
    service_account = google_service_account.vm.email

    containers {
      # IMAGEM: O Terraform dá erro se a imagem não existir. 
      # e depois sua pipeline do GitHub Actions substitui pela imagem real!
      image = "us-docker.pkg.dev/cloudrun/container/hello"

      env {
        name  = "DB_HOST"
        value = "/cloudsql/${google_sql_database_instance.main.connection_name}"
      }
      env {
        name  = "DB_NAME"
        value = google_sql_database.app.name
      }

      env {
        name = "DB_USER"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.db_user.secret_id
            version = "latest"
          }
        }
      }

      env {
        name = "DB_PASSWORD"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.db_password.secret_id
            version = "latest"
          }
        }
      }
      env {
        name = "JWT_SECRET"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.jwt_secret.secret_id
            version = "latest"
          }
        }
      }

      # Montando o socket do Cloud SQL no container
      volume_mounts {
        name       = "cloudsql"
        mount_path = "/cloudsql"
      }
    }

    # Ativando a conexão nativa com o Cloud SQL
    volumes {
      name = "cloudsql"
      cloud_sql_instance {
        instances = [google_sql_database_instance.main.connection_name]
      }
    }
  }
}

# Dá permissão para o Load Balancer (que é "público") invocar o Cloud Run
resource "google_cloud_run_v2_service_iam_member" "new_api_public" {
  name     = google_cloud_run_v2_service.new_api.name
  location = google_cloud_run_v2_service.new_api.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}



resource "google_cloud_run_v2_service" "new_front" {
  name                = "new-front"
  location            = var.region
  deletion_protection = false

  ingress = "INGRESS_TRAFFIC_INTERNAL_LOAD_BALANCER"

  template {
    service_account = google_service_account.vm.email
    containers {
      # Isso aqui é só uma imagem falsa (hello-world) por enquanto!
      image = "us-docker.pkg.dev/cloudrun/container/hello"
    }
  }
}

resource "google_cloud_run_v2_service_iam_member" "new_front_public" {
  name     = google_cloud_run_v2_service.new_front.name
  location = google_cloud_run_v2_service.new_front.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}