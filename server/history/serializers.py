from rest_framework import serializers


class HistorySerializer(serializers.Serializer):

    sender = serializers.CharField(max_length=10, read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
    content = serializers.CharField(read_only=True)
    qa_pair = serializers.CharField(read_only=True)
    platform = serializers.CharField(read_only=True)
    user_id = serializers.CharField(read_only=True)

    def to_representation(self, obj):
        obj.created_at = obj.created_at.strftime('%Y/%m/%d %H:%M:%S')
        res = super().to_representation(obj)
        return res


class QuestionMatchHistorySerializer(serializers.Serializer):

    id = serializers.IntegerField(read_only=True)
    ori_question = serializers.CharField(read_only=True)
    select_question = serializers.CharField(read_only=True)
    group = serializers.CharField(read_only=True)
    status = serializers.CharField(read_only=True)
    platform = serializers.CharField(read_only=True)
    user_id = serializers.CharField(read_only=True)
