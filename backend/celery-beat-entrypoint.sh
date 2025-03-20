#!/bin/bash
set -e

# Esperar pelo banco de dados
echo "Esperando pelo banco de dados..."
until PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -d postgres -c '\q'; do
  >&2 echo "Postgres não está disponível ainda - esperando..."
  sleep 1
done
echo "Banco de dados disponível!"

# Iniciar Celery Beat
exec celery -A califit beat -l INFO