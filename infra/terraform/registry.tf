resource "google_artifact_registry_repository" "apps" {
  location = var.region
  repository_id = "apps"
  format = "DOCKER"
}

resource "google_service_account" "vm" {
  account_id   = "monolito-vm"
  display_name = "VM do legado"
}

resource "google_project_iam_member" "vm_pull" {
  project = var.project_id
  role    = "roles/artifactregistry.reader"
  member  = "serviceAccount:${google_service_account.vm.email}"
}