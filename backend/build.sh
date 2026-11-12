#!/usr/bin/env bash
# Render build script for the Django API.
set -o errexit

pip install --upgrade pip
pip install -r requirements.txt
python manage.py collectstatic --no-input
python manage.py migrate --no-input
# Mirror catalog photos to Cloudinary when its credentials are configured.
if [ -n "$CLOUDINARY_CLOUD_NAME" ]; then
  python manage.py seed --cloudinary
else
  python manage.py seed
fi
