from chat_console_3.settings.common import *

SECRET_KEY = os.environ.get('SECRET_KEY')

ALLOWED_HOSTS = os.environ.get('ALLOW_HOST').split(',')

CORS_ORIGIN_WHITELIST = tuple(os.environ.get('WHITE_LIST').split(','))

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'USER': os.environ.get('DB_USER'),
        'NAME': os.environ.get('DB_NAME'),
        'PASSWORD': os.environ.get('DB_PASS'),
        'HOST': os.environ.get('DB_HOST'),
        'PORT': '3306',
        'OPTIONS': {
            'charset': 'utf8mb4'
        }
    }
}

# Email related
CONFIRM_DOMAIN = os.environ.get('CONFIRM')
URL_ENCODE_KEY = os.environ.get('ENCODE_KEY')
EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_PASS')

# NLU related
NLU_HOST = os.environ.get('NLU')

# Initial staff's password
INIT_PASSWORD = os.environ.get('INIT_PASS')

# Celery related settings
# TODO Should be get from env
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