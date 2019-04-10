import json

from django.shortcuts import render
from django.utils.translation import gettext as _
from rest_framework import viewsets
from rest_framework.mixins import (RetrieveModelMixin, ListModelMixin,
                                   UpdateModelMixin, CreateModelMixin)
from rest_framework.response import Response
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.status import (
    HTTP_200_OK,
    HTTP_201_CREATED,
    HTTP_400_BAD_REQUEST,
    HTTP_403_FORBIDDEN,
    HTTP_404_NOT_FOUND
)

from .serializers import PaidTypeSerializer
from chat_console_3 import utils

from .models import PaidType


class PaidTypeViewset(RetrieveModelMixin, ListModelMixin, UpdateModelMixin,
                      CreateModelMixin, viewsets.GenericViewSet):
    '''Paid type viewset

    Using RU with paid type related data

    Request format example:
    PUT:
    {
        "name": "new paidtype name",
        "duration": "100_y",
        "bot_amount": "20",
        "faq_amount": "1000",
        "third_party": [1,2,3]
    }

    Response format example:
    {
        "name": "paidtype name",
        "duration": "1_d",
        "bot_amount": "1",
        "faq_amount": "50",
        "third_party": [1]
    }
    '''

    authentication_classes = (TokenAuthentication,)
    permission_classes = (IsAuthenticated,)
    queryset = PaidType.objects.all()
    serializer_class = PaidTypeSerializer

    def get_queryset(self):
        return PaidType.objects.filter(user_type='M')

    def create(self, request):
        '''Create paidtype

        Create new paidtype
        '''
        if request.user.is_staff == False:
            return Response({'errors':_('Not allowed')},
                            status=HTTP_403_FORBIDDEN)
        if request.body:
            paidtype_data = json.loads(request.body)
            paidtype_keys = ['name', 'duration', 'bot_amount', 'faq_amount',
                            'third_party']
            err_msg, key_status = utils.key_validator(paidtype_keys,
                                                      paidtype_data)
            if not key_status:
                return Response({'errors':_(err_msg)},
                                status=HTTP_403_FORBIDDEN)
            third_parties = paidtype_data.pop('third_party')
            paidtype_data['user_type'] = 'M'
            paidtype_obj = PaidType.objects.create(**paidtype_data)
            if not paidtype_obj:
                return Response({'errors':_('Create paidtype failed')},
                                status=HTTP_400_BAD_REQUEST)
            paidtype_obj.third_party.set(third_parties)
            paidtype_obj.save()
            res = {}
            res['id'] = paidtype_obj.id
            res['name'] = paidtype_obj.name
            return Response(res, status=HTTP_201_CREATED)
        return Response({'errors':_('No content')},
                        status=HTTP_400_BAD_REQUEST)

    def update(self, request, pk=None):
        '''Update paidtype data

        Only agent can update paidtype data.
        '''
        # To check if request body is empty
        if request.user.is_staff == False:
            return Response({'errors':_('Not allowed')},
                            status=HTTP_403_FORBIDDEN)
        if request.body:
            paidtype_obj = PaidType.objects.filter(id=pk).first()
            if not paidtype_obj:
                return Response({'errors':_('Not found')},
                                status=HTTP_404_NOT_FOUND)

            paidtype_data = json.loads(request.body)
            paidtype_keys = ['name', 'duration', 'bot_amount', 'faq_amount',
                            'third_party']
            err_msg, key_status = utils.key_validator(paidtype_keys,
                                                      paidtype_data)
            if not key_status:
                return Response({'errors':_(err_msg)},
                                status=HTTP_403_FORBIDDEN)
            for k in paidtype_data:
                if k == 'third_party':
                    paidtype_obj.third_party.set(paidtype_data.get(k))
                    continue
                setattr(paidtype_obj, k, paidtype_data.get(k))
            paidtype_obj.save()
            utils.reset_all_bots_thirdparty(paidtype_obj)
            return Response({'success':_('Update succeeded')},
                            status=HTTP_200_OK)
        return Response({'errors':_('No content')},
                        status=HTTP_400_BAD_REQUEST)