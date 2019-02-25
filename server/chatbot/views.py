import json
from django.shortcuts import render
from django.utils.translation import gettext as _
from django.db.models import Q
from rest_framework import viewsets
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.mixins import (RetrieveModelMixin, ListModelMixin,
                                   UpdateModelMixin)
from rest_framework.status import (
    HTTP_200_OK,
    HTTP_201_CREATED,
    HTTP_204_NO_CONTENT,
    HTTP_400_BAD_REQUEST,
    HTTP_403_FORBIDDEN,
    HTTP_404_NOT_FOUND
)
from chat_console_3 import utils, nlumodel

from .serilalizers import ChatbotSerializer, LineSerializer, FacebookSerializer

from .models import Chatbot, Line, Facebook, BotThirdPartyGroup
from account.models import AccountInfo
from faq.models import FAQGroup, Answer, Question
from thirdparty.models import ThirdParty

class ChatbotViewset(viewsets.ModelViewSet):
    '''Chatbot viewset

    Using CRUD with chatbot related data

    detail_route:
        delete_confirm 
    
    Request format example:
    POST
    {
        "robot_name": "Jarvis",
        "greeting_msg": "hi",
        "failed_msg": "I do not understand",
        "postback_title": "Please chose the similar questoin",
        "language": "tw"
    }
    PUT
    {
        "robot_name": "Jarvis",
        "greeting_msg": "hi",
        "failed_msg": "I do not understand",
        "postback_title": "Please chose the similar questoin",
        "postback_activate": false
    }

    Response format example:
    GET(List)
    {
        "id": 1,
        "robot_name": "Jarvis"
    }

    GET(Retrieve)
    {
        "id": 1,
        "robot_name": "Jarvis",
        "greeting_msg": "hi",
        "failed_msg": "I do not understand",
        "postback_title": "Please chose the similar questoin",
        "created_at": "2017-10-10 00:00:00",
        "updated_at": "2017-12-12 00:00:00",
        "vendor_id": "thisisvendorid",
        "postback_activate": False,
        "delete_confirm": False,
        "bot_type": "NORMAL",
        "assign_user": None,
        "activate": True,
        "language": "tw",
        "third_party": [2,3],
        "user": 2
    }
    '''
    
    authentication_classes = (TokenAuthentication,)
    permission_classes = (IsAuthenticated,)
    queryset = Chatbot.objects.all()
    serializer_class = ChatbotSerializer

    def get_queryset(self):
        user_obj = self.request.user
        return self.queryset.filter(Q(user=user_obj) | Q(assign_user=user_obj),
                                    hide_status=False,)

    def create(self, request):
        '''Create chatbot

        Steps:
            1. Check if the chatbot amount is over the limitation. If the
                limitation is 0 means the user has unlimited amount.
            2. Check if chatbot required keys are provided
            3. Assign the thirdparty demo to the bot with trail paidtype
            4. Create the bot and make sure NLU trains model succeed. If not,
                delete the whole chatbot.
        '''
        if request.body:
            user_obj = request.user
            acc_obj = AccountInfo.objects.filter(user=user_obj).first()
            # Check if bot creation is over upper limit
            bot_create_limit = acc_obj.paid_type.bot_amount
            bot_owned_amount = \
                Chatbot.objects.filter(user=user_obj,
                                       hide_status=False).count()
            if acc_obj.paid_type.user_type != 'S' and\
                bot_owned_amount >= int(bot_create_limit):
                return Response({'errors':_('Reach bot create limitation')},
                                 status=HTTP_403_FORBIDDEN)

            # Check if faq creation is over upper limit
            faq_create_limit = acc_obj.paid_type.faq_amount
            faq_owned_amount = 0
            bots = Chatbot.objects.filter(user=user_obj, hide_status=False)
            for bot in bots:
                faq_count = FAQGroup.objects.filter(chatbot=bot).count()
                faq_owned_amount += faq_count
            if acc_obj.paid_type.user_type != 'S' and\
                (faq_owned_amount + 1) >= int(faq_create_limit):
                return Response({'errors':_('Reach faq create limitation')},
                                 status=HTTP_403_FORBIDDEN)

            bot_data = json.loads(request.body)
            bot_keys = ['robot_name', 'greeting_msg', 'failed_msg',
                        'postback_title', 'language']
            err_msg, key_status = utils.key_validator(bot_keys, bot_data)
            if not key_status:
                return Response({'errors':_(err_msg)},
                                status=HTTP_403_FORBIDDEN)
            bot_data['user_id'] = user_obj.id
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
                nlu_create_status, err_msg = nlumodel.create_model(bot_obj)
                # TODO: Remove this comment after the NLU has setup
                # TODO: Remove create_bot_obj = bot_obj
                create_bot_obj = \
                    utils.delete_create_failed_model(nlu_create_status,
                                                     bot_obj)
                # create_bot_obj = bot_obj
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
                Chatbot.objects.filter(Q(user=user_obj) |
                                       Q(assign_user=user_obj),
                                       id=pk, hide_status=False,).first()
            if not bot_obj:
                return Response({'errors':_('Not found')},
                                 status=HTTP_404_NOT_FOUND)
            update_data = json.loads(request.body)
            valid_update_key = ['robot_name', 'greeting_msg', 'failed_msg',
                                'postback_title', 'postback_activate']
            err_msg, key_status = utils.key_validator(valid_update_key,
                                                      update_data)
            if not key_status:
                return Response({'errors':_(err_msg)},
                                 status=HTTP_403_FORBIDDEN)
            for k, v in update_data.items():
                setattr(bot_obj, k, v)
            bot_obj.save()
            return Response({'success':_('Update succeeded')},
                            status=HTTP_200_OK)
        return Response({'errors':_('No content')},
                        status=HTTP_400_BAD_REQUEST)

    def destroy(self, request, pk=None):
        '''Delete chatbot

        Need to check if delete_confirm has become True first
        '''
        user_obj = request.user
        bot_obj = Chatbot.objects.filter(id=pk, hide_status=False,
                                         user=user_obj).first()
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

    @action(methods=['put'], detail=True, permission_classes=[IsAuthenticated])
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
            bot_obj = Chatbot.objects.filter(id=pk, hide_status=False,
                                             user=user_obj).first()
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


