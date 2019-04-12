'''Put any functional tool in here
'''
import base64
import urllib
import uuid
import os
import zlib
import zipfile
import io
import csv
from datetime import datetime, timedelta, timezone, date
from Crypto.Cipher import AES

from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.core.mail import send_mail, EmailMultiAlternatives
from django.http import Http404
from rest_framework import exceptions
from rest_framework.views import exception_handler
from rest_framework.authtoken.models import Token
from account.models import AccountInfo
from faq.models import FAQGroup, Question, Answer
from chatbot.models import Chatbot, Line, Facebook, BotThirdPartyGroup

env = os.environ.get('ENV')
if env:
    if env == 'DEV':
        from chat_console_3.settings.development import (URL_ENCODE_KEY,
                                                         CONFIRM_DOMAIN,
                                                         EMAIL_HOST_USER,
                                                         TOKEN_DURATION)
    else:
        from chat_console_3.settings.production import (URL_ENCODE_KEY,
                                                        CONFIRM_DOMAIN,
                                                        EMAIL_HOST_USER,
                                                        TOKEN_DURATION)
else:
    from chat_console_3.settings.common import (URL_ENCODE_KEY,
                                                CONFIRM_DOMAIN,
                                                EMAIL_HOST_USER,
                                                TOKEN_DURATION)


def url_encoder(data):
    '''Encode user's email and send as confirmation code

    Args:
        data: User's email address(Max length 32 long)
    Returns:
        encoded: User's encoded email address with key
    '''

    data = data.rjust(128)  # Need to be multiple 16 in length
    # never use ECB in strong systems obviously
    cipher = AES.new(URL_ENCODE_KEY, AES.MODE_ECB)
    encrypt_data = (cipher.encrypt(data))
    encoded = base64.b64encode(encrypt_data)
    return encoded.decode("utf-8")


def url_decoder(encoded):
    '''Decoded user's encoded email address

    Args:
        encoded: Encoded user's email address
    Returns:
        decoded: User's email address plan text
    '''

    cipher = AES.new(URL_ENCODE_KEY, AES.MODE_ECB)
    try:
        decoded = cipher.decrypt(base64.b64decode(encoded))
    except Exception as e:
        print('Decoded error: ' + str(e))
        return False
    decoded = decoded.decode("utf-8")
    return decoded.strip().split(',')[0]


def generate_confirmation_code(user):
    '''Generate confirmation code with key

    Args:
        user: User object.

    Returns:
        Encoded user cofirmation code.
    '''

    confirmation_code_data = user.username + ',' + str(datetime.now())
    encoded = url_encoder(confirmation_code_data)
    return encoded


def send_confirmation_email(user, update_user):
    '''Send email process

    Args:
        user:
            User object.
        update_user:
            Bool. Update username with new email.
    Returns:
        False: If sent email failed.
        True: If sent email successed.
    '''

    acc_info = user.acc_user.first()
    subject = 'Lingtelli Account Confirmation Email'
    the_email = 'email.html'
    if acc_info.language == 'tw':
        subject = '語智網帳號驗證'
        the_email = 'email_tw.html'
    elif acc_info.language == 'cn':
        subject = '语智网帐号验证'
        the_email = 'email_cn.html'
    member_name = user.first_name if user.first_name else user.username
    confirm_email = CONFIRM_DOMAIN + \
        urllib.parse.quote_plus(str(acc_info.confirmation_code)) + '/'
    from_mail = EMAIL_HOST_USER
    html_email = render_to_string(the_email, {'name': member_name,
                                              'confirm_email': confirm_email})
    txt_email = strip_tags(html_email)
    if update_user:
        to_mail = user.email
    else:
        to_mail = user.username
    try:
        send_mail(subject, txt_email, from_mail, [to_mail],
                  fail_silently=False, html_message=html_email)
    except Exception as e:
        print('Sending email failed: ' + str(e))
        return False
    acc_info.code_send_times = acc_info.code_send_times + 1
    acc_info.save()
    return True


