from rest_framework import serializers

from django.contrib.auth.models import User
from account.models import AccountInfo

# Member related
class MemberSerializer(serializers.Serializer):
    '''Member profile

    Only username, first_name can be updated and read.
    Password can only be updated.

    Add account_info data, paid_type, start_date, expire_date and language when
    GET member data.
    '''

    id = serializers.IntegerField(read_only=True)
    username = serializers.CharField(required=False)
    first_name = serializers.CharField(required=False)

    def to_representation(self, instance):
        user_data = super().to_representation(instance)
        acc_obj = AccountInfo.objects.filter(user=user_data.get('id')).first()
        user_data['paid_type'] = acc_obj.paid_type.name
        user_data['start_date'] = acc_obj.start_date
        user_data['expire_date'] = acc_obj.expire_date
        user_data['language'] = acc_obj.language
        return user_data


# Agent related
class AgentMemberSerializer(serializers.Serializer):
    '''For agent to manage members

    Only paidtype can be updated
    '''

    user = serializers.IntegerField(read_only=True)
    start_date = serializers.DateTimeField(read_only=True)
    expire_date = serializers.DateTimeField(read_only=True)
    paid_type = serializers.IntegerField()

