import json
import csv
import re
from io import StringIO
from django.shortcuts import render
from django.utils.translation import gettext as _
from django.views.decorators.csrf import csrf_exempt
from rest_framework import viewsets
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import (action, api_view,
                                       authentication_classes,
                                       permission_classes)
from rest_framework.viewsets import mixins
from rest_framework.status import (
    HTTP_200_OK,
    HTTP_201_CREATED,
    HTTP_204_NO_CONTENT,
    HTTP_400_BAD_REQUEST,
    HTTP_401_UNAUTHORIZED,
    HTTP_403_FORBIDDEN,
    HTTP_404_NOT_FOUND,
    HTTP_500_INTERNAL_SERVER_ERROR
)
from chat_console_3 import utils, pagination

from .serializers import (ModuleSerializer, ModuleFAQSerializer,
                          ModuleAnswerSerializer, ModuleQuestionSerializer,
                          MemberModuleSerializer)
from .models import Module, ModuleFAQGroup, ModuleAnswer, ModuleQuestion


class ModuleViewSet(viewsets.ModelViewSet):
    ''' Create module for initialing new chatbot.

    Agent has full control. Member can only read data.

    Request format example:
    POST
    {
        "robot_name": "test",
        "greeting_msg": "Hi, how are you",
        "failed_msg": "I do not understand",
        "postback_title": "Related questions",
        "language": "en"
    }
    PUT
    {
        "robot_name": "test",
        "greeting_msg": "Hi, how are you",
        "failed_msg": "I do not understand",
        "postback_title": "Related questions"
    }

    Response format example:
    GET(List)
    {
        "id": 1,
        "robot_name": "test"
    }
    GET(Retrieve)
    {
        "id": 1,
        "robot_name": "test",
        "greeting_msg": "Hi, how are you",
        "failed_msg": "I do not understand",
        "postback_title": "Related questions"
        "created_at": "2010-10-10 00:00:00",
        "updated_at": "2010-10-11 00:00:00",
        "language": "en"
    }
    '''

    authentication_classes = (TokenAuthentication,)
    permission_classes = (IsAuthenticated,)
    queryset = Module.objects.all()
    serializer_class = ModuleSerializer

    def create(self, request):
        user_obj = request.user
        if not user_obj.is_staff:
            return Response({'errors': _('Not allowed')},
                            status=HTTP_403_FORBIDDEN)
        data = json.loads(request.body)
        if not data.get('robot_name'):
            return Response({'errors': _('Key missing or empty: robot_name')},
                            status=HTTP_400_BAD_REQUEST)
        module_obj = Module.objects.create(**data)
        if module_obj:
            res = {}
            res['id'] = module_obj.id
            res['robot_name'] = module_obj.robot_name
            return Response(res, status=HTTP_201_CREATED)
        return \
            Response({'errors': _('Something went wrong. Please try again')},
                     status=HTTP_500_INTERNAL_SERVER_ERROR)

    def update(self, request, pk=None):
        user_obj = request.user
        if not user_obj.is_staff:
            return Response({'errors': _('Not allowed')},
                            status=HTTP_403_FORBIDDEN)
        data = json.loads(request.body)
        if data.get('robot_name') == '':
            data.pop('robot_name', None)
        if data.get('language'):
            data.pop('language', None)
        module_obj = Module.objects.filter(id=pk).first()
        if module_obj:
            for k, v in data.items():
                setattr(module_obj, k, v)
            module_obj.save()
            return Response(status=HTTP_204_NO_CONTENT)
        else:
            return Response({'errors': _('Not found')},
                            status=HTTP_404_NOT_FOUND)
        return \
            Response({'errors': _('Something went wrong. Please try again')},
                     status=HTTP_500_INTERNAL_SERVER_ERROR)

    def destroy(self, request, pk=None):
        user_obj = request.user
        if not user_obj.is_staff:
            return Response({'errors': _('Not allowed')},
                            status=HTTP_403_FORBIDDEN)
        module_obj = Module.objects.filter(id=pk).first()
        if module_obj:
            module_obj.delete()
            return Response(status=HTTP_204_NO_CONTENT)
        else:
            return Response({'errors': _('Not found')},
                            status=HTTP_404_NOT_FOUND)
        return \
            Response({'errors': _('Something went wrong. Please try again')},
                     status=HTTP_500_INTERNAL_SERVER_ERROR)


