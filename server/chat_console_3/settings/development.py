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