def send_reset_email(user, new_password):
    '''Send email when member forgot password and reset the password

    Will randomly generate a code for user to login
    '''
    acc_info = user.acc_user.first()
    subject = 'Lingtelli Reset Password Email'
    the_email = 'reset.html'
    if acc_info.language == 'tw':
        subject = '語智網密碼重設'
        the_email = 'reset_tw.html'
    elif acc_info.language == 'cn':
        subject = '语智网密码重设'
        the_email = 'reset_cn.html'
    member_name = user.first_name if user.first_name else user.username
    from_mail = EMAIL_HOST_USER
    html_email = render_to_string(the_email, {'name': member_name,
                                              'new_password': new_password})
    txt_email = strip_tags(html_email)
    to_mail = user.username
    try:
        send_mail(subject, txt_email, from_mail, [to_mail],
                  fail_silently=False, html_message=html_email)
    except Exception as err:
        print('Send email failed: ' + str(err))
        return False
    return True


def key_validator(key_list, input_dict):
    '''Checking request key correctness

    Checking if the input amount is correct and the key name is correct

    Return:
        err_msg, valid_status
    '''

    if len(key_list) != len(input_dict):
        return 'Lack or more then the required key amount', False

    for k in key_list:
        if input_dict.get(k) is None:
            return 'Key missing or empty: ' + k, False
    return '', True


def check_token_expired(token):
    '''Check if the token has expired

    Return boolean.
    If expired return True else False
    '''

    if token is None:
        return True
    if token.created + timedelta(minutes=TOKEN_DURATION) \
       > datetime.now(timezone.utc):
        return False
    token.delete()
    return True


def create_token_with_expire_time(user):
    '''Create the token with specified time

    Make sure the time is using the same base of utc time
    '''

    token_data = {'user': user, 'created': datetime.now(timezone.utc)}
    new_token = Token.objects.create(**token_data)
    return new_token


def custom_exception_handler(exc, context):
    '''Customized exception response data

    Modified exceptions:
    Http404, status_code==401
    '''
    # Get original exception data
    response = exception_handler(exc, context)

    if isinstance(exc, Http404):
        custom_response_data = {'errors': 'Not found'}
        response.data = custom_response_data
    if response:
        if response.status_code == 401:
            custom_response_data = {'errors': 'Please login first'}
            response.data = custom_response_data
        elif response.status_code == 403:
            custom_response_data = {'errors': 'You do not have the permission'}
            response.data = custom_response_data
    return response


def transfer_paidtype_duration_to_time(paid_obj):
    '''Transfer the paidtype duration to time object

    Unit meaning:
        0: unlimited
        y: year
        m: month
        d: day
    '''
    duration = paid_obj.duration
    count, the_unit = duration.split('_')
    if the_unit == 'y':
        total_days = count * 365
        return timedelta(days=total_days)
    if the_unit == 'm':
        total_days = count * 30
        return timedelta(days=total_days)
    if the_unit == 'd':
        return timedelta(days=count)
    return None


def generate_uuid(s_1, s_2):
    '''Generate uuid

    Creating the vender id when creating a new chatbot.

    Args:
        s_1: The id of the chatbot.
        s_2: The name of the chatbot.

    Returns:
        Vender id for the chatbot.
    '''

    combine_str = s_1 + s_2
    return uuid.uuid3(uuid.NAMESPACE_DNS, combine_str)


def check_upload_file_type(upload_file):
        '''Deal with both utf-8 and big5 files
        '''
        file_result = None

        try:
            file_result = upload_file.decode('utf-8-sig')
        except:
            print('====WARNING====: The upload file is not utf8')

        if not file_result:
            try:
                file_result = upload_file.decode('big5')
            except:
                print('====WARNING====: The upload file is not big5')
        return file_result