class LineViewset(RetrieveModelMixin, ListModelMixin, UpdateModelMixin,
                  viewsets.GenericViewSet):
    '''Line viewset

    READ, UPDATE

    Request format example:
    PUT
    {
        "secret": "thisissecret",
        "token": "thisistoken"
    }

    Response format example:
    GET
    {
        "id": 1,
        "secret": "thisissecret",
        "token": "thisistoken"
    }
    '''
    authentication_classes = (TokenAuthentication,)
    permission_classes = (IsAuthenticated,)
    queryset = Line.objects.all()
    serializer_class = LineSerializer

    def get_queryset(self):
        user_obj = self.request.user
        bot_id = self.kwargs.get('id')
        return Line.objects.filter(chatbot=bot_id, chatbot__hide_status=False)

    def list(self, request, id=None):
        bot = Chatbot.objects.filter(id=id, hide_status=False).first()
        if not bot:
            return Response({'errors': _('Not found')},
                            status=HTTP_404_NOT_FOUND)
        if request.user.is_staff == True and bot.bot_type == 'Task'\
            and bot.assign_user != None:
            return Response({'errors': _('Not allowed to get user line data')},
                            status=HTTP_403_FORBIDDEN)
        line_obj = Line.objects.filter(chatbot=id).first()
        serializer = LineSerializer(line_obj)
        return Response(serializer.data, status=HTTP_200_OK)

    def retrieve(self, request, id=None, pk=None):
        bot = Chatbot.objects.filter(id=id, hide_status=False).first()
        if not bot:
            return Response({'errors': _('Not found')},
                            status=HTTP_404_NOT_FOUND)
        if request.user.is_staff == True and bot.bot_type == 'Task'\
            and bot.assign_user != None:
            return Response({'errors': _('Not allowed to get user line data')},
                            status=HTTP_403_FORBIDDEN)
        line_obj = Line.objects.filter(chatbot=id).first()
        serializer = LineSerializer(line_obj)
        return Response(serializer.data, status=HTTP_200_OK)

    def update(self, request, id=None, pk=None):
        '''Update line data

        Args:
            id = Chatbot object id
            pk = Line object id
        '''
        bot = Chatbot.objects.filter(id=id, hide_status=False).first()
        if not bot:
            return Response({'errors': _('Not found')},
                            status=HTTP_404_NOT_FOUND)
        if request.user.is_staff == True and bot.bot_type == 'Task'\
            and bot.assign_user != None:
            return Response({'errors': _('Not allowed to get user line data')},
                            status=HTTP_403_FORBIDDEN)
        if request.body:
            user_obj = request.user
            line_obj = Line.objects.filter(id=pk, chatbot=id).first()
            if not line_obj:
                return Response({'errors':_('Not found')},
                                status=HTTP_404_NOT_FOUND)
            update_data = json.loads(request.body)
            for k, v in update_data.items():
                setattr(line_obj, k, v)
            line_obj.save()
            return Response({'success':_('Update succeeded')},
                            status=HTTP_200_OK)
        return Response({'errors':_('No content')},
                        status=HTTP_400_BAD_REQUEST)


