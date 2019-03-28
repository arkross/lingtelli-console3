from rest_framework import serializers

from .models import FAQGroup, Answer, Question

class FAQGrouptSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    chatbot = serializers.IntegerField()
    hide_status = serializers.BooleanField()

    def to_representation(self, instance):
        res = {}
        res['group'] = instance.id
        ans_qry = Answer.objects.filter(group=instance.id).order_by('id')
        que_qry = Question.objects.filter(group=instance.id).order_by('id')
        ans_list = []
        que_list = []
        if ans_qry:
            for ans in ans_qry:
                ans_data = {}
                ans_data['id'] = ans.id
                ans_data['content'] = ans.content
                ans_list.append(ans_data)
        if que_qry:
            for que in que_qry:
                que_data = {}
                que_data['id'] = que.id
                que_data['content'] = que.content
                que_list.append(que_data)
        res['answer'] = ans_list
        res['question'] = que_list
        return res


class AnswerSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    content = serializers.CharField()
    chatbot = serializers.IntegerField()
    group = serializers.IntegerField()

    def to_representation(self, instance):
        res = {}
        res['id'] = instance.id
        res['group'] = instance.group.id
        res['content'] = instance.content
        return res


class QuestionSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    content = serializers.CharField()
    chatbot = serializers.IntegerField()
    group = serializers.IntegerField()

    def to_representation(self, instance):
        res = {}
        res['id'] = instance.id
        res['group'] = instance.group.id
        res['content'] = instance.content
        return res