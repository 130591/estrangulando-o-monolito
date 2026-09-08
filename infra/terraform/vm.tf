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
