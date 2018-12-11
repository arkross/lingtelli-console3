import json
from django.shortcuts import render
from django.utils.translation import gettext as _
from rest_framework import viewsets, status
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from chat_console_3 import utils, nlumodel

from .serilalizers import ChatbotSerializer

from .models import Chatbot, Line, Facebook, BotThirdPartyGroup
from account.models import AccountInfo
from faq.models import FAQGroup, Answer, Question
from thirdparty.models import ThirdParty

class ChatbotViewset(viewsets.ModelViewSet):
    '''Chatbot viewset

    Using CRUD with chatbot related data

    detail_route:
        Train bot
    
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
        "third_party": [1,2],
        "line":{
            "token":"thetokenforline",
            "secret:"thesecretforline"
        },
        "facebook":{
            "token":"thetokenforfacebook",
            "verify_str:"theverifystrforfacebook"
        }
    }

    Response format example:
    GET(List)
    {
        "id": 1,
        "robot_name": "Jarvis"
    }

    GET(Retrieve)
    {
        "robot_name": "Jarvis",
        "greeting_msg": "hi",
        "failed_msg": "I do not understand",
        "postback_title": "Please chose the similar questoin",
        "created_at": "2017-10-10 00:00:00",
        "updated_at": "2017-12-12 00:00:00",
        "expired_at": "2018-10-10 00:00:00",
        "vendor_id": "thisisvendorid",
        "postback_activate": False,
        "delete_confirm": False,
        "bot_type": "NORMAL",
        "assign_user": None,
        "activate": True,
        "language": "tw",
        "third_party": [2,3],
        "line": {
            "token":"thetokenforline",
            "secret:"thesecretforline"
        },
        "facebook":{
            "token":"thetokenforfacebook",
            "verify_str:"theverifystrforfacebook"
        },
        "user": 2
    }
    '''
    
    authentication_classes = (TokenAuthentication,)
    permission_classes = (IsAuthenticated,)
    queryset = Chatbot.objects.all()
    serializer_class = ChatbotSerializer

    def get_queryset(self):
        user_obj = self.request.user
        return self.queryset.filter(user=user_obj)        

    def create(self, request):
        '''Create chatbot

        Steps:
            1. Check if the chatbot amount is over the limitation
            2. Check if chatbot required keys are provided
            3. Assign the thirdparty demo to the bot with trail paidtype
            4. Create the bot and make sure NLU trains model succeed. If not,
                delete the whole chatbot.
        '''
        if request.body:
            user_obj = request.user
            acc_obj = AccountInfo.objects.filter(user=user_obj).first()
            bot_create_limit = acc_obj.paid_type.bot_amount
            bot_owned_amount = Chatbot.objects.filter(user=user_obj).count()
            if bot_owned_amount >= int(bot_create_limit):
                return Response({'errors':_('Reach bot create limitation')},
                                 status=status.HTTP_403_FORBIDDEN)
            
            bot_data = json.loads(request.body)
            bot_keys = ['robot_name', 'greeting_msg', 'failed_msg',
                        'postback_title', 'language']
            err_msg, key_status = utils.key_validator(bot_keys, bot_data)
            if not key_status:
                return Response({'errors':_(err_msg)},
                                 status=status.HTTP_403_FORBIDDEN)
            bot_data['user_id'] = user_obj.id
            bot_obj = Chatbot.objects.create(**bot_data)
            if bot_obj:
                bot_obj.vender_id = utils.generate_uuid(str(bot_obj.id),
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
                # TODO: Remove create_bot_obj = True
                # create_bot_obj = \
                #     self.__delete_create_failed_model(nlu_create_status,
                #                                       bot_obj)
                create_bot_obj = True
                if not create_bot_obj:
                    return Response({'errors':_('Create bot failed. '+\
                                     'Cause by NLU error.' + err_msg)},
                                     status=status.HTTP_400_BAD_REQUEST)
                # TODO change bot_obj to create_bot_obj
                res = {}
                res['id'] = bot_obj.id
                res['robot_name'] = bot_obj.robot_name
                return Response(res, status=status.HTTP_201_CREATED)
            return Response({'errors':_('Create bot failed')},
                             status=status.HTTP_400_BAD_REQUEST)

            

        return Response({'errors':_('No content')},
                        status=status.HTTP_400_BAD_REQUEST)
    
    def __delete_create_failed_model(self, create_status, chatbot_obj):
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
        

