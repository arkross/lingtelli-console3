from chat_console_3.settings.common import *

# Remember to modify wsgi and manage file to use development settings


ALLOWED_HOSTS = [
    '0.0.0.0',
    '127.0.0.1',
    '192.168.10.7',
    '192.168.10.10'
]

CORS_ORIGIN_WHITELIST = (
    '0.0.0.0:8000',
    '127.0.0.1:8000',
    '192.168.10.10:3000',
    'google.com',
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
    # 'check_paidtype_expired_every_day': {
    #     'task': 'paidtype_expire',
    #     'schedule': 86400.0
    # }
}

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters':{
        'verbose': {
            'format': '{levelname} {asctime} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'level': 'DEBUG',
            'class': 'logging.StreamHandler',
            'formatter': 'verbose'
        },
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'propagate': True
        },
        'account.views': {
            'level': 'DEBUG',
            'handlers': ['console'],
            'propagate': True
        }
    },
}