class ModuleFAQViewSet(viewsets.ModelViewSet):
    ''' Module FAQ group viewset

    Create, Read, Delete
    Response format example:
    POST:
    {
        "id": 1
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
    permission_classes = (IsAuthenticated, IsAdminUser)
    queryset = ModuleFAQGroup.objects.all()
    serializer_class = ModuleFAQSerializer
    pagination_class = pagination.StandardPagination

    def get_queryset(self):
        mod_id = self.kwargs.get('id')
        module_obj = Module.objects.filter(id=mod_id).first()
        return ModuleFAQGroup.objects.filter(module=module_obj).order_by('-id')

    def create(self, request, id=None):
        module_obj = Module.objects.filter(id=id).first()
        if not module_obj:
            return Response({'errors': _('Not found')},
                            status=HTTP_404_NOT_FOUND)

        faq_total = ModuleFAQGroup.objects.filter(module_id=id).count()
        new_csv_id = faq_total + 1
        faq_obj = ModuleFAQGroup.objects.create(module_id=id,
                                                csv_group=new_csv_id)
        module_obj.faq_count = str(new_csv_id)
        module_obj.save()

        if faq_obj:
            res = {}
            res['id'] = faq_obj.id
            return Response(res, status=HTTP_201_CREATED)
        return Response({'errors': _('Create faq group failed')},
                        status=HTTP_500_INTERNAL_SERVER_ERROR)


class ModuleAnswerViewSet(viewsets.ModelViewSet):
    ''' Module answer viewset

    CRUD
    Special characters for identifying as field:
    {1:item}
    First is the order for showing fields. Second is the field name.
    Please use curly brackets as special keywords.

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
    permission_classes = (IsAuthenticated, IsAdminUser)
    queryset = ModuleAnswer.objects.all()
    serializer_class = ModuleAnswerSerializer

    def get_queryset(self):
        user_obj = self.request.user
        mod_id = self.kwargs.get('id')
        mod_obj = Module.objects.filter(id=mod_id).first()
        return ModuleAnswer.objects.filter(module=mod_obj)

    def create(self, request, id=None):
        user_obj = request.user
        mod_obj = Module.objects.filter(id=id).first()
        if not mod_obj:
            return Response({'errors': _('Not found')},
                            status=HTTP_404_NOT_FOUND)
        create_data = json.loads(request.body)
        ans_key = ['group', 'content']
        err_msg, valid_status = utils.key_validator(ans_key, create_data)
        if not valid_status:
            return Response({'errors': _(err_msg)},
                            status=HTTP_403_FORBIDDEN)
        mod_faq = ModuleFAQGroup.objects.filter(id=create_data.get('group'),
                                                module=mod_obj).first()
        if not mod_faq:
            return Response({'errors': _('Not found')},
                            status=HTTP_404_NOT_FOUND)
        ans_obj =\
            ModuleAnswer.objects.create(group=mod_faq, module=mod_obj,
                                        content=create_data.get('content'))
        if ans_obj:
            res = {}
            res['id'] = ans_obj.id
            res['content'] = ans_obj.content
            res['group'] = ans_obj.group.id
            return Response(res, status=HTTP_201_CREATED)
        return Response({'errors': _('Create failed')},
                        status=HTTP_400_BAD_REQUEST)

    def update(self, request, id=None, pk=None):
        user_obj = request.user
        mod_obj = Module.objects.filter(id=id).first()
        if not mod_obj:
            return Response({'errors': _('Not found')},
                            status=HTTP_404_NOT_FOUND)
        update_data = json.loads(request.body)
        ans_key = ['content']
        err_msg, valid_status = utils.key_validator(ans_key, update_data)
        if not valid_status:
            return Response({'errors': _(err_msg)},
                            status=HTTP_403_FORBIDDEN)
        ans_obj = ModuleAnswer.objects.filter(id=pk, module=mod_obj).first()
        if not ans_obj:
            return Response({'errors': _('Not found')},
                            status=HTTP_404_NOT_FOUND)
        ans_obj.content = update_data.get('content')
        ans_obj.save()
        return Response({'success': _('Update succeeded')},
                        status=HTTP_200_OK)


