resource "google_compute_instance_group" "legacy" {
  name        = "monolito-legacy-ig"
  zone        = var.zone
  instances   = [google_compute_instance.legacy.id]

  named_port {
    name = "http-8080"
    port = 8080
  }
}

# 2. Health Check do Load Balancer (verifica a borda /_edge/healthz na porta 8080)
resource "google_compute_health_check" "legacy" {
  name               = "monolito-legacy-hc"
  check_interval_sec = 5
  timeout_sec        = 5

  http_health_check {
    port         = 8080
    request_path = "/_edge/healthz"
  }
}

# 3. Backend Service para o Legado
resource "google_compute_backend_service" "legacy" {
  name                  = "monolito-legacy-backend"
  protocol              = "HTTP"
  port_name             = "http-8080"
  load_balancing_scheme = "EXTERNAL_MANAGED"
  health_checks         = [google_compute_health_check.legacy.id]

  backend {
    group = google_compute_instance_group.legacy.id
  }
}

# 4. URL Map (Etapa 0: default_service aponta para o legado)
resource "google_compute_url_map" "main" {
  name            = "monolito-url-map"
  default_service = google_compute_backend_service.legacy.id
}

# 5. Target HTTP Proxy
resource "google_compute_target_http_proxy" "main" {
  name    = "monolito-http-proxy"
  url_map = google_compute_url_map.main.id
}

# 6. Global Forwarding Rule (IP público de borda na porta 80)
resource "google_compute_global_forwarding_rule" "http" {
  name                  = "monolito-http-forwarding-rule"
  load_balancing_scheme = "EXTERNAL_MANAGED"
  port_range            = "80"
  target                = google_compute_target_http_proxy.main.id
}

# 7. Firewall para permitir tráfego dos Health Checks do GCP na porta 8080
resource "google_compute_firewall" "allow_gcp_health_checks" {
  name    = "allow-gcp-health-checks"
  network = google_compute_network.main.id

  allow {
    protocol = "tcp"
    ports    = ["8080"]
  }

  # Bloco oficial de IPs do Google para Health Checks do LB
  source_ranges = ["130.211.0.0/22", "35.191.0.0/16"]
  target_tags   = ["legacy"]
}