def delete_create_failed_model(create_status, chatbot_obj):
    ''' Delete related model when created failed

    When chat-console created chatbot failed or NLU server created model
    failed, delete all the related objects.

    Args:
        create_status(BOOLEAN): NLU model created succeeful or not.
        chatbot_obj: Chatbot object.

    Returns:
        Created successed: Chatbot object.
        Created failed: None
    '''

    create_obj = chatbot_obj
    if not create_status:
        FAQGroup.objects.filter(chatbot=chatbot_obj).delete()
        Question.objects.filter(chatbot=chatbot_obj).delete()
        Answer.objects.filter(chatbot=chatbot_obj).delete()
        Line.objects.filter(chatbot=chatbot_obj).delete()
        Facebook.objects.filter(chatbot=chatbot_obj).delete()
        chatbot_obj.delete()
        create_obj = None
    return create_obj


def get_all_bots_faqs(user):
    bots = Chatbot.objects.filter(user=user)
    zip_file = io.BytesIO()
    zip_obj = zipfile.ZipFile(zip_file, 'w')
    for bot in bots:
        faqgroups = FAQGroup.objects.filter(chatbot=bot)
        rows = [['Group', 'Question', 'Answer']]
        for faqgroup in faqgroups:
            answers = Answer.objects.filter(group=faqgroup).order_by('-id')
            questions = Question.objects.filter(group=faqgroup).order_by('-id')
            if len(answers) >= len(questions):
                for a in range(len(answers)):
                    ans = answers[a].content
                    que = ''
                    if a < len(questions):
                        que = questions[a].content
                    rows.append([str(faqgroup.csv_group), que, ans])
            else:
                for q in range(len(questions)):
                    que = questions[q].content
                    ans = ''
                    if q < len(answers):
                        ans = answers[q].content
                    rows.append([str(faqgroup.csv_group), que, ans])
        csv_file = io.StringIO()
        writer = csv.writer(csv_file, delimiter=',', dialect='excel')
        for row in rows:
            writer.writerow(row)
        try:
            file_name = bot.robot_name + '.csv'
            zip_obj.writestr(file_name,
                             csv_file.getvalue().encode('utf-8-sig'))
        except Exception as e:
            print('Compress file error: ', str(e))
        finally:
            csv_file.close()
    zip_obj.close()
    return zip_file


def set_bot_faq_to_hidden(user):
    '''Initial all bots and faqs to hidden

    For changing to other type, this is easier to check the status for bot
    and faq
    '''

    bots = Chatbot.objects.filter(user=user)
    for bot in bots:
        bot.hide_status = True
        FAQGroup.objects.filter(chatbot=bot).update(hide_status=True)
        bot.save()


def setup_all_bots_thirdparty_user(user, new_paid_type):
    '''Setup the new thirdparty for all existing bots under one user
    '''

    bots = Chatbot.objects.filter(user=user)
    allow_third_party = new_paid_type.third_party.all()
    for bot in bots:
        BotThirdPartyGroup.objects.filter(chatbot=bot).delete()
        for party in allow_third_party:
            BotThirdPartyGroup.objects.create(chatbot=bot, third_party=party)


def reset_all_bots_thirdparty(updated_paidtype):
    '''Update all bots' thirdparty under user has the updated paidtype
    '''

    accs = AccountInfo.objects.filter(paid_type=updated_paidtype)
    for acc in accs:
        setup_all_bots_thirdparty_user(acc.user, updated_paidtype)


