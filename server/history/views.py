from django.shortcuts import render
from django.utils.translation import gettext as _
from django.db.models import Q
from rest_framework import viewsets
from rest_framework.mixins import (ListModelMixin, RetrieveModelMixin,
                                   UpdateModelMixin)
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.status import (
    HTTP_200_OK,
    HTTP_201_CREATED,
    HTTP_400_BAD_REQUEST,
    HTTP_404_NOT_FOUND
)

from .serializers import HistorySerializer, QuestionMatchHistorySerializer
from chat_console_3 import pagination

from .models import History, QuestionMatchHistory
from chatbot.models import Chatbot
from faq.models import FAQGroup, Question


class HistoryViewset(viewsets.ReadOnlyModelViewSet):
    '''History related features. List and retrieve methods only.

    Can not be modified by user.
    Only containing GET method.

    Response format example:
    GET:
    {
        "sender": "BOT",
        "created_at": "2010-10-10 00:00:00",
        "content": "hi",
        "platform": "LINE",
        "user_id": "thisistheuseridfromclient"
    }
    '''

    authentication_classes = (TokenAuthentication,)
    permission_classes = (IsAuthenticated,)
    queryset = History.objects.all()
    serializer_class = HistorySerializer
    pagination_class = pagination.HistoryPagination

    def get_queryset(self):
        user_obj = self.request.user
        bot_id = self.kwargs.get('id')
        platform = self.request.GET.get('platform', None)
        user_id = self.request.GET.get('uid', None)
        bot_obj = Chatbot.objects.filter(Q(user=user_obj) |
                                         Q(assign_user=user_obj),
                                         id=bot_id).first()
        history_query = []
        if bot_obj:
            history_query = History.objects.filter(chatbot=bot_obj)\
                    .order_by('-created_at')
            if platform:
                history_query = history_query.filter(platform=platform)
            if user_id:
                history_query = history_query.filter(user_id=user_id)
        return history_query


class QuestionMatchHistoryViewset(ListModelMixin, RetrieveModelMixin,
                                  UpdateModelMixin, viewsets.GenericViewSet):

    '''Show similar question matching history

    Response format example:
    GET:
    {
        "id": 1,
        "ori_question": "hi",
        "select_question": "hello",
        "group": 1,
        "status": "0"
        "platform": "LINE",
        "user_id": "thisistheuseridfromclient"
    }
    PUT:
    {
        "success": "Create new question succeeded"
    }
    '''

    authentication_classes = (TokenAuthentication,)
    permission_classes = (IsAuthenticated,)
    queryset = QuestionMatchHistory.objects.all()
    serializer_class = QuestionMatchHistorySerializer
    pagination_class = pagination.StandardPagination

    def get_queryset(self):
        user_obj = self.request.user
        chatbot_id = self.kwargs.get('id')
        platform = self.request.GET.get('platform', None)
        user_id = self.request.GET.get('uid', None)
        bot_obj = Chatbot.objects.filter(user=user_obj, id=chatbot_id).first()
        match_query = []
        if bot_obj:
            match_query = QuestionMatchHistory.objects.filter(chatbot=bot_obj)\
                                                      .order_by('-id')
            if platform:
                match_query = match_query.filter(platform=platform)
            if user_id:
                match_query = match_query.filter(user_id=user_id)
        return match_query

    def update(self, request, id=None, pk=None):
        match_history_id = pk
        chatbot_id = id
        user_obj = request.user
        bot_obj = Chatbot.objects.filter(id=chatbot_id, user=user_obj).first()
        if not bot_obj:
            return Response({'errors': _('Chatbot not found')},
                            status=HTTP_404_NOT_FOUND)

        match_history_obj = \
            QuestionMatchHistory.objects.filter(chatbot=bot_obj,
                                                id=match_history_id).first()
        if not match_history_obj:
            return Response({'errors': _('Matching result not found')},
                            status=HTTP_404_NOT_FOUND)
        faq_group = \
            FAQGroup.objects.filter(id=match_history_obj.group).first()
        if not faq_group:
            match_history_obj.status = 2
            match_history_obj.save()
            return Response({'errors': _('FAQ group does not exisit')},
                            status=HTTP_404_NOT_FOUND)
        question_create_obj = {
            'content': match_history_obj.ori_question,
            'chatbot': bot_obj,
            'group': faq_group
        }
        try:
            Question.objects.create(**question_create_obj)
            match_history_obj.status = 1
            match_history_obj.save()
            return Response({'success':_('Create new question successed')},
                            status=HTTP_201_CREATED)
        except:
            return Response({'errors': _('Create failed')},
                            status=HTTP_400_BAD_REQUEST)
