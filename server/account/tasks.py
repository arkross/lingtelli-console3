from celery import task
from datetime import datetime, timedelta, timezone

from rest_framework.authtoken.models import Token

from chat_console_3.settings.common import TOKEN_DURATION
from chat_console_3 import utils

@task(name='delete_token')
def delete_expired_token():
    tokens = Token.objects.all()
    for token in tokens:
        delete = utils.check_token_expired(token)
        
