from django.db import models

from chatbot.models import Chatbot

RESPONSER_CHOICES = {
    ('NONE', 'Nobody'),
    ('BOT', 'BOT'),
    ('USER', 'USER')
}

SAVE_STATUS = {
    ('0', 'Not saved'),
    ('1', 'Saved'),
    ('2', 'Group does not exisit')
}

PLATFORM_CHOICES = {
    ('LINE', 'Line'),
    ('FB', 'Facebook'),
    ('WEB', 'Web script'),
    ('API', 'Api'),
    ('OTHER', 'Other platforms'),
}


class History(models.Model):
    '''Chatting history

    Chatting history saving from chat-server. In chat-console just can show the
    history.

    Args:
        chatbot: Chatbot object.
        user_id: Created by line and facebook. For website created by us inside
            script.
        sender: Message send by bot or user.
        created_at: Message created time.
        session_id: Session id.
        content: Message content.
        qa_pair: For pairing the complete conversation.
        platform: Message recieve from what platform
    '''

    chatbot = models.ForeignKey(Chatbot, related_name='history_chatbot',
                                on_delete=models.CASCADE)
    user_id = models.CharField(max_length=100, blank=False, null=False,
                               default='_nobody_')
    sender = models.CharField(max_length=10, choices=RESPONSER_CHOICES,
                              default='0')
    created_at = models.DateTimeField(auto_now_add=True, auto_now=False,
                                      blank=False, null=False)
    session_id = models.TextField(blank=False, null=False)
    content = models.TextField(blank=True, null=False)
    qa_pair = models.CharField(max_length=100, blank=False, null=False)
    platform = models.CharField(max_length=100, choices=PLATFORM_CHOICES,
                                default='OTHER')

    class Meta:
        db_table = 'history'

    def __str__(self):
        return self.chatbot.robot_name


class QuestionMatchHistory(models.Model):
    '''User question matching inside faq group
    When user select a question which is similar to the question user asked,
    the pair will be saved inside this model.

    Args:
        user_id: Created by line and facebook. For website created by us inside
            script.
        ori_question: Original question the user asked
        select_question: The question user chose that similar to their question
        group: FAQgroup id. Did not connect to object cause faq can be changed
        chatbot: Chatbot object
        status: Create question to faq list status
        platform: Message recieve from what platform
    '''

    user_id = models.CharField(max_length=100, blank=False, null=False,
                               default='_nobody_')
    ori_question = models.TextField(blank=True, null=True)
    select_question = models.TextField(blank=True, null=True)
    group = models.CharField(max_length=255, blank=True, null=True)
    chatbot = models.ForeignKey(Chatbot, related_name='match_chatbot',
                                on_delete=models.CASCADE)
    status = models.CharField(max_length=10, choices=SAVE_STATUS, default='0')
    platform = models.CharField(max_length=100, choices=PLATFORM_CHOICES,
                                default='OTHER')

    class Meta:
        db_table = 'match_history'

    def __str__(self):
        return self.chatbot.robot_name
