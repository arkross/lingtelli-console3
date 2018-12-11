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
                                       permission_classes, action)
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
                                   'Please register an account first'},
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
                return Response({'errors': 'Something went wrong'+\
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
    register_data = json.loads(request.body)
    err_msg, valid = utils.key_validator(required_key, register_data)
    if valid != True:
        return Response({'errors':_(err_msg)},
                        status=status.HTTP_400_BAD_REQUEST)
    user_email = register_data.get('username')
    email_validator = EmailValidator()
    try:
        email_validator(user_email)
    except:
        return Response({'errors':_('Invalid email address')},
                        status=status.HTTP_400_BAD_REQUEST)
    user = User.objects.filter(username=register_data.get("username")).first()
    if not user:
        user_create_obj = {}
        acc_create_obj = {}

        user_create_obj['username'] = register_data.get('username')
        user_create_obj['password'] = register_data.get('password')
        user_create_obj['first_name'] = register_data.get('first_name')
        user_create_obj['is_active'] = False
        user = User.objects.create_user(**user_create_obj)

        trail_obj = PaidType.objects.get(pk=1)
        acc_create_obj['user'] = user
        acc_create_obj['paid_type'] = trail_obj
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

    detail_route: 
        delete_confirm

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
    authentication_classes = (TokenAuthentication,)
    permission_classes = (IsAuthenticated,)
    queryset = User.objects.all()
    serializer_class = MemberSerializer

    def get_queryset(self):
        user = self.request.user
        return User.objects.filter(id=user.id)

    def update(self, request, pk=None):
        '''Update user data

        Username: Need to logout user and send confirmation email
        Password: Need to logout user
        First_name, Language: Just update directly
        '''
        # To check if request body is empty
        if request.body:
            # Prevent from user updating other user's profile
            if request.user.id != int(pk):
                return Response({'errors':_('Not found')},
                                status=status.HTTP_404_NOT_FOUND)
            update_data = json.loads(request.body)
            user_obj = request.user
            # Update username
            if update_data.get('username') and update_data.get('username') != '':
                new_email = update_data.get('username')
                email_validator = EmailValidator()
                try:
                    email_validator(new_email)
                except:
                    return Response({'errors':_('Invalid email address')},
                                    status=status.HTTP_400_BAD_REQUEST)
                same_user = User.objects.filter(username=new_email)
                if same_user:
                    return Response({'errors':_('Username has existed.' +\
                                    'Please use other one')},
                                    status=status.HTTP_400_BAD_REQUEST)
                user_obj.email = new_email
                user_obj.save()
                send_status = utils.send_confirmation_email(user_obj, True)
                if not send_status:
                    return \
                        Response({'errors':_('Sending confirmation email failed')},
                                status=status.HTTP_400_BAD_REQUEST)

                user_obj.is_active = False
                user_obj.username = user_obj.email
                user_obj.email = ''
                user_obj.save()
                Token.objects.filter(user=user_obj).delete()
                return Response({'success':_('Confirmation email has sent.' +\
                                'Please check your mailbox and login again')},
                                status=status.HTTP_200_OK)

            # Update password
            if update_data.get('password') and update_data.get('password') != '':
                if not update_data.get('old_password') or\
                    update_data.get('old_password') == '':
                    return Response({'errors':_('Old password cannot be empty')},
                                    status=status.HTTP_400_BAD_REQUEST)
                passwd = update_data.get('password')
                old_passwd = update_data.get('old_password')
                if not user_obj.check_password(old_passwd):
                    return Response({'errors':_('Old password is not correct')},
                                    status=status.HTTP_403_FORBIDDEN)
                user_obj.set_password(passwd)
                user_obj.save()
                Token.objects.filter(user=user_obj).delete()
                return Response({'success':_('Password has updated.' +\
                                'Please login again')}, status=status.HTTP_200_OK)

            # Update first_name
            if update_data.get('first_name'):
                user_obj.first_name = update_data.get('first_name')
                user_obj.save()

            # Update language
            if update_data.get('language'):
                acc_obj = AccountInfo.objects.filter(user=user_obj).first()
                acc_obj.language = update_data.get('language')
                acc_obj.save()
            elif update_data.get('language') == '': # Cannot be empty
                return Response({'errors':_('Please select one language')},
                                    status=status.HTTP_400_BAD_REQUEST)

            return Response({'success':_('Update successed')},
                            status=status.HTTP_200_OK)

        return Response({'errors':_('No content')},
                         status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, pk=None):
        if request.user.id != int(pk):
            return Response({'errors':_('Not found')},
                                status=status.HTTP_404_NOT_FOUND)
        user_obj = request.user
        acc_obj = AccountInfo.objects.filter(user=user_obj).first()
        if acc_obj.delete_confirm != True:
            return Response({'errors':_('Please confirm the deletion first')},
                            status=status.HTTP_403_FORBIDDEN)
        user_obj.delete()
        check_user_deleted = User.objects.filter(id=user_obj.id).first()
        if check_user_deleted:
            acc_obj.delete_confirm = False
            acc_obj.save()
            return Response({'errors':_('Deleting account failed')},
                             status=status.HTTP_400_BAD_REQUEST)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(methods=['put'], detail=True, permission_classes=[IsAuthenticated])
    def delete_confirm(self, request, pk=None):
        '''Delete account confirmation

        Before deleting the account, ask user to confirm the action

        detail:
            True means having {lookup} pk in url. False the other way around.
        '''

        # TODO: Need to check if the account has really been deleted. 
        # If not should add a task to check and set delete_confirm back to 
        # False
        if request.body:
            if request.user.id != int(pk):
                return Response({'errors':_('Not found')},
                                status=status.HTTP_404_NOT_FOUND)

            request_data = json.loads(request.body)
            user_obj = request.user
            if not request_data.get('password'):
                return Response({'errors':_('Please enter the password')},
                                status=status.HTTP_400_BAD_REQUEST)
            if user_obj.check_password(request_data.get('password')):
                acc_obj = AccountInfo.objects.filter(user=user_obj).first()
                acc_obj.delete_confirm = True
                acc_obj.save()
                return Response({'success':_('Delete confirmed')},
                                status=status.HTTP_200_OK)
            return Response({'errors':_('Password is not correct')},
                            status=status.HTTP_403_FORBIDDEN)
        return Response({'errors':_('No content')},
                        status=status.HTTP_400_BAD_REQUEST)



# AGENT PART