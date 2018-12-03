import json
from datetime import datetime, timedelta, timezone

from django.shortcuts import render
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.translation import gettext as _
from django.core.validators import EmailValidator
from django.contrib.auth import authenticate

from rest_framework import status, viewsets
from rest_framework.response import Response
from rest_framework.decorators import (api_view, authentication_classes,
                                       permission_classes)
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated, AllowAny

import chat_console_3.utils as utils
from account.serializers import MemberSerializer

from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token
from account.models import AccountInfo
from paidtype.models import PaidType

# MEMBER PART
@csrf_exempt
@api_view(['POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([AllowAny])
def member_login(request):
    '''Member login

    Can be login using member's account or agent's account

    Input format example:

    {
        "username": "Jack@gmail.com",
        "password": "thisispassword"
    }
    '''
    required_key = ['username', 'password']
    login_data = json.loads(request.body)
    for k in required_key:
        if not k in login_data:
            return \
                Response({'errors': 'Username and password cannot be empty'},
                         status=status.HTTP_400_BAD_REQUEST)

    username = login_data.get('username')
    password = login_data.get('password')

    user = None # Initial user object to None
    if not request.user.is_anonymous:
        # To check if user has logged in and tried to login again
        old_token_obj = Token.objects.filter(user=request.user).first()
        expired = utils.check_token_expired(old_token_obj)
        if expired == False:
            return Response({'errors': 'You have logged in.' +\
                            'Do not need to login again'},
                            status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.filter(username=username).first()
    if not user:
        return Response({'errors': 'User does not exist.' +\
                                   'Please register an account first.'},
                        status=status.HTTP_404_NOT_FOUND)

    user = authenticate(request, username=username, password=password)

    if user:
        old_token_obj = Token.objects.filter(user=user).first()
        expired = utils.check_token_expired(old_token_obj)
        if expired == True:
            new_token = utils.create_token_with_expire_time(user)
            if new_token:
                return \
                    Response({'success': new_token.key}, status=status.HTTP_200_OK)
            else:
                return Response({'errors': 'Something went wrong.'+\
                    'Please try again'}, status=status.HTTP_400_BAD_REQUEST)
        else:
            return Response({'success': old_token_obj.key},
                            status=status.HTTP_200_OK)
    else:
        return Response({'errors': 'Username or password is not correct'},
                         status=status.HTTP_403_FORBIDDEN) 

@csrf_exempt
@api_view(['GET'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def member_logout(request):
    user = request.user
    if not user:
        return Response({'errors': 'You have not logged in yet'}, 
                        status=status.HTTP_403_FORBIDDEN)
    Token.objects.filter(user=user).delete()
    return Response({'success': 'You have successfully logged out'},
                    status=status.HTTP_200_OK)


@csrf_exempt
@api_view(['POST'])
@authentication_classes([])
@permission_classes([])
def member_register(request):
    '''Member register

    For registering member only

    Input format example:

    {
        "username":"Jack@gmail.com",
        "password":"thisispassword",
        "first_name":"Jack_is_happy"
    }
    '''

    required_key = ['username', 'password', 'first_name']
    register_info = json.loads(request.body)
    err_msg, valid = utils.key_validator(required_key, register_info)
    if valid != True:
        return Response({'errors':_(err_msg)},
                        status=status.HTTP_400_BAD_REQUEST)
    user_email = register_info.get('username')
    email_validator = EmailValidator()
    try:
        email_validator(user_email)
    except:
        return Response({'errors':_('Invalid email address')},
                        status=status.HTTP_400_BAD_REQUEST)
    user = User.objects.filter(username=register_info.get("username")).first()
    if not user:
        user_create_obj = {}
        acc_create_obj = {}

        user_create_obj['username'] = register_info.get('username')
        user_create_obj['password'] = register_info.get('password')
        user_create_obj['first_name'] = register_info.get('first_name')
        user_create_obj['is_active'] = False
        user = User.objects.create_user(**user_create_obj)

        acc_create_obj['user'] = user
        acc_create_obj['paid_type'] = PaidType.objects.get(pk=1)
        acc_create_obj['confirmation_code'] = \
            utils.generate_confirmation_code(user)
        acc_create_obj['code_reset_time'] = \
            datetime.now(timezone.utc) + timedelta(minutes=30)  # Confirmation code expire after 30 minutes
        AccountInfo.objects.create(**acc_create_obj)
        send_successed = utils.send_confirmation_email(user, False)
        if send_successed:
            return Response({'success':_('User has successfully created. ' +\
                            'Please check email for account validation')},
                            status=status.HTTP_201_CREATED)
        else:
            return Response({'success':_('User has successfully created. ' +\
                        'Email sent failed. Please resend the email to validate ' +\
                        'the account')}, status=status.HTTP_201_CREATED)
    return Response({'errors':_('User name has existed')},
                        status=status.HTTP_403_FORBIDDEN)

@csrf_exempt
@api_view(['GET'])
@authentication_classes([])
@permission_classes([])
def resend_email(request):
    '''Resend the confrimation email if user has not got it

    Get method got parameters with:
    ?username=Jack@gmail.com
    '''

    username = request.GET.get('username')
    user = User.objects.filter(username=username).first()

    if not user:
        return Response({'errors':_('Please register an account first')},
                        status=status.HTTP_404_NOT_FOUND)
    if user.is_active and not user.email:
        return Response({'errors':_('Account has been confirmed. ' +\
                        'No need to get confirmation email again')},
                        status=status.HTTP_403_FORBIDDEN)

    # TODO: Logic errors here
    acc_info_obj = user.acc_user.first()
    if acc_info_obj.code_send_times > 3 and \
        datetime.now(timezone.utc) <= acc_info_obj.code_reset_time:
        time_delta = \
            (acc_info_obj.code_reset_time - \
             datetime.now(timezone.utc)).total_seconds()
        return Response({'errors':\
                        _('Please wait for a while to resend the code'),
                        'time': int(time_delta)},
                        status=status.HTTP_403_FORBIDDEN)
    if acc_info_obj.code_send_times > 3 and \
        datetime.now(timezone.utc) > acc_info_obj.code_reset_time:
        acc_info_obj.code_send_times = 1
        acc_info_obj.code_reset_time = datetime.now(timezone.utc) + \
                                       timedelta(minutes=30)
        acc_info_obj.save()

    if acc_info_obj.code_send_times <= 3 and \
        datetime.now(timezone.utc) > acc_info_obj.code_reset_time:
        acc_info_obj.code_reset_time = \
            datetime.now(timezone.utc) + timedelta(minutes=30)
        acc_info_obj.save()

    send_successed = utils.send_confirmation_email(user, False)

    if send_successed:
        return Response({'success':_('Confirmation email has been sent')},
                        status=status.HTTP_200_OK)
    return Response({'errors':_('Failed to send email')},
                    status=status.HTTP_400_BAD_REQUEST)


@csrf_exempt
@api_view(['POST'])
@authentication_classes([])
@permission_classes([])
def confirm_user(request):
    '''Confirm the email address

    From request data get key "code" data. Code data is encoded with user
    account and datetime by key.
    '''

    confirm_info = json.loads(request.body)
    data = confirm_info.get('code')
    username = utils.url_decoder(data)
    if username is False:
        return Response({'errors': _('Invalid code')},
                        status=status.HTTP_403_FORBIDDEN)
    user = User.objects.filter(username=username).first()

    if user:
        if user.is_active and not user.email:
            return Response({'errors':_('Account has been confirmed. ' +\
                            'No need to get confirmation email again')},
                            status=status.HTTP_400_BAD_REQUEST)
        elif user.is_active and user.email:
            user.username = user.email
            user.email = ""
            user.save()
            return Response({'success':_('User name has been changed')},
                            status=status.HTTP_200_OK)
        user.is_active = True
        user.save()
        return Response({'success':_('Account has been validated')},
                        status=status.HTTP_200_OK)

    return Response({'errors': _('Account validation failed')},
                    status=status.HTTP_400_BAD_REQUEST)


class MemberProfileViewset(viewsets.ModelViewSet):
    '''Member Profile Viewset

    Using RUD with member related data.

    Request format example:
    PUT:
    {
        "username": "thisisnewemail@test.com",
        "password": "thisisnewpassword",
        "first_name": "new nick name"
    }

    Response format example:
    GET:
    {
        "username": "testuser@test.com",
        "first_name": "nick name",
        "paid_type": "Trail",
        "start_date": "2010-10-10 00:00:00"
        "expire_date": "2012-10-10 00:00:00"
        "language": "tw"
    }
    '''
    authentication_classes = (TokenAuthentication)
    permission_classes = (IsAuthenticated,)
    queryset = User.objects.all()
    serializer_class = MemberSerializer
    pass


# AGENT PART