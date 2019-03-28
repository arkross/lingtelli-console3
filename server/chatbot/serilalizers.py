from rest_framework import serializers

from thirdparty.serializers import ThirdPartySerializer

from django.contrib.auth.models import User
from .models import Line, Facebook, BotThirdPartyGroup


class ChatbotSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    robot_name = serializers.CharField(required=True)
    greeting_msg = serializers.CharField()
    failed_msg = serializers.CharField()
    vendor_id = serializers.CharField()
    created_at = serializers.DateTimeField()
    updated_at = serializers.DateTimeField()
    third_party = ThirdPartySerializer()
    activate = serializers.BooleanField()
    language = serializers.CharField()
    postback_activate = serializers.BooleanField()
    postback_title = serializers.CharField()
    delete_confirm = serializers.BooleanField()
    bot_type = serializers.CharField()
    hide_status = serializers.BooleanField()
    choose_answer = serializers.CharField()

    def to_representation(self, instance):
        chatbot_data = super().to_representation(instance)
        res = {}
        request = self.context.get('request')
        if not request.parser_context.get('kwargs'):
            res['id'] = chatbot_data.get('id')
            res['robot_name'] = chatbot_data.get('robot_name')
        else:
            res = chatbot_data
            third_partys = BotThirdPartyGroup.objects\
                .filter(chatbot_id=chatbot_data.get('id'))\
                .values_list('third_party', flat=True)
            res['third_party'] = third_partys
            res['user'] = instance.user.id
            if instance.assign_user:
                res['assign_user'] = instance.assign_user.id
            else:
                res['assign_user'] = None
        return res


class LineSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    secret = serializers.CharField()
    token = serializers.CharField()


class FacebookSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    token = serializers.CharField()
    verify_str = serializers.CharField()
