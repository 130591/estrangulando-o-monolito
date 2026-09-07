gcloud storage buckets create gs://estrangulando-monolito-tfstate \
  --location=us-central1 \
  --uniform-bucket-level-access

gcloud storage buckets update gs://estrangulando-monolito-tfstate --versioning