def change_to_new_paidtype_limitation(user, new_paid_type, to_delete=False):
    '''Update the bots and faqs based on paidtype
    '''
    # Initial all the hide_status to hidden
    set_bot_faq_to_hidden(user)

    bot_limit = int(new_paid_type.bot_amount)
    faq_limit = int(new_paid_type.faq_amount)
    # Unlimited bots
    if bot_limit == 0:
        bots = Chatbot.objects.filter(user=user).update(hide_status=False)
    # Unlimited faqs
    if faq_limit == 0:
        bots = Chatbot.objects.filter(user=user, hide_status=False)
        for bot in bots:
            FAQGroup.objects.filter(chatbot=bot).update(hide_status=False)
    if bot_limit != 0:
        bots = Chatbot.objects.filter(user=user).order_by('-id')
        bot_count = 0
        for bot in bots:
            if bot_count > len(bots):
                break
            if bot_count < bot_limit:
                bot.hide_status = False
                bot.save()
                bot_count += 1
        if to_delete:
            bots.filter(hide_status=True).delete()
    if faq_limit != 0:
        bots = Chatbot.objects.filter(user=user, hide_status=False).\
                order_by('-id')
        faq_total_count = 0
        for bot in bots:
            faqs = FAQGroup.objects.filter(chatbot=bot).order_by('-id')
            for faq in faqs:
                faq_count = 0
                if faq_count > len(faqs):
                    break
                if faq_total_count < faq_limit:
                    faq.hide_status = False
                    faq.save()
                    faq_total_count += 1
                    faq_count += 1
            if to_delete:
                faqs.filter(hide_status=True).delete()
    # Setup thirdparty for the remaining bots
    setup_all_bots_thirdparty_user(user, new_paid_type)


def send_task_downgrade_email(user, acc, new_paidtype, to_send_file=False):
    '''Send email to inform user's paidtype is going to change

    Send only inform email when it's 30 days and 7 days remaining.
    Send with attachment when it's expired.
    '''
    if acc.expire_date:
        to_mail = user.username
        from_mail = EMAIL_HOST_USER
        if not to_send_file:
            subject = 'Account Type Changed Inform Email'
            the_email = 'change_type_inform.html'
            if acc.language == 'tw':
                subject = '方案即將過期通知'
                the_email = 'change_type_inform_tw.html'
            elif acc.language == 'cn':
                subject = '方案即将过期通知'
                the_email = 'change_type_inform_cn.html'
            member_name = user.first_name if user.first_name else user.username
            delta_days = (acc.expire_date.date() - date.today()).days
            html_email = \
                render_to_string(the_email,
                                 {'name': member_name,
                                  'acc_type': acc.paid_type.name,
                                  'new_acc_type': new_paidtype.name,
                                  'bot_amount': new_paidtype.bot_amount,
                                  'faq_total': new_paidtype.faq_amount,
                                  'remain_days': delta_days,
                                  'expire_date': acc.expire_date.date()})
            txt_email = strip_tags(html_email)
            try:
                send_mail(subject, txt_email, from_mail, [to_mail],
                          fail_silently=False, html_message=html_email)
            except Exception as e:
                print('Sending inform email failed: ' + str(e))
        else:
            today_date = str(date.today())
            subject = 'Account Expired Inform Email'
            the_email = 'expired_inform.html'
            zip_name = 'FAQ Files Backup-' + today_date + '.zip'
            if acc.language == 'tw':
                subject = '方案過期通知'
                the_email = 'expired_inform_tw.html'
                zip_name = '問題集備份-' + today_date + '.zip'
            elif acc.language == 'cn':
                subject = '方案过期通知'
                the_email = 'expired_inform_cn.html'
                zip_name = '问题集备份-' + today_date + '.zip'
            expire_email = \
                render_to_string(the_email,
                                 {'name': member_name,
                                  'acc_type': acc.paid_type.name,
                                  'bot_amount': new_paidtype.bot_amount,
                                  'faq_total': new_paidtype.faq_amount})
            txt_email = strip_tags(expire_email)
            msg = EmailMultiAlternatives(subject, txt_email, from_mail,
                                         [to_mail])
            msg.attach_alternative(expire_email, 'text/html')
            compress_file = get_all_bots_faqs(user)
            msg.attach(zip_name, compress_file.getvalue(), 'application/zip')
            try:
                msg.send()
            except Exception as e:
                print('Sending inform mail with file failed: ' + str(e))
