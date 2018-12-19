from django.db import models

from chatbot.models import Chatbot
''''
*** IMPORTANT MESSAGE ***
2 Types of bot using the same faq structure
NORMAL bot will have many questions to many answers
TASK bot will have many questions to one answer only

When creating new answer with more than one should check if the bot type is
NORMAL. If not, should not allow create additional answer.
'''

class FAQGroup(models.Model):
    '''Question and answer group
    '''

    chatbot = models.ForeignKey(Chatbot, related_name='faqgroup_chatbot',
                                on_delete=models.CASCADE)
    csv_group = models.IntegerField(default=0)

    class Meta:
        db_table = 'faqgroup'


class FAQStatus(models.Model):
    '''Conversation status

    Store the converstation which has successed or not.
    Args:
        chatbot: Chatbot object.
        qa_pair: The question and answer pair special id.
        status: The conversation has successed or failed.
    '''

    chatbot = models.ForeignKey(Chatbot, related_name='faqstatus_chatbot', 
                                on_delete=models.CASCADE)
    qa_pair = models.CharField(max_length=100, blank=False, null=False)
    success = models.BooleanField(default=True)

    class Meta:
        db_table = 'faqstatus'
    
    def __str__(self):
        return self.chatbot.robot_name


class Answer(models.Model):
    '''Answer for questions

    Args:
        content: Answer content.
        created_at: Answer created time.
        updated_at: Answer updated_time.
        chatbot: Chatbot object.
        group: FAQ group for answer to connect to questions.
    '''

    content = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True, auto_now=False,
                                      blank=False, null=False)
    updated_at = models.DateTimeField(auto_now_add=False, auto_now=True,
                                      blank=True, null=True)
    chatbot = models.ForeignKey(Chatbot, related_name='answer_chatbot',
                                on_delete=models.CASCADE)
    group = models.ForeignKey(FAQGroup, related_name='answer_faqgroup',
                              on_delete=models.CASCADE)

    class Meta:
        db_table = 'answer'

    def __str__(self):
        return self.chatbot.robot_name


class Question(models.Model):
    '''Question set

    Args:
        content: Question content.
        created_at: Question created time.
        updated_at: Question updated time.
        chatbot: Chatbot object.
        answer: Answer object.
        group: FAQ group for answer to connect to questions.
    '''

    content = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True, auto_now=False,
                                      blank=False, null=False)
    updated_at = models.DateTimeField(auto_now_add=False, auto_now=True,
                                      blank=True, null=True)
    chatbot = models.ForeignKey(Chatbot, related_name='question_chatbot',
                                on_delete=models.CASCADE)
    group = models.ForeignKey(FAQGroup, related_name='question_faqgroup',
                              on_delete=models.CASCADE)
    class Meta:
        db_table = 'question'

    def __str__(self):
        return self.chatbot.robot_name
