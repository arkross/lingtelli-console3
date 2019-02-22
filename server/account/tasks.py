from celery import task
from datetime import datetime, timedelta, timezone, date

from rest_framework.authtoken.models import Token

from account.models import AccountInfo
from paidtype.models import PaidType
from chatbot.models import Chatbot
from faq.models import FAQGroup

from chat_console_3.settings.common import TOKEN_DURATION
from chat_console_3 import utils

@task(name='delete_token')
def delete_expired_token():
    tokens = Token.objects.all()
    for token in tokens:
        delete = utils.check_token_expired(token)

@task(name='send_email_inform_expired')
def inform_expire():
    accounts = AccountInfo.objects.filter(expire_date__isnull=False)
    today_date = date.today()
    trial_obj = PaidType.objects.filter(name='Trial').first()
    for acc in accounts:
        e_date = acc.expire_date.date()
        delta_date = (e_date - today_date).days
        if delta_date == 30 or delta_date == 7:
            utils.send_task_downgrade_email(acc.user, acc, trial_obj)
        if delta_date < 0:
            utils.send_task_downgrade_email(acc.user, acc, trial_obj, True)
            utils.change_to_new_paidtype_limitation(acc.user, trial_obj)
            acc.delete_date = datetime.now(timezone.utc) + timedelta(days=15)
            acc.save()

@task(name='delete_over_15days')
def delete_over_15days_bots_faqs():
    accounts = AccountInfo.objects.filter(delete_date__isnull=False)
    today_date = date.today()
    trial_obj = PaidType.objects.filter(name='Trial').first()
    for acc in accounts:
        d_date = acc.delete_date.date()
        delta_date = (d_date - today_date).days
        if delta_date <= 0:
            Chatbot.objects.filter(user=acc.user, hide_status=True).delete()
            remain_bots = Chatbot.objects.filter(user=acc.user)
            for bot in remain_bots:
                FAQGroup.objects.filter(chatbot=bot, hide_status=True).delete()
            acc.delete_date = None
            acc.save()
