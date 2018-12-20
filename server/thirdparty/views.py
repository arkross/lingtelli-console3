from django.shortcuts import render
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework import viewsets
from rest_framework.mixins import RetrieveModelMixin, ListModelMixin

from .serializers import ThirdPartySerializer

from .models import ThirdParty

class ThirdpartyViewset(RetrieveModelMixin, ListModelMixin,
                        viewsets.GenericViewSet):
    '''Thirdparty view set

    Can only read the thirdparty

    Response format example:
    {
        "id": 1,
        "name": "Facebook"
    }
    '''

    authentication_classes = (TokenAuthentication,)
    permission_classes = (IsAuthenticated,)
    queryset = ThirdParty.objects.all()
    serializer_class = ThirdPartySerializer
