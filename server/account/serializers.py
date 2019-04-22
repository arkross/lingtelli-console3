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
class AgentSerializer(serializers.Serializer):
    '''Agent profile
    '''

    id = serializers.IntegerField(read_only=True)
    username = serializers.CharField(required=False)
    first_name = serializers.CharField(required=False)

    def to_representation(self, instance):
        user_data = super().to_representation(instance)
        request = self.context.get('request')
        if not request.parser_context.get('kwargs'):
            res = {}
            res['id'] = user_data.get('id')
            res['username'] = user_data.get('username')
            return res
        user_data['agent_type'] = 'superuser'
        if not instance.is_superuser:
            acc_obj = \
                AccountInfo.objects.filter(user=user_data.get('id')).first()
            user_data['paid_type'] = acc_obj.paid_type.name
            user_data['start_date'] = acc_obj.start_date
            user_data['expire_date'] = acc_obj.expire_date
            user_data['language'] = acc_obj.language
            user_data['agent_type'] = 'staff'
        return user_data


class AgentMemberSerializer(serializers.Serializer):
    '''For agent to manage members

    Only paidtype can be updated
    '''

    id = serializers.IntegerField(read_only=True)
    username = serializers.CharField(read_only=True)
