from rest_framework import serializers
from .models import ModuleAnswer, ModuleQuestion
from account.models import AccountInfo
from chatbot.models import Chatbot
from faq.models import FAQGroup


class ModuleSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    robot_name = serializers.CharField()
    greeting_msg = serializers.CharField()
    failed_msg = serializers.CharField()
    postback_title = serializers.CharField()
    language = serializers.CharField()
    created_at = serializers.DateTimeField()
    updated_at = serializers.DateTimeField()
    faq_count = serializers.CharField(read_only=True)

    def to_representation(self, instance):
        module_data = super().to_representation(instance)
        res = {}
        request = self.context.get('request')
        if not request.parser_context.get('kwargs'):
            res['id'] = module_data.get('id')
            res['robot_name'] = module_data.get('robot_name')
        else:
            res = module_data
        return res


class ModuleFAQSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    module = serializers.IntegerField()
    csv_group = serializers.IntegerField()

    def to_representation(self, instance):
        res = {}
        res['group'] = instance.id
        ans_qry = \
            ModuleAnswer.objects.filter(group=instance.id).order_by('id')
        que_qry = \
            ModuleQuestion.objects.filter(group=instance.id).order_by('id')
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


class ModuleAnswerSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    content = serializers.CharField()
    module = serializers.IntegerField()
    group = serializers.IntegerField()

    def to_representation(self, instance):
        res = {}
        res['id'] = instance.id
        res['group'] = instance.group.id
        res['content'] = instance.content
        return res


class ModuleQuestionSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    content = serializers.CharField()
    module = serializers.IntegerField()
    group = serializers.IntegerField()

    def to_representation(self, instance):
        res = {}
        res['id'] = instance.id
        res['group'] = instance.group.id
        res['content'] = instance.content
        return res


class MemberModuleSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    robot_name = serializers.CharField()
    greeting_msg = serializers.CharField()
    failed_msg = serializers.CharField()
    postback_title = serializers.CharField()
    language = serializers.CharField()
    created_at = serializers.DateTimeField()
    updated_at = serializers.DateTimeField()
    faq_count = serializers.CharField()

    def to_representation(self, instance):
        module_data = super().to_representation(instance)
        res = {}
        available = False
        request = self.context.get('request')
        user_obj = request.user
        acc_obj = AccountInfo.objects.filter(user=user_obj).first()
        faq_upper_limit = acc_obj.paid_type.faq_amount
        bots = Chatbot.objects.filter(user=user_obj)
        faq_total = 0
        for bot in bots:
            faq_total += FAQGroup.objects.filter(chatbot=bot).count()
        faq_left = int(faq_upper_limit) - faq_total
        if faq_left >= int(module_data.get('faq_count')):
            available = True
        if not request.parser_context.get('kwargs'):
            res['id'] = module_data.get('id')
            res['robot_name'] = module_data.get('robot_name')
            res['available'] = available
        else:
            res = module_data
            res['available'] = available
        return res
