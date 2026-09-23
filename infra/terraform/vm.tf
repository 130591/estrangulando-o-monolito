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

    cat << 'NGINX' > local/nginx/nginx.conf
    ${file("${path.module}/../../local/nginx/nginx.conf")}
    NGINX

    cat << 'COMPOSE' > docker-compose.yml
    ${file("${path.module}/../../prod/docker-compose.yml")}
    COMPOSE

    export DB_HOST="${google_sql_database_instance.main.private_ip_address}"
    export DB_NAME="${google_sql_database.app.name}"
    export DB_USER=$(gcloud secrets versions access latest --secret="db-user")
    export DB_PASSWORD=$(gcloud secrets versions access latest --secret="db-password")
    export JWT_SECRET=$(gcloud secrets versions access latest --secret="jwt-secret")

    docker compose up -d
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
