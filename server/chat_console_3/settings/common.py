"""
Django settings for chat_console_3 project.

Generated by 'django-admin startproject' using Django 2.1.3.

For more information on this file, see
https://docs.djangoproject.com/en/2.1/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/2.1/ref/settings/
"""

import os
from celery.schedules import crontab

# Build paths inside the project like this: os.path.join(BASE_DIR, ...)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/2.1/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'localtestingsecretkey'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = [
    '0.0.0.0',
    '127.0.0.1',
    '192.168.10.7',
    '192.168.10.10'
]

CORS_ORIGIN_ALLOW_ALL = False

CORS_ORIGIN_WHITELIST = (
    '0.0.0.0:8000',
    '127.0.0.1:8000',
    '192.168.10.10:3000',
)

CORS_ALLOW_METHODS = (
    'DELETE',
    'GET',
    'POST',
    'PUT',
    'OPTIONS',
)

# Application definition

INITIAL = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
]

THIRD_PARTY = [
    'corsheaders',
    'rest_framework',
    'rest_framework.authtoken',
]

OUR_APP =[
    'account',
    'chatbot',
    'thirdparty',
    'paidtype',
    'faq',
    'history',
    'report',
    'taskbot',
]

INSTALLED_APPS = INITIAL + THIRD_PARTY + OUR_APP

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

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        # Set the token parameter to Bearer
        'chat_console_3.middlewares.BearerTokenAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',

    ),
    'EXCEPTION_HANDLER': 'chat_console_3.utils.custom_exception_handler',
}

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.locale.LocaleMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'chat_console_3.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [
            os.path.join(BASE_DIR, 'templates').replace('\\','/')
        ],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'chat_console_3.wsgi.application'

# Password validation
# https://docs.djangoproject.com/en/2.1/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/2.1/topics/i18n/
LANGUAGE_CODE = 'en-us'
LANGUAGES = [
    ('en-us', 'English'),
    ('zh-hans', 'Simplify Chineses'),
    ('zh-hant', 'Traditional Chineses')
]
LOCALE_PATHS = [os.path.join(BASE_DIR, "locale")]

TIME_ZONE = 'Asia/Taipei'

USE_I18N = True

USE_L10N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/2.1/howto/static-files/

STATIC_URL = '/static/'

# Email confirmation related
EMAIL_USE_TLS = True
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_HOST_USER = 'contact@lingtelli.com'
EMAIL_HOST_PASSWORD = 'gong1si1mi4ma3'
EMAIL_PORT = 587
CONFIRM_URL_EXPIRE = 30 # Expires after 30 minutes
URL_ENCODE_KEY = 'FuckingChatbot!!' # Need to be length 16 long
CONFIRM_DOMAIN='http://127.0.0.1:3000/confirm/?code='

# Token related
TOKEN_DURATION = 10080 # Expires every week

# NLU related
NLU_HOST='http://192.168.10.16:8787/chatbot/'

# Iniital password for agent user
INIT_PASSWORD = 'test1234'

# Celery related settings
CELERY_BROKER_URL = 'redis://localhost:6379'

CELERY_BEAT_SCHEDULE = {
    'check_token_expired_every_minutes': {
        'task': 'delete_token',
        'schedule': crontab()
    },
    'send_email_when_expire': {
        'task': 'send_email_inform_expired',
        'schedule': crontab(minute=0, hour=0)
    },
    'delete_over_15days_hidden_data': {
        'task': 'delete_over_15days',
        'schedule': crontab(minute=0, hour=0)
    }
}