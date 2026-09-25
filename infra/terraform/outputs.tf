output "vm_public_ip" {
  description = "IP público da VM do legado"
  value       = google_compute_instance.legacy.network_interface[0].access_config[0].nat_ip
}

output "vm_app_url" {
  description = "URL para acessar o aplicativo no navegador (borda/nginx na porta 8080)"
  value       = "http://${google_compute_instance.legacy.network_interface[0].access_config[0].nat_ip}:8080/"
}

output "lb_public_ip" {
  description = "IP público do Load Balancer (Borda/Etapa 0)"
  value       = google_compute_global_forwarding_rule.http.ip_address
}

output "lb_app_url" {
  description = "URL da aplicação via Load Balancer (porta 80)"
  value       = "http://${google_compute_global_forwarding_rule.http.ip_address}/"
}