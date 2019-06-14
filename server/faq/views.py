import json
import csv
import re
from io import StringIO
from django.shortcuts import render
from django.utils.translation import gettext as _
from django.views.decorators.csrf import csrf_exempt
from django.db.models import Q
from rest_framework import viewsets
from rest_framework.decorators import (action, api_view,
                                       authentication_classes,
                                       permission_classes)
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.status import (
    HTTP_200_OK,
    HTTP_201_CREATED,
    HTTP_400_BAD_REQUEST,
    HTTP_403_FORBIDDEN,
    HTTP_404_NOT_FOUND,
    HTTP_500_INTERNAL_SERVER_ERROR
)

from chat_console_3 import utils, nlumodel, pagination
from .serializers import (FAQGrouptSerializer, AnswerSerializer,
                          QuestionSerializer)

from .models import FAQGroup, Answer, Question
from account.models import AccountInfo
from chatbot.models import Chatbot
from module.models import Module, ModuleFAQGroup, ModuleAnswer, ModuleQuestion


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
    pagination_class = pagination.StandardPagination

    def get_queryset(self):
        bot_id = self.kwargs.get('id')
        user_obj = self.request.user
        bot_obj = Chatbot.objects.filter(Q(user=user_obj) |
                                         Q(assign_user=user_obj),
                                         id=bot_id, hide_status=False,).first()
        return FAQGroup.objects.filter(chatbot=bot_obj).order_by('-id')

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
        bot_obj = Chatbot.objects.filter(id=id, user=user_obj,
                                         hide_status=False).first()
        if not bot_obj:
            return Response({'errors': _('Not found')},
                            status=HTTP_404_NOT_FOUND)
        # Get total count first
        faq_count = 0
        bots = Chatbot.objects.filter(user=user_obj, hide_status=False)
        for bot in bots:
            bot_faq_count = FAQGroup.objects.filter(chatbot=bot).count()
            faq_count += bot_faq_count
        if acc_obj.paid_type.user_type != 'S' and\
           faq_count >= int(faq_group_limit):
            return Response({'errors': _('Faq group exceeded upper limit')},
                            status=HTTP_403_FORBIDDEN)
        new_csv_id = faq_count + 1
        faq_group_obj = FAQGroup.objects.create(chatbot_id=id,
                                                csv_group=new_csv_id)
        if faq_group_obj:
            res = {}
            res['id'] = faq_group_obj.id
            return Response(res, status=HTTP_201_CREATED)
        return Response({'errors': _('Create faq group failed')},
                        status=HTTP_400_BAD_REQUEST)


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
        bot_obj = Chatbot.objects.filter(Q(user=user_obj) |
                                         Q(assign_user=user_obj),
                                         id=bot_id, hide_status=False).first()
        return Answer.objects.filter(chatbot=bot_obj)

    def create(self, request, id=None):
        if request.body:
            user_obj = request.user
            bot_obj = Chatbot.objects.filter(id=id, hide_status=False,
                                             user=user_obj).first()
            if not bot_obj:
                return Response({'errors': _('Not found')},
                                status=HTTP_404_NOT_FOUND)
            create_data = json.loads(request.body)
            ans_key = ['group', 'content']
            err_msg, valid_status = utils.key_validator(ans_key, create_data)
            if not valid_status:
                return Response({'errors': _(err_msg)},
                                status=HTTP_403_FORBIDDEN)
            faq_group_obj = \
                FAQGroup.objects.filter(id=create_data.get('group'),
                                        chatbot=bot_obj).first()
            if not faq_group_obj:
                return Response({'errors': _('Not found')},
                                status=HTTP_404_NOT_FOUND)
            ans_obj =\
                Answer.objects.create(group_id=create_data.get('group'),
                                      content=create_data.get('content'),
                                      chatbot=bot_obj)
            if ans_obj:
                res = {}
                res['id'] = ans_obj.id
                res['content'] = ans_obj.content
                res['group'] = ans_obj.group.id
                return Response(res, status=HTTP_201_CREATED)
            return Response({'errors': _('Create failed')},
                            status=HTTP_400_BAD_REQUEST)
        return Response({'errors': _('No content')},
                        status=HTTP_400_BAD_REQUEST)

    def update(self, request, id=None, pk=None):
        if request.body:
            user_obj = request.user
            bot_obj = Chatbot.objects.filter(id=id, hide_status=False,
                                             user=user_obj).first()
            if not bot_obj:
                return Response({'errors': _('Not found')},
                                status=HTTP_404_NOT_FOUND)
            update_data = json.loads(request.body)
            ans_key = ['content']
            err_msg, valid_status = utils.key_validator(ans_key, update_data)
            if not valid_status:
                return Response({'errors': _(err_msg)},
                                status=HTTP_403_FORBIDDEN)
            ans_obj = Answer.objects.filter(id=pk, chatbot=bot_obj).first()
            if not ans_obj:
                return Response({'errors': _('Not found')},
                                status=HTTP_404_NOT_FOUND)
            ans_obj.content = update_data.get('content')
            ans_obj.save()
            return Response({'success': _('Update succeeded')},
                            status=HTTP_200_OK)
        return Response({'errors': _('No content')},
                        status=HTTP_400_BAD_REQUEST)


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
        bot_obj = Chatbot.objects.filter(Q(user=user_obj) |
                                         Q(assign_user=user_obj),
                                         id=bot_id, hide_status=False).first()
        return Question.objects.filter(chatbot=bot_obj)

    def create(self, request, id=None):
        if request.body:
            user_obj = request.user
            bot_obj = Chatbot.objects.filter(Q(user=user_obj) |
                                             Q(assign_user=user_obj),
                                             id=id, hide_status=False).first()
            if not bot_obj:
                return Response({'errors': _('Not found')},
                                status=HTTP_404_NOT_FOUND)
            create_data = json.loads(request.body)
            que_key = ['group', 'content']
            err_msg, valid_status = utils.key_validator(que_key, create_data)
            if not valid_status:
                return Response({'errors': _(err_msg)},
                                status=HTTP_403_FORBIDDEN)
            faq_group_obj = \
                FAQGroup.objects.filter(id=create_data.get('group'),
                                        chatbot=bot_obj).first()
            if not faq_group_obj:
                return Response({'errors': _('Not found')},
                                status=HTTP_404_NOT_FOUND)
            que_obj = Question.objects\
                              .create(group_id=create_data.get('group'),
                                      content=create_data.get('content'),
                                      train_content=create_data.get('content'),
                                      chatbot=bot_obj)
            if que_obj:
                res = {}
                res['id'] = que_obj.id
                res['content'] = que_obj.content
                res['group'] = que_obj.group.id
                return Response(res, status=HTTP_201_CREATED)
            return Response({'errors': _('Create failed')},
                            status=HTTP_400_BAD_REQUEST)
        return Response({'errors': _('No content')},
                        status=HTTP_400_BAD_REQUEST)

    def update(self, request, id=None, pk=None):
        if request.body:
            user_obj = request.user
            bot_obj = Chatbot.objects.filter(Q(user=user_obj) |
                                             Q(assign_user=user_obj),
                                             id=id, hide_status=False).first()
            if not bot_obj:
                return Response({'errors': _('Not found')},
                                status=HTTP_404_NOT_FOUND)
            update_data = json.loads(request.body)
            que_key = ['content']
            err_msg, valid_status = utils.key_validator(que_key, update_data)
            if not valid_status:
                return Response({'errors': _(err_msg)},
                                status=HTTP_403_FORBIDDEN)
            que_obj = Question.objects.filter(id=pk, chatbot=bot_obj).first()
            if not que_obj:
                return Response({'errors': _('Not found')},
                                status=HTTP_404_NOT_FOUND)
            que_obj.content = update_data.get('content')
            que_obj.train_content = update_data.get('content')
            que_obj.save()
            return Response({'success': _('Update succeeded')},
                            status=HTTP_200_OK)
        return Response({'errors': _('No content')},
                        status=HTTP_400_BAD_REQUEST)


