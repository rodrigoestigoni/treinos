#!/bin/bash
set -e

# Esperar pelo banco de dados
echo "Esperando pelo banco de dados..."
until PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c '\q'; do
  >&2 echo "Postgres não está disponível ainda - esperando..."
  sleep 1
done
echo "Banco de dados disponível!"

# Aplicar migrações
python manage.py makemigrations core
python manage.py migrate

# Coletar arquivos estáticos
python manage.py collectstatic --noinput

# Iniciar Gunicorn
exec gunicorn --bind 0.0.0.0:8000 --workers 4 --timeout 120 califit.wsgi:application