'''Put any functional tool in here
'''
import base64, urllib, uuid
from datetime import datetime, timedelta, timezone
from Crypto.Cipher import AES

from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.core.mail import send_mail
from django.http import Http404
from rest_framework import exceptions
from rest_framework.views import exception_handler


from chat_console_3.settings.common import (URL_ENCODE_KEY, CONFIRM_DOMAIN,
                                            EMAIL_HOST_USER, TOKEN_DURATION)

from rest_framework.authtoken.models import Token
from faq.models import FAQGroup, Question, Answer
from chatbot.models import Chatbot, Line, Facebook


def url_encoder(data):
    '''Encode user's email and send as confirmation code

    Args:
        data: User's email address(Max length 32 long)
    Returns:
        encoded: User's encoded email address with key
    '''

    data = data.rjust(128) # Need to be multiple 16 in length
    cipher = AES.new(URL_ENCODE_KEY, AES.MODE_ECB) # never use ECB in strong systems obviously
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
        print('Decoded error: ' +  str(e))
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
    member_name = user.first_name if user.first_name else user.username
    confirm_email = CONFIRM_DOMAIN + \
        urllib.parse.quote_plus(str(acc_info.confirmation_code))+ '/'
    from_mail = EMAIL_HOST_USER
    html_email = render_to_string('email.html', 
                                  {'name': member_name, 
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

def key_validator(key_list, input_dict):
    '''Checking request key correctness

    Checking if the input amount is correct and the key name is correct

    Return:
        err_msg, valid_status
    '''

    if len(key_list) != len(input_dict):
        return 'Lack or more then the required key amount', False
    
    for k in key_list:
        if input_dict.get(k) == None:
            return 'Key missing or empty: ' + k, False
    return '', True

def check_token_expired(token):
    '''Check if the token has expired

    Return boolean.
    If expired return True else False
    '''

    if token == None:
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

def downgrade(user, new_paid_type):
    '''Pay type downgrading

    Delete oldest bots first. If faqs are still over upper limit,
    Delete oldest faqs.
    '''
    bot_limit = int(new_paid_type.bot_amount)
    faq_limit = int(new_paid_type.faq_amount)
    bots = Chatbot.objects.filter(user=user).order_by('id')
    bot_count = bots.count()
    try:
        if bot_count > bot_limit:
            the_amount = bot_count - bot_limit
            for i in range(the_amount):
                bots[0].delete()
    except Exception as e:
        print('Downgrade deleting bot failed: ', e)
        return False, '===== Downgrade deleting bot failed ====='

    bots_remain = Chatbot.objects.filter(user=user).order_by('id')
    total_faq = 0
    for bot in bots_remain:
        faq_count = FAQGroup.objects.filter(chatbot=bot).count()
        total_faq += faq_count
    try:
        if total_faq > faq_limit:
            for bot in bots_remain:
                faqs = FAQGroup.objects.filter(chatbot=bot).order_by('id')
                the_amout = total_faq - faq_limit
                for i in range(the_amout):
                    faqs[0].delete()
    except Exception as e:
        print('Downgrade deleting faq failed: ', e)
        return False, '===== Downgrade deleting faq failed ====='
    return True, ''