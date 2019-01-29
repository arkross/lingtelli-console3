from celery import task
from datetime import datetime, timedelta, timezone

from account.models import AccountInfo
from chatbot.models import Chatbot

# @task(name='paidtype_expire')
# def check_paidtype_expired_update_bot():
#     accounts = AccountInfo.objects.all()
#     for acc in accounts:
        
