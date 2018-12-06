'''Put any functional tool in here
'''
import base64, urllib
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


def url_encoder(data):
    '''Encode user's email and send as confirmation code

    Args:
        data: User's email address(Max length 32 long)
    Returns:
        encoded: User's encoded email address with key
    '''

    data = data.rjust(64) # Need to be multiple 16 in length
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
    '''

    if len(key_list) != len(input_dict):
        return 'Lack or more then the required key amount', False
    
    for k in key_list:
        if not input_dict.get(k, None):
            return 'Key missing: ' + k, False
    return '', True

def value_not_empty_validator(key_list, input_dict):
    '''Given key's value cannot be empty
    '''

    for k in key_list:
        if input_dict.get(k, None):
            continue
        if input_dict.get(k) == '' or input_dict.get(k) == []:
            return 'Value empty: ' + k, False
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