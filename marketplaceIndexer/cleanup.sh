#!/bin/bash

echo "Deteniendo y eliminando contenedor PostgreSQL..."

docker kill marketplaceindexer-postgresql-1 2>/dev/null || true
docker stop marketplaceindexer-postgresql-1 2>/dev/null || true
docker rm marketplaceindexer-postgresql-1 2>/dev/null || true

echo "Eliminando volumen..."

docker volume rm marketplaceindexer_postgres_data 2>/dev/null || true

echo ""
echo "=== Contenedores ==="
docker ps -a

echo ""
echo "=== Volúmenes ==="
docker volume ls

echo ""
echo "Limpieza finalizada."
