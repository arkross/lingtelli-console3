#!/usr/bin/env python
import os
import sys

if __name__ == '__main__':
    setting_file = 'chat_console_3.settings.common'
    if os.environ.get('ENV') == 'DEV':
        setting_file = 'chat_console_3.settings.development'
    elif os.environ.get('ENV') == 'PROD':
        setting_file = 'chat_console_3.settings.production'
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', setting_file)

    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)
