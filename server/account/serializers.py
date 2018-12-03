from rest_framework import serializers, status

from django.contrib.auth.models import User
from account.models import AccountInfo

class MemberSerializer(serializers.Serializer):
    '''
    Only username, first_name can be updated and read.
    Password can only be updated.

    Add account_info data, paid_type, start_date, expire_date and language when
    GET member data.
    '''

    id = serializers.IntegerField(read_only=True)
    username = serializers.CharField(required=False)
    password = serializers.CharField(required=False)
    first_name = serializers.CharField(required=False)

    def validate(self, data):
        pass

    def update(self, instance, validated_data):
        pass
        

