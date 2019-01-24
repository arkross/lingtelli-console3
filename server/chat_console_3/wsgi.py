"""
WSGI config for chat_console_3 project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/2.1/howto/deployment/wsgi/
"""

import os

from django.core.wsgi import get_wsgi_application

setting_file = 'chat_console_3.settings.common'
if os.environ.get('ENV') == 'DEV':
    setting_file = 'chat_console_3.settings.development'
elif os.environ.get('ENV') == 'PROD':
    setting_file = 'chat_console_3.settings.production'

os.environ.setdefault('DJANGO_SETTINGS_MODULE', setting_file)

application = get_wsgi_application()