class FacebookViewset(RetrieveModelMixin, ListModelMixin, UpdateModelMixin,
                      viewsets.GenericViewSet):
    '''Facebook viewset

    READ, UPDATE

    Request format example:
    PUT
    {
        "token": "thisistoken",
        "verify_str": "thisisverifystr"
    }

    Response format example:
    GET
    {
        "id": 1,
        "token": "thisistoken",
        "verify_str": "thisisverifystr"
    }
    '''
    authentication_classes = (TokenAuthentication,)
    permission_classes = (IsAuthenticated,)
    queryset = Facebook.objects.all()
    serializer_class = FacebookSerializer

    def get_queryset(self):
        user_obj = self.request.user
        bot_id = self.kwargs.get('id')
        return Facebook.objects.filter(chatbot=bot_id,
                                       chatbot__hide_status=False)

    def list(self, request, id=None):
        bot = Chatbot.objects.filter(id=id, hide_status=False).first()
        if not bot:
            return Response({'errors': _('Not found')},
                            status=HTTP_404_NOT_FOUND)
        if request.user.is_staff == True and bot.bot_type == 'Task'\
            and bot.assign_user != None:
            return Response({'errors': _('Not allowed to get user fb data')},
                            status=HTTP_403_FORBIDDEN)
        fb_obj = Facebook.objects.filter(chatbot=id).first()
        serializer = FacebookSerializer(fb_obj)
        return Response(serializer.data, status=HTTP_200_OK)

    def retrieve(self, request, id=None, pk=None):
        bot = Chatbot.objects.filter(id=id, hide_status=False).first()
        if not bot:
            return Response({'errors': _('Not found')},
                            status=HTTP_404_NOT_FOUND)
        if request.user.is_staff == True and bot.bot_type == 'Task'\
            and bot.assign_user != None:
            return Response({'errors': _('Not allowed to get user fb data')},
                            status=HTTP_403_FORBIDDEN)
        fb_obj = Facebook.objects.filter(chatbot=id).first()
        serializer = FacebookSerializer(fb_obj)
        return Response(serializer.data, status=HTTP_200_OK)

    def update(self, request, id=None, pk=None):
        '''Update line data

        Args:
            id = Chatbot object id
            pk = Line object id
        '''
        bot = Chatbot.objects.filter(id=id, hide_status=False).first()
        if not bot:
            return Response({'errors': _('Not found')},
                            status=HTTP_404_NOT_FOUND)
        if request.user.is_staff == True and bot.bot_type == 'Task'\
            and bot.assign_user != None:
            return Response({'errors': _('Not allowed to get user fb data')},
                            status=HTTP_403_FORBIDDEN)
        if request.body:
            user_obj = request.user
            fb_obj = Facebook.objects.filter(id=pk, chatbot=id).first()
            if not fb_obj:
                return Response({'errors':_('Not found')},
                                status=HTTP_404_NOT_FOUND)
            update_data = json.loads(request.body)
            for k, v in update_data.items():
                setattr(fb_obj, k, v)
            fb_obj.save()
            return Response({'success':_('Update succeeded')},
                            status=HTTP_200_OK)
        return Response({'errors':_('No content')},
                        status=HTTP_400_BAD_REQUEST)