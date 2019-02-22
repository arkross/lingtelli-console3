from __future__ import absolute_import, unicode_literals
import os

from celery import Celery

# set the default Django settings module for the 'celery' program.
setting_file = 'chat_console_3.settings.common'
if os.environ.get('ENV') == 'DEV':
    setting_file = 'chat_console_3.settings.development'
elif os.environ.get('ENV') == 'PROD':
    setting_file = 'chat_console_3.settings.production'

os.environ.setdefault('DJANGO_SETTINGS_MODULE', setting_file)

app = Celery('chat_console_3')

# Using a string here means the worker doesn't have to serialize
# the configuration object to child processes.
# - namespace='CELERY' means all celery-related configuration keys
#   should have a `CELERY_` prefix.
app.config_from_object('django.conf:settings', namespace='CELERY')

# Load task modules from all registered Django app configs.
app.autodiscover_tasks()

@app.task(bind=True)
def debug_task(self):
    print('Request: {0!r}'.format(self.request))
