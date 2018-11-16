'''Put any functional tool in here
'''
import base64, urllib
from datetime import datetime, timedelta
from Crypto.Cipher import AES

from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.core.mail import send_mail

from chat_console_3.settings.common import (URL_ENCODE_KEY, CONFIRM_DOMAIN,
                                            EMAIL_HOST_USER)


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
        user: User object.

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
    if len(key_list) != len(input_dict):
        return 'Lack or more then the required key amount', False
    
    for k in key_list:
        if not input_dict.get(k, None):
            return 'Key missing: ' + k, False
    return '', True