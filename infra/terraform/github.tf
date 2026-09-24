resource "google_iam_workload_identity_pool" "github" {
  workload_identity_pool_id = "github-actions-pool"
  display_name              = "GitHub Actions Pool"
}

resource "google_iam_workload_identity_pool_provider" "github" {
  workload_identity_pool_id          = google_iam_workload_identity_pool.github.workload_identity_pool_id
  workload_identity_pool_provider_id = "github-provider"
  display_name                       = "GitHub Actions Provider"

  attribute_mapping = {
    "google.subject"       = "assertion.sub"
    "attribute.actor"      = "assertion.actor"
    "attribute.repository" = "assertion.repository"
  }

  # Restringe para que APENAS o seu repositório possa usar isso (muito importante para segurança!)
  attribute_condition = "assertion.repository == \"130591/estrangulando-o-monolito\""

  oidc {
    issuer_uri = "https://token.actions.githubusercontent.com"
  }
}

resource "google_service_account" "github_actions" {
  account_id   = "github-actions-sa"
  display_name = "Service Account for GitHub Actions"
}

# Permite ao GitHub Actions fazer push no Artifact Registry
resource "google_project_iam_member" "github_actions_artifact" {
  project = var.project_id
  role    = "roles/artifactregistry.writer"
  member  = "serviceAccount:${google_service_account.github_actions.email}"
}

# Permite ao GitHub Actions gerenciar instâncias no Compute Engine (necessário para rodar SSH via gcloud na VM)
resource "google_project_iam_member" "github_actions_compute" {
  project = var.project_id
  role    = "roles/compute.instanceAdmin.v1"
  member  = "serviceAccount:${google_service_account.github_actions.email}"
}

# Permite que o GitHub Actions use Service Accounts existentes nas instâncias
resource "google_project_iam_member" "github_actions_sa_user" {
  project = var.project_id
  role    = "roles/iam.serviceAccountUser"
  member  = "serviceAccount:${google_service_account.github_actions.email}"
}

# Permite ao GitHub Actions usar o tunel IAP para conectar via SSH na VM
resource "google_project_iam_member" "github_actions_iap" {
  project = var.project_id
  role    = "roles/iap.tunnelResourceAccessor"
  member  = "serviceAccount:${google_service_account.github_actions.email}"
}

# Conecta o Workload Identity Pool à Service Account criada
resource "google_service_account_iam_member" "github_actions_workload_identity" {
  service_account_id = google_service_account.github_actions.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "principalSet://iam.googleapis.com/${google_iam_workload_identity_pool.github.name}/attribute.repository/130591/estrangulando-o-monolito"
}

# Outputs para você copiar e colar no workflow do GitHub Actions
output "github_workload_identity_provider" {
  description = "Valor para a variável workload_identity_provider no seu arquivo yaml"
  value       = google_iam_workload_identity_pool_provider.github.name
}

output "github_service_account_email" {
  description = "Valor para a variável service_account no seu arquivo yaml"
  value       = google_service_account.github_actions.email
}
