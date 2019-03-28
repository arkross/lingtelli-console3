from django.db import models
from django.contrib.auth.models import User

from thirdparty.models import ThirdParty


RESPONSER_CHOICES = {
    ('NONE', 'Nobody'),
    ('BOT', 'BOT'),
    ('USER', 'USER')
}

LANGUAGE_CHOICE = {
    ('en', 'en'),
    ('tw', 'tw'),
    ('cn', 'cn')
}

BOT_TYPE = {
    ('TASK', 'TASK'),
    ('NORMAL', 'NORMAL')
}

CHOOSE_ANS_TYPE = {
    ('1', 'FIRST'),
    ('2', 'RANDOM')
}


class Chatbot(models.Model):
    '''Chatbot object

    Args:
        robot_name: Chatbot name.
        greeting_msg: When starting chatting, this message will be shown.
        failed_msg: When NLU server cannot give the answer, this message will
            be shown.
        vendor_id: The chatbot unique id.
        created_at: Chatbot created time.
        updated_at: Chatbot updated time.
        third_party: Platform chatbot is using on.
        user: User who's owning the chatbot.
        activate: Chatbot is activated or not.
        postback_activate: For forcing giving similar questions to client.
        postback_title: Showing postback title message.
        delete_confrim: When deleting, use this flag to make sure the client
                        has confirmed to delete this bot.
        bot_type: The normal bot and task bot are now using the same model. Use
                  this flag to separate between normal and task bot.
        assign_user: Only can be assigned when the bot type is task and the 
                     user type is staff. For assigning the task bot created by
                     the staff to client to use.
        hide_status: Hiding the bot when user paid type downgraded
        choose_answer: The way of choosing answer to reply.
    '''

    robot_name = models.CharField(max_length=100, blank=False, null=False)
    greeting_msg = models.TextField(blank=True, null=True)
    failed_msg = models.TextField(blank=True, null=True)
    vendor_id = models.CharField(max_length=100, blank=True, null=True,
                                 unique=True)
    created_at = models.DateTimeField(auto_now_add=True, auto_now=False,
                                      blank=False, null=True)
    updated_at = models.DateTimeField(auto_now_add=False, auto_now=True,
                                      blank=True, null=True)
    third_party = models.ManyToManyField(ThirdParty, 
                                         through='BotThirdPartyGroup',
                                         related_name='group_bot_party')
    user = models.ForeignKey(User, related_name='chatbot_user',
                             on_delete=models.CASCADE)
    activate = models.BooleanField(default=True)
    language = models.CharField(max_length=10, choices=LANGUAGE_CHOICE,
                                default='tw')
    postback_activate = models.BooleanField(default=True)
    postback_title = \
        models.CharField(max_length=255, 
                         default='請選擇跟你問題類似的問題，如果沒有請繼續問其他問題。')
    delete_confirm = models.BooleanField(default=False)
    bot_type = models.CharField(max_length=10, choices=BOT_TYPE,
                                default='NORMAL')
    assign_user = models.ForeignKey(User, related_name='assign_user',
                                    blank=True, null=True,
                                    on_delete=models.CASCADE)
    hide_status = models.BooleanField(default=False)
    choose_answer = models.CharField(max_length=10, choices=CHOOSE_ANS_TYPE,
                                     default='1')

    class Meta:
        db_table = 'chatbot'
    
    def __str__(self):
        return self.robot_name

    def get_third_parties(self):
        return ",\n".join([t.name for t in self.third_party.all()])


class BotThirdPartyGroup(models.Model):
    '''Chatbot connect to third party

    This is a group to connect chatbot to multiple platforms.

    Args:
        chatbot: Chatbot object
        thridparty: ThirdParty object
    '''

    chatbot = models.ForeignKey(Chatbot, related_name='group_chatbot',
                                on_delete=models.CASCADE)
    third_party = models.ForeignKey(ThirdParty, related_name='group_thirdparty',
                                   on_delete=models.CASCADE)

    class Meta:
        db_table = 'bot_third_party_group'


class Line(models.Model):
    '''Datat for line webhook

    Args:
        secret: Secret generated from line.
        token: Token generated from line.
        chatbot: Chatbot object.
    '''

    secret = models.CharField(max_length=255, blank=True, null=False)
    token = models.CharField(max_length=255, blank=True, null=False)
    chatbot = models.ForeignKey(Chatbot, related_name='line_chatbot',
                                on_delete=models.CASCADE)

    class Meta:
        db_table = 'bot_line'


class Facebook(models.Model):
    '''Data for facebook webhook

    Args:
        token: Token generated from facebook.
        verify_str: Created by user.
        chatbot: Chatbot object.
    '''

    token = models.CharField(max_length=255, blank=True, null=False)
    verify_str = models.CharField(max_length=255, blank=True, null=False)
    chatbot = models.ForeignKey(Chatbot, related_name='facebook_chatbot',
                                on_delete=models.CASCADE)

    class Meta:
        db_table = 'bot_facebook'