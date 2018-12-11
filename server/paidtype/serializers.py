from rest_framework import serializers

from thirdparty.serializers import ThirdPartySerializer

class PaidTypeSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    name = serializers.CharField()
    duration = serializers.CharField()
    bot_amount = serializers.CharField()
    faq_amount = serializers.CharField()
    third_party = ThirdPartySerializer(many=True)