from rest_framework import serializers

class ReportSerializer(serializers.Serializer):
    chatbot = serializers.CharField(read_only=True)
    user_id = serializers.CharField(read_only=True)
    sender = serializers.CharField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
    session_id = serializers.CharField(read_only=True)
    content = serializers.CharField(read_only=True)
    qa_pair = serializers.CharField(read_only=True)

    def to_representation(self, obj):
        res = super().to_representation(obj)
        return res