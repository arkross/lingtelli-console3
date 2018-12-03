from chat_console_3.settings.common import *

# Remember to modify wsgi and manage file to use development settings


ALLOWED_HOSTS = [
    '127.0.0.1',
]

CORS_ORIGIN_WHITELIST = (
    '127.0.0.1:8000',
    '127.0.0.1:3000'
)

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'USER': 'superuser',
        'NAME': 'console',
        'PASSWORD': 'pass1234',
        'HOST': '127.0.0.1',
        'PORT': '3306',
        'OPTIONS': {
            'charset': 'utf8mb4'
        }
    }
}

# Celery related settings
CELERY_BROKER_URL = 'redis://localhost:6379'

CELERY_BEAT_SCHEDULE = {
    'check_token_expired_every_minutes': {
        'task': 'delete_token',
        'schedule': 60.0
    }
}