@csrf_exempt
@api_view(['POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def upload_faq_csv(request, pk=None):
    '''Upload FAQ from CSV file

    Upload file with the key 'file'

    File format:
    "Group", "Question", "Answer"
    "1", "How are you", "Good"
    "1", "Are you okey", ""
    "2", "Hi", "Hello"
    "2", "Hi Hi", "Hello Hello"
    '''
    if request.FILES.get('file'):
        bot_obj = Chatbot.objects.filter(id=pk, hide_status=False,
                                         user=request.user).first()
        if bot_obj:
            FAQGroup.objects.filter(chatbot=bot_obj).delete()
            f = request.FILES.get('file')
            f_s = f.read()
            f_s_result = utils.check_upload_file_type(f_s)
            if not f_s_result:
                return Response({'errors': _('File type is not correct. ' +
                                'Should be type utf8 or big5.')},
                                status=HTTP_400_BAD_REQUEST)
            try:
                buff = StringIO(str(f_s_result))
                data = csv.reader(buff, delimiter=',', quotechar='"')
                count_col = len(next(data))  # Skip header
                if count_col != 3:
                    return Response({'errors': _('CSV column is not correct')},
                                    status=HTTP_400_BAD_REQUEST)
            except Exception as e:
                print('Upload error: ', e)
                return Response({'errors': _('File type is not correct. ' +
                                'Should be type utf8 or big5.')},
                                status=HTTP_400_BAD_REQUEST)
            acc_obj = AccountInfo.objects.filter(user=request.user).first()
            faq_limit = acc_obj.paid_type.faq_amount

            # Get total faq amount first
            group_count = 0
            bots = Chatbot.objects.filter(user=request.user)
            for bot in bots:
                bot_faq_group = FAQGroup.objects.filter(chatbot=bot).count()
                group_count += bot_faq_group

            for row in data:
                faq_group = row[0]
                que = row[1]
                ans = row[2]
                group_obj, created = \
                    FAQGroup.objects.get_or_create(csv_group=int(faq_group),
                                                   chatbot=bot_obj)
                if created:
                    group_count += 1
                    if group_count > int(faq_limit) and\
                       acc_obj.paid_type.user_type != 'S':
                        FAQGroup.objects.filter(chatbot=bot_obj).delete()
                        return Response({'errors': _('Group over limitation')},
                                        status=HTTP_403_FORBIDDEN)
                if ans != '':
                    Answer.objects.create(group=group_obj, content=ans,
                                          chatbot=bot_obj)
                if que != '':
                    Question.objects.create(group=group_obj, content=que,
                                            train_content=que,
                                            chatbot=bot_obj)
            return Response({'success': _('Upload succeeded')},
                            status=HTTP_201_CREATED)

        return Response({'errors': _('Bot not found')},
                        status=HTTP_404_NOT_FOUND)
    return Response({'errors': _('No content')},
                    status=HTTP_404_NOT_FOUND)


@csrf_exempt
@api_view(['GET'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def export_faq_csv(request, pk=None):
    '''Export FAQ data to CSV file
    '''
    bot_obj = Chatbot.objects.filter(id=pk, hide_status=False,
                                     user=request.user).first()
    if bot_obj:
        faqgroups = FAQGroup.objects.filter(chatbot=bot_obj)
        rows = [['Group', 'Question', 'Answer']]
        for faqgroup in faqgroups:
            answers = Answer.objects.filter(group=faqgroup)
            questions = Question.objects.filter(group=faqgroup)
            if len(answers) >= len(questions):
                for a in range(len(answers)):
                    ans = answers[a].content
                    que = ''
                    if a < len(questions):
                        que = questions[a].content
                    rows.append([str(faqgroup.csv_group), que, ans])
            else:
                for q in range(len(questions)):
                    que = questions[q].content
                    ans = ''
                    if q < len(answers):
                        ans = answers[q].content
                    rows.append([str(faqgroup.csv_group), que, ans])
        csv_file = StringIO()
        writer = csv.writer(csv_file, delimiter=',', dialect='excel')
        for row in rows:
            writer.writerow(row)
        headers = {'Content-Disposition': 'attachment;filename=faq.csv'}
        contents = csv_file.getvalue().encode('utf-8-sig')
        csv_file.close()
        return Response(contents, headers=headers, content_type='text/csv')
    return Response({'errors': _('Bot not found')},
                    status=HTTP_404_NOT_FOUND)


@csrf_exempt
@api_view(['GET'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def train_bot_faq(request, pk=None):
    '''Train bot based on FAQ data
    '''
    user_obj = request.user
    bot_obj = Chatbot.objects.filter(id=pk, hide_status=False,
                                     user=user_obj).first()
    if not bot_obj:
        return Response({'errors': _('Not found')},
                        status=HTTP_404_NOT_FOUND)
    train_status, err_msg = nlumodel.train_model(bot_obj)
    if not train_status:
        return Response({'errors': err_msg},
                        status=HTTP_500_INTERNAL_SERVER_ERROR)
    return Response({'success': _('Training bot succeeded')},
                    status=HTTP_200_OK)


@csrf_exempt
@api_view(['POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def update_faq_field(request, pk=None):
    ''' Create faq data with field module faq

    Special characters for identifying as field:
    {1:item}
    First is the order for showing fields. Second is the field name.
    Please use curly brackets as special keywords.

    Request format sample:
    POST
    {
        "fields": {"item": "this is the value need to update"},
        "module_id": 1
    }
    '''

    req_data = json.loads(request.body)
    fields = req_data.get('fields')
    mod_id = req_data.get('module_id')
    mod_obj = Module.objects.filter(id=mod_id).first()
    if not mod_obj:
        return Response({'errors': _('Not found')},
                        status=HTTP_404_NOT_FOUND)
    reg = r'{\w+:[\D\S]:*[^{}]*}'
    bot_obj = Chatbot.objects.filter(id=pk).first()
    if not bot_obj:
        return Response({'errors': _('Not found')},
                        status=HTTP_404_NOT_FOUND)
    FAQGroup.objects.filter(chatbot=bot_obj).delete()
    mod_faq_qry = ModuleFAQGroup.objects.filter(module=mod_obj)
    for mod_faq in mod_faq_qry:
        faq_group_obj = FAQGroup.objects.create(chatbot=bot_obj)
        mod_ans_qry = ModuleAnswer.objects.filter(module=mod_obj,
                                                  group=mod_faq)
        mod_que_qry = ModuleQuestion.objects.filter(module=mod_obj,
                                                    group=mod_faq)

        for mod_ans in mod_ans_qry:
            sentence = mod_ans.content
            if '{' in sentence:
                words = re.findall(reg, sentence)
                for s in words:
                    s = s.replace('{', '')
                    s = s.replace('}', '')
                    sep_order_item = s.split(':')
                    order = sep_order_item[0]
                    item = sep_order_item[1]
                    replace_format = '{' + order + ':' + item + '}'
                    if len(sep_order_item) > 2:
                        ex = sep_order_item[2]
                        replace_format = \
                            '{' + order + ':' + item + ':' + ex + '}'
                    if fields.get(item, None):
                        replace_data = fields.get(item)
                        sentence = sentence.replace(replace_format,
                                                    replace_data)
                    else:
                        sentence = sentence.replace(replace_format, '')
            new_ans_obj = Answer.objects.create(content=sentence,
                                                chatbot=bot_obj,
                                                group=faq_group_obj)
            if not new_ans_obj:
                return Response({'errors':
                                _('Something went wrong. Please try again')},
                                status=HTTP_500_INTERNAL_SERVER_ERROR)
        for mod_que in mod_que_qry:
            sentence = mod_que.content
            if '{' in sentence:
                words = re.findall(reg, sentence)
                for s in words:
                    s = s.replace('{', '')
                    s = s.replace('}', '')
                    sep_order_item = s.split(':')
                    order = sep_order_item[0]
                    item = sep_order_item[1]
                    replace_format = '{' + order + ':' + item + '}'
                    if len(sep_order_item) > 2:
                        ex = sep_order_item[2]
                        replace_format = \
                            '{' + order + ':' + item + ':' + ex + '}'
                    if fields.get(item, None):
                        replace_data = fields.get(item)
                        sentence = sentence.replace(replace_format,
                                                    replace_data)
                    else:
                        sentence = sentence.replace(replace_format, '')
            new_que_obj = Question.objects.create(content=sentence,
                                                  chatbot=bot_obj,
                                                  group=faq_group_obj)
            if not new_que_obj:
                return Response({'errors':
                                _('Something went wrong. Please try again')},
                                status=HTTP_500_INTERNAL_SERVER_ERROR)
    return Response(status=HTTP_201_CREATED)
