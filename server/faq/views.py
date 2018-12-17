import json
from django.shortcuts import render
from django.utils.translation import gettext as _
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from chat_console_3 import utils
from .serializers import (FAQGrouptSerializer, AnswerSerializer,
                          QuestionSerializer)

from .models import FAQGroup, Answer, Question
from account.models import AccountInfo
from chatbot.models import Chatbot

class FAQGrouptViewset(viewsets.ModelViewSet):
    '''FAQ group viewset

    Create, Read, Delete
    Response format example:
    POST:
    {
        "id": 1,
        "content": "好吃",
        "group": 11
    }

    GET(List):
    [
        {
            "group": 11,
            "answer": [],
            "question": []
        },
        {
            "group": 10,
            "answer": [],
            "question": []
        },
    ]

    GET(Retrieve):
    {
        "group": 9,
        "answer": [
            {
                "id": 10,
                "content": "是喔"
            },
            {
                "id": 11,
                "content": "吃牛排"
            }
        ],
        "question": [
            {
                "id": 9,
                "content": "鐵板麵好吃"
            }
        ]
    }
    '''
    authentication_classes = (TokenAuthentication,)
    permission_classes = (IsAuthenticated,)
    queryset = FAQGroup.objects.all()
    serializer_class = FAQGrouptSerializer

    def get_queryset(self):
        bot_id = self.kwargs.get('id')
        user_obj = self.request.user
        bot_obj = Chatbot.objects.filter(id=bot_id, user=user_obj).first()
        return self.queryset.filter(chatbot=bot_obj).order_by('-id')

    def create(self, request, id=None):
        '''Create new faq

        Need to check if new create faq will exceed upper limitation. When the
        limitation is 0 means this user has unlimited amount.

        Args:
            id: Chatbot id
        '''
        user_obj = request.user
        acc_obj = AccountInfo.objects.filter(user=user_obj).first()
        faq_group_limit = acc_obj.paid_type.faq_amount
        bot_obj = Chatbot.objects.filter(id=id, user=user_obj).first()
        if not bot_obj:
            return Response({'errors':_('Not found')},
                             status=status.HTTP_404_NOT_FOUND)
        faq_count = FAQGroup.objects.filter(chatbot=id).count()
        if int(faq_group_limit) != 0 and faq_count >= int(faq_group_limit):
            return Response({'errors':_('Faq group exceeded upper limit')},
                            status=status.HTTP_403_FORBIDDEN)
        faq_group_obj = FAQGroup.objects.create(chatbot_id=id)
        if faq_group_obj:
            res = {}
            res['id'] = faq_group_obj.id
            return Response(res, status=status.HTTP_201_CREATED)
        return Response({'errors':_('Create faq group failed')},
                        status=status.HTTP_400_BAD_REQUEST)
        

    @action(methods=['post'], detail=True, permission_classes=[IsAuthenticated])
    def upload(self, request, id=None, pk=None):
        pass
    
    @action(methods=['get'], detail=True, permission_classes=[IsAuthenticated])
    def export(self, request, id=None, pk=None):
        pass
    
    @action(methods=['get'], detail=True, permission_classes=[IsAuthenticated])
    def train(self, request, id=None, pk=None):
        pass


class AnswerViewset(viewsets.ModelViewSet):
    '''Answer viewset

    CRUD

    Request format example:
    POST:
    {
        "group": 1,
        "content": "hi"
    }
    PUT:
    {
        "content": "hello"
    }

    Response format example:
    GET(Retrieve):
    {
        "id": 1,
        "group": 1,
        "content": "hi"
    }
    POST:
    {
        "id": 1,
        "group": 1,
        "content": "hi"
    }
    '''
    authentication_classes = (TokenAuthentication,)
    permission_classes = (IsAuthenticated,)
    queryset = Answer.objects.all()
    serializer_class = AnswerSerializer

    def get_queryset(self):
        user_obj = self.request.user
        bot_id = self.kwargs.get('id')
        bot_obj = Chatbot.objects.filter(id=bot_id, user=user_obj).first()
        return self.queryset.filter(chatbot=bot_obj)

    def create(self, request, id=None):
        if request.body:
            user_obj = request.user
            bot_obj = Chatbot.objects.filter(id=id, user=user_obj).first()
            if not bot_obj:
                return Response({'errors':_('Not found')},
                                status=status.HTTP_404_NOT_FOUND)
            create_data = json.loads(request.body)
            ans_key = ['group', 'content']
            err_msg, valid_status = utils.key_validator(ans_key, create_data)
            if not valid_status:
                return Response({'errors':_(err_msg)},
                                 status=status.HTTP_403_FORBIDDEN)
            faq_group_obj = \
                FAQGroup.objects.filter(id=create_data.get('group'),
                                        chatbot=bot_obj).first()
            if not faq_group_obj:
                return Response({'errors':_('Not found')},
                                status=status.HTTP_404_NOT_FOUND)
            ans_obj = Answer.objects.create(group_id=create_data.get('group'),
                                            content=create_data.get('content'),
                                            chatbot=bot_obj)
            if ans_obj:
                res = {}
                res['id'] = ans_obj.id
                res['content'] = ans_obj.content
                res['group'] = ans_obj.group.id
                return Response(res, status=status.HTTP_201_CREATED)
            return Response({'errors':_('Create failed')},
                            status=status.HTTP_400_BAD_REQUEST)
        return Response({'errors':_('No content')},
                        status=status.HTTP_400_BAD_REQUEST)
    
    def update(self, request, id=None, pk=None):
        if request.body:
            user_obj = request.user
            bot_obj = Chatbot.objects.filter(id=id, user=user_obj).first()
            if not bot_obj:
                return Response({'errors':_('Not found')},
                                status=status.HTTP_404_NOT_FOUND)
            update_data = json.loads(request.body)
            ans_key = ['content']
            err_msg, valid_status = utils.key_validator(ans_key, update_data)
            if not valid_status:
                return Response({'errors':_(err_msg)},
                                 status=status.HTTP_403_FORBIDDEN)
            ans_obj = Answer.objects.filter(id=pk, chatbot=bot_obj).first()
            if not ans_obj:
                return Response({'errors':_('Not found')},
                                status=status.HTTP_404_NOT_FOUND)
            ans_obj.content = update_data.get('content')
            ans_obj.save()
            return Response({'success':_('Update succeeded')},
                            status=status.HTTP_200_OK)
        return Response({'errors':_('No content')},
                        status=status.HTTP_400_BAD_REQUEST)