class ModuleQuestionViewSet(viewsets.ModelViewSet):
    ''' Module question viewset

    CRUD
    Special characters for identifying as field:
    {1:item}
    First is the order for showing fields. Second is the field name.
    Please use curly brackets as special keywords.

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
    permission_classes = (IsAuthenticated, IsAdminUser,)
    queryset = ModuleQuestion.objects.all()
    serializer_class = ModuleQuestionSerializer

    def get_queryset(self):
        user_obj = self.request.user
        mod_id = self.kwargs.get('id')
        mod_obj = Module.objects.filter(id=mod_id).first()
        return ModuleQuestion.objects.filter(module=mod_obj)

    def create(self, request, id=None):
        user_obj = request.user
        mod_obj = Module.objects.filter(id=id).first()
        if not mod_obj:
            return Response({'errors': _('Not found')},
                            status=HTTP_404_NOT_FOUND)
        create_data = json.loads(request.body)
        que_key = ['group', 'content']
        err_msg, valid_status = utils.key_validator(que_key, create_data)
        if not valid_status:
            return Response({'errors': _(err_msg)},
                            status=HTTP_403_FORBIDDEN)
        mod_faq = \
            ModuleFAQGroup.objects.filter(id=create_data.get('group'),
                                          module=mod_obj).first()
        if not mod_faq:
            return Response({'errors': _('Not found')},
                            status=HTTP_404_NOT_FOUND)
        que_obj = \
            ModuleQuestion.objects.create(group=mod_faq, module=mod_obj,
                                          content=create_data.get('content'))
        if que_obj:
            res = {}
            res['id'] = que_obj.id
            res['content'] = que_obj.content
            res['group'] = que_obj.group.id
            return Response(res, status=HTTP_201_CREATED)
        return Response({'errors': _('Create failed')},
                        status=HTTP_400_BAD_REQUEST)

    def update(self, request, id=None, pk=None):
        user_obj = request.user
        mod_obj = Module.objects.filter(id=id).first()
        if not mod_obj:
            return Response({'errors': _('Not found')},
                            status=HTTP_404_NOT_FOUND)
        update_data = json.loads(request.body)
        que_key = ['content']
        err_msg, valid_status = utils.key_validator(que_key, update_data)
        if not valid_status:
            return Response({'errors': _(err_msg)},
                            status=HTTP_403_FORBIDDEN)
        que_obj = ModuleQuestion.objects.filter(id=pk, module=mod_obj).first()
        if not que_obj:
            return Response({'errors': _('Not found')},
                            status=HTTP_404_NOT_FOUND)
        que_obj.content = update_data.get('content')
        que_obj.save()
        return Response({'success': _('Update succeeded')},
                        status=HTTP_200_OK)


class MemberModuleViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin,
                          viewsets.GenericViewSet):
    ''' Member get module data with faq limit

    Response format example:
    List
    [
        {
            "id": 1,
            "robot_name": "test",
            "available": false
        }
    ]

    Retrieve
    {
        "id": 1,
        "robot_name": "test",
        "greeting_msg": "Hi",
        "failed_msg": "I do not understand",
        "postback_title": "Related question",
        "language": "en",
        "created_at": "2010-10-10 00:00:00",
        "updated_at": "2010-10-11 00:00:00",
        "available": true
    }
    '''

    authentication_classes = (TokenAuthentication,)
    permission_classes = (IsAuthenticated,)
    queryset = Module.objects.all()
    serializer_class = MemberModuleSerializer


@csrf_exempt
@api_view(['POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated, IsAdminUser])
def upload_module_faq(request, pk=None):
    '''Upload module FAQ from CSV file

    Upload file with the key 'file'

    Special characters for identifying as field:
    {1:item}
    First is the order for showing fields. Second is the field name.
    Please use curly brackets as special keywords.

    File format:
    "Group", "Question", "Answer"
    "1", "How are you", "{1:mood}"
    "1", "Are you okey", ""
    "2", "Hi", "Hello"
    "2", "Hi Hi", "Hello Hello"
    '''
    if request.FILES.get('file'):
        module_obj = Module.objects.filter(id=pk).first()
        if module_obj:
            ModuleFAQGroup.objects.filter(module=module_obj).delete()
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
            faq_count = 0
            for row in data:
                faq_group = row[0]
                que = row[1]
                ans = row[2]
                group_obj, created = ModuleFAQGroup.objects.\
                    get_or_create(csv_group=int(faq_group), module=module_obj)
                if created:
                    faq_count += 1
                if ans != '':
                    ModuleAnswer.objects.create(group=group_obj, content=ans,
                                                module=module_obj)
                if que != '':
                    ModuleQuestion.objects.create(group=group_obj, content=que,
                                                  module=module_obj)
            module_obj.faq_count = faq_count
            module_obj.save()
            return Response({'success': _('Upload succeeded')},
                            status=HTTP_201_CREATED)
        return Response({'errors': _('Not found')},
                        status=HTTP_404_NOT_FOUND)
    return Response({'errors': _('No content')},
                    status=HTTP_404_NOT_FOUND)


@csrf_exempt
@api_view(['GET'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated, IsAdminUser])
def export_module_faq(request, pk=None):
    '''Export module FAQ data to CSV file
    '''
    module_obj = Module.objects.filter(id=pk).first()
    if module_obj:
        faqgroups = ModuleFAQGroup.objects.filter(module=module_obj)
        rows = [['Group', 'Question', 'Answer']]
        for faqgroup in faqgroups:
            answers = ModuleAnswer.objects.filter(group=faqgroup)
            questions = ModuleQuestion.objects.filter(group=faqgroup)
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
        headers = {'Content-Disposition': 'attachment;filename=module_faq.csv'}
        contents = csv_file.getvalue().encode('utf-8-sig')
        csv_file.close()
        return Response(contents, headers=headers, content_type='text/csv')
    return Response({'errors': _('Not found')},
                    status=HTTP_404_NOT_FOUND)


@csrf_exempt
@api_view(['GET'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def get_fields(request, pk=None):
    ''' Get keyword fields in faq and return to the client
    '''

    module_obj = Module.objects.filter(id=pk).first()
    if not module_obj:
        return Response({'errors': _('Not found')}, status=HTTP_404_NOT_FOUND)

    field_list = []
    keywords = {}
    reg = r'{\w+:\w+}'
    ans_qry = ModuleAnswer.objects.filter(module=module_obj)
    que_qry = ModuleQuestion.objects.filter(module=module_obj)
    for ans in ans_qry:
        if '{' not in ans.content:
            continue
        sentence = ans.content
        words = re.findall(reg, sentence)
        for s in words:
            s = s.replace('{', '')
            s = s.replace('}', '')
            sep_order_item = s.split(':')
            if not keywords.get(sep_order_item[1], None):
                try:
                    order_item = int(sep_order_item[0])
                    keywords[sep_order_item[1]] = sep_order_item[0]
                except:
                    print('Order cannot be a string')

    for que in que_qry:
        if '{' not in que.content:
            continue
        sentence = que.content
        words = re.findall(reg, sentence)
        for s in words:
            s = s.replace('{', '')
            s = s.replace('}', '')
            sep_order_item = s.split(':')
            if not keywords.get(sep_order_item[1], None):
                try:
                    order_item = int(sep_order_item[0])
                    keywords[sep_order_item[1]] = sep_order_item[0]
                except:
                    print('Order cannot be a string')
    sorted_keys = sorted(keywords.items(), key=lambda kw: int(kw[1]))
    for key in sorted_keys:
        field_list.append(key[0])
    res = {}
    res['fields'] = field_list
    return Response(res, status=HTTP_200_OK)
