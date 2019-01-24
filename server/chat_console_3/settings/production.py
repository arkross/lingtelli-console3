from chat_console_3.settings.common import *

DEBUG = False

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