class QuestionViewset(viewsets.ModelViewSet):
    '''Question viewset

    CRUD

    Request format example:
    POST:
    {
        "group": 1,
        "content": "hi"
    }
    PUT:
    {
        "content": "hello"
    }

    Response format example:
    GET(Retrieve):
    {
        "id": 1,
        "group": 1,
        "content": "hi"
    }
    POST:
    {
        "id": 1,
        "group": 1,
        "content": "hi"
    }
    '''
    authentication_classes = (TokenAuthentication,)
    permission_classes = (IsAuthenticated,)
    queryset = Question.objects.all()
    serializer_class = QuestionSerializer

    def get_queryset(self):
        user_obj = self.request.user
        bot_id = self.kwargs.get('id')
        bot_obj = Chatbot.objects.filter(id=bot_id, user=user_obj).first()
        return self.queryset.filter(chatbot=bot_obj)

    def create(self, request, id=None):
        if request.body:
            user_obj = request.user
            bot_obj = Chatbot.objects.filter(id=id, user=user_obj).first()
            if not bot_obj:
                return Response({'errors':_('Not found')},
                                status=status.HTTP_404_NOT_FOUND)
            create_data = json.loads(request.body)
            que_key = ['group', 'content']
            err_msg, valid_status = utils.key_validator(que_key, create_data)
            if not valid_status:
                return Response({'errors':_(err_msg)},
                                 status=status.HTTP_403_FORBIDDEN)
            faq_group_obj = \
                FAQGroup.objects.filter(id=create_data.get('group'),
                                        chatbot=bot_obj).first()
            if not faq_group_obj:
                return Response({'errors':_('Not found')},
                                status=status.HTTP_404_NOT_FOUND)
            que_obj = Question.objects.create(group_id=create_data.get('group'),
                                            content=create_data.get('content'),
                                            chatbot=bot_obj)
            if que_obj:
                res = {}
                res['id'] = que_obj.id
                res['content'] = que_obj.content
                res['group'] = que_obj.group.id
                return Response(res, status=status.HTTP_201_CREATED)
            return Response({'errors':_('Create failed')},
                            status=status.HTTP_400_BAD_REQUEST)
        return Response({'errors':_('No content')},
                        status=status.HTTP_400_BAD_REQUEST)
    
    def update(self, request, id=None, pk=None):
        if request.body:
            user_obj = request.user
            bot_obj = Chatbot.objects.filter(id=id, user=user_obj).first()
            if not bot_obj:
                return Response({'errors':_('Not found')},
                                status=status.HTTP_404_NOT_FOUND)
            update_data = json.loads(request.body)
            que_key = ['content']
            err_msg, valid_status = utils.key_validator(que_key, update_data)
            if not valid_status:
                return Response({'errors':_(err_msg)},
                                 status=status.HTTP_403_FORBIDDEN)
            que_obj = Question.objects.filter(id=pk, chatbot=bot_obj).first()
            if not que_obj:
                return Response({'errors':_('Not found')},
                                status=status.HTTP_404_NOT_FOUND)
            que_obj.content = update_data.get('content')
            que_obj.save()
            return Response({'success':_('Update succeeded')},
                            status=status.HTTP_200_OK)
        return Response({'errors':_('No content')},
                        status=status.HTTP_400_BAD_REQUEST)
