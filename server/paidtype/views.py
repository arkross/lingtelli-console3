import json

from django.shortcuts import render
from django.utils.translation import gettext as _
from rest_framework import viewsets
from rest_framework.mixins import (RetrieveModelMixin, ListModelMixin,
                                   UpdateModelMixin)
from rest_framework.response import Response
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.status import (
    HTTP_200_OK,
    HTTP_400_BAD_REQUEST,
    HTTP_403_FORBIDDEN,
    HTTP_404_NOT_FOUND
)

from .serializers import PaidTypeSerializer
from chat_console_3 import utils

from .models import PaidType


class PaidTypeViewset(RetrieveModelMixin, ListModelMixin, UpdateModelMixin,
                      viewsets.GenericViewSet):
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
            for k in paidtype_data:
                if k == 'third_party':
                        paidtype_obj.thirdparty.set(paidtype_data.get(k))
                        continue
                setattr(paidtype_obj, k, paidtype_data.get(k))
            paidtype_obj.save()
            return Response({'success':_('Update succeeded')},
                            status=HTTP_200_OK)
        return Response({'errors':_('No content')},
                        status=HTTP_400_BAD_REQUEST)