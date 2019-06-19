import json
from django.shortcuts import render
from django.utils.translation import gettext as _
from django.contrib.auth.models import User
from rest_framework import viewsets
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.status import (
    HTTP_200_OK,
    HTTP_201_CREATED,
    HTTP_204_NO_CONTENT,
    HTTP_400_BAD_REQUEST,
    HTTP_403_FORBIDDEN,
    HTTP_404_NOT_FOUND
)
from chat_console_3 import utils, nlumodel
from chatbot.serilalizers import ChatbotSerializer
from chatbot.models import Chatbot, Line, Facebook, BotThirdPartyGroup
from account.models import AccountInfo

class TaskbotViewset(viewsets.ModelViewSet):
    '''Taskbot

    Only agent can create taskbot and asign to users
    '''

    authentication_classes = (TokenAuthentication,)
    permission_classes = (IsAuthenticated, IsAdminUser,)
    queryset = Chatbot.objects.filter(bot_type='TASK')
    serializer_class = ChatbotSerializer

    def get_queryset(self):
        user_obj = self.request.user
        return self.queryset.filter(user=user_obj)

    def create(self, request):
        if request.body:
            user_obj = request.user
            acc_obj = AccountInfo.objects.filter(user=user_obj).first()
            bot_data = json.loads(request.body)
            bot_keys = ['robot_name', 'greeting_msg', 'failed_msg',
                        'postback_title', 'language']
            err_msg, key_status = utils.key_validator(bot_keys, bot_data)
            if not key_status:
                return Response({'errors':_(err_msg)},
                                status=HTTP_403_FORBIDDEN)
            bot_data['user_id'] = user_obj.id
            bot_data['bot_type'] = 'TASK'
            bot_obj = Chatbot.objects.create(**bot_data)
            if bot_obj:
                bot_obj.vendor_id = utils.generate_uuid(str(bot_obj.id),
                                                            bot_obj.robot_name)
                paid_type = acc_obj.paid_type
                for party in paid_type.third_party.all():
                    BotThirdPartyGroup.objects.create(chatbot=bot_obj,
                                                        third_party=party)
                bot_obj.save()
                Line.objects.create(chatbot=bot_obj)
                Facebook.objects.create(chatbot=bot_obj)
                nlumodel.initial_question_answer(bot_obj)
                # TODO: Remove this when NLU is working fine
                nlu_create_status, err_msg = nlumodel.create_model(bot_obj)
                # create_bot_obj = bot_obj
                create_bot_obj = \
                    utils.delete_create_failed_model(nlu_create_status,
                                                     bot_obj)
                if not create_bot_obj:
                    return Response({'errors':_('Create bot failed. '+\
                                     'Cause by NLU error.' + err_msg)},
                                    status=HTTP_400_BAD_REQUEST)
                res = {}
                res['id'] = create_bot_obj.id
                res['robot_name'] = create_bot_obj.robot_name
                return Response(res, status=HTTP_201_CREATED)
            return Response({'errors':_('Create bot failed')},
                            status=HTTP_400_BAD_REQUEST)
        return Response({'errors':_('No content')},
                        status=HTTP_400_BAD_REQUEST)

    def update(self, request, pk=None):
        if request.body:
            user_obj = request.user
            bot_obj = \
                Chatbot.objects.filter(id=pk, user=user_obj).first()
            if not bot_obj:
                return Response({'errors':_('Not found')},
                                 status=HTTP_404_NOT_FOUND)
            update_data = json.loads(request.body)
            valid_update_key = ['robot_name', 'greeting_msg', 'failed_msg',
                                'postback_title', 'postback_activate',
                                'assign_user', 'activate']
            not_null = 'robot_name'
            if not update_data.get(not_null):
                return \
                    Response({'errors':_('Key missing or empty: robot_name')},
                             status=HTTP_403_FORBIDDEN)

            for k in valid_update_key:
                if k == 'assign_user':
                    mem_obj = \
                        User.objects.filter(id=update_data.get(k)).first()
                    bot_obj.assign_user = mem_obj
                    continue
                if update_data.get(k, None):
                    setattr(bot_obj, k, update_data.get(k))

            bot_obj.save()
            return Response({'success':_('Update succeeded')},
                            status=HTTP_200_OK)
        return Response({'errors':_('No content')},
                        status=HTTP_400_BAD_REQUEST)

    def destroy(self, request, pk=None):
        '''Delete taskbot

        Need to check if delete_confirm has become True first
        '''
        user_obj = request.user
        bot_obj = Chatbot.objects.filter(id=pk, user=user_obj).first()
        if not bot_obj:
            return Response({'errors':_('Not found')},
                             status=HTTP_404_NOT_FOUND)
        if not bot_obj.delete_confirm:
            return Response({'errors':_('Please confirm the deletion first')},
                            status=HTTP_403_FORBIDDEN)
        nlumodel.delete_model(bot_obj)
        bot_obj.delete()
        check_bot_delete = Chatbot.objects.filter(id=pk, user=user_obj).first()
        if check_bot_delete:
            check_bot_delete.delete_confirm = False
            check_bot_delete.save()
            return Response({'errors':_('Deleting bot failed')},
                            status=HTTP_400_BAD_REQUEST)
        return Response(status=HTTP_204_NO_CONTENT)

    @action(methods=['put'], detail=True,
            permission_classes=[IsAuthenticated, IsAdminUser])
    def delete_confirm(self, request, pk=None):
        '''Chatbot delete confirmation

        Request format example:
        PUT:
        {
            "password": "thisisyourpassword"
        }
        '''
        if request.body:
            user_obj = request.user
            bot_obj = Chatbot.objects.filter(id=pk, user=user_obj).first()
            if not bot_obj:
                return Response({'errors':_('Not found')},
                                status=HTTP_404_NOT_FOUND)
            request_data = json.loads(request.body)
            if not request_data.get('password'):
                return Response({'errors':_('Please enter the password')},
                                status=HTTP_400_BAD_REQUEST)
            if user_obj.check_password(request_data.get('password')):
                bot_obj.delete_confirm = True
                bot_obj.save()
                return Response({'success':_('Delete confirmed')},
                                status=HTTP_200_OK)
            return Response({'errors':_('Password is not correct')},
                            status=HTTP_403_FORBIDDEN)
        return Response({'errors':_('No content')},
                        status=HTTP_400_BAD_REQUEST)


