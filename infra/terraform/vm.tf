resource "google_compute_instance" "legacy" {
  name         = "monolito-legacy"
  machine_type = "e2-micro"
  zone         = var.zone
  tags         = ["legacy", "ssh"]

	service_account {
    email  = google_service_account.vm.email
    scopes = ["cloud-platform"]
  }

  allow_stopping_for_update = true

  boot_disk {
    initialize_params {
      image = "ubuntu-os-cloud/ubuntu-2404-lts-amd64"
      size  = 20
      type  = "pd-standard"
    }
  }

  network_interface {
    subnetwork = google_compute_subnetwork.main.id
    access_config {}
  }

    metadata_startup_script = <<-EOF
    #!/bin/bash
    set -e

    # 1. Instalar Docker
    if ! command -v docker &> /dev/null; then
        curl -fsSL https://get.docker.com | sh
    fi
    gcloud auth configure-docker ${var.region}-docker.pkg.dev --quiet

    mkdir -p /opt/monolito/local/nginx
    cd /opt/monolito

    # 2. Escrever nginx.conf
    cat << 'NGINX' > local/nginx/nginx.conf
    ${file("${path.module}/../../local/nginx/nginx.conf")}
    NGINX

    # 3. Escrever docker-compose.yml
    cat << 'COMPOSE' > docker-compose.yml
    ${file("${path.module}/../../prod/docker-compose.yml")}
    COMPOSE

    # 4. Escrever .env com os secrets do Secret Manager
    cat << ENV > .env
DB_HOST=${google_sql_database_instance.main.private_ip_address}
DB_NAME=${google_sql_database.app.name}
DB_USER=$(gcloud secrets versions access latest --secret="db-user")
DB_PASSWORD=$(gcloud secrets versions access latest --secret="db-password")
JWT_SECRET=$(gcloud secrets versions access latest --secret="jwt-secret")
ENV

    # Os containers NAO sobem aqui.
    # O startup script so prepara o ambiente (Docker + arquivos).
    # Quem sobe os containers e o job deploy-vm do GitHub Actions,
    # garantindo que as imagens ja existem no Artifact Registry antes do up.
    EOF
}

resource "google_compute_firewall" "ssh" {
  name          = "allow-ssh"
  network       = google_compute_network.main.id
  target_tags   = ["ssh"]
  source_ranges = ["35.235.240.0/20"]

  allow {
    protocol = "tcp"
    ports    = ["22"]
  }
}

resource "google_compute_firewall" "app" {
  name          = "allow-app"
  network       = google_compute_network.main.id
  target_tags   = ["legacy"]
  source_ranges = ["0.0.0.0/0"]

  allow {
    protocol = "tcp"
    ports    = ["8080"]
  }
}
