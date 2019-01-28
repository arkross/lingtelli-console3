from datetime import datetime, timedelta
from collections import OrderedDict
from django.shortcuts import render
from django.db.models import Count, Case, When
from django.utils.translation import gettext as _
from rest_framework import viewsets
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.status import (
    HTTP_200_OK,
    HTTP_404_NOT_FOUND
)

from .serializers import ReportSerializer

from chatbot.models import Chatbot
from history.models import History
from faq.models import FAQStatus


class ReportViewset(viewsets.ReadOnlyModelViewSet):
    '''Report related features. List and retrieve methods only.

    Can not be modified by user.
    Only containing GET method.

    Response format example:
    GET:
    [
        {
            "date": "2010-10-10 00:00:00",
            "total_chat": 10,
            "success_count": 8
        },
        {
            "question_count":[
                "content": "hi",
                "que_count": 2
            ]
        }
    ]
    '''

    authentication_classes = (TokenAuthentication,)
    permission_classes = (IsAuthenticated,)
    queryset = History.objects.all()
    serializer_class = ReportSerializer

    def list(self, request, id=None):
        user_obj = request.user
        bot_id = id
        bot_obj = Chatbot.objects.filter(id=bot_id, user=user_obj).first()
        if bot_obj:
            if not request.GET.get('days'):
                day_range = 7
            else:
                day_range = int(request.GET.get('days'))
            report_list = []
            # Make today to become 00:00:00. Deal with specific time issue.
            today_day_str = datetime.today().strftime('%Y-%m-%d')
            today_day = datetime.strptime(today_day_str, '%Y-%m-%d')
            last_day = today_day + timedelta(1)
            start_day = today_day - timedelta(day_range-1)
            histories = \
                History.objects.filter(chatbot=bot_obj,
                                       created_at__gte=start_day,
                                       created_at__lte=last_day)
            for day in range(0, day_range):
                report_dict = {}
                the_date = today_day.date() - timedelta(day)
                the_history = \
                    histories.filter(created_at__contains=the_date)
                total_chat_count = the_history.values('qa_pair').distinct().\
                                               count()
                report_dict['date'] = the_date.strftime('%Y/%m/%d')
                report_dict['total_chat'] = total_chat_count
                report_dict['success_count'] = \
                    self._get_total_success(the_history)
                report_list.append(report_dict)
            report_list.append(self._get_question_count(histories))
            return Response(report_list, status=HTTP_200_OK)
        return Response({'errors':_('Not found')},
                        status=HTTP_404_NOT_FOUND)
    
    def _get_total_success(self, history_query):
        '''Get total success faq 
        '''

        qa_pair_list = \
            history_query.values_list('qa_pair', flat=True).distinct()
        total_success = \
                    FAQStatus.objects.filter(qa_pair__in=qa_pair_list)\
                        .aggregate(success_count=Count(Case(When(success=True,
                                                                 then=1))))
        return total_success.get('success_count')
    
    def _get_question_count(self, history_query):
        '''Get question content and asked time
        '''
        count_dict = OrderedDict()
        history_query = history_query.filter(sender='USER')
        que_list = \
            history_query.values('content')\
                         .annotate(que_count=Count('content'))
        count_dict['question_count'] = que_list.order_by('-que_count')
        return count_dict
