from django.db import models

LANGUAGE_CHOICE = {
    ('en', 'en'),
    ('tw', 'tw'),
    ('cn', 'cn')
}

MODULE_FIELD_CHOICE = {
    ('ans', 'Answer'),
    ('que', 'Question')
}


class Module(models.Model):
    ''' A module for applying to empty bot

    Args:
        robot_name: Chatbot name.
        greeting_msg: When starting chatting, this message will be shown.
        failed_msg: When NLU server cannot give the answer, this message will
            be shown.
        postback_title: Showing postback title message.
        created_at: Module created time.
        language: The language the bot is using.
    '''

    robot_name = models.CharField(max_length=100, blank=False, null=False)
    greeting_msg = models.TextField(blank=True, null=True)
    failed_msg = models.TextField(blank=True, null=True)
    postback_title = \
        models.CharField(max_length=255,
                         default='Please choose the similar question.')
    created_at = models.DateTimeField(auto_now_add=True, auto_now=False,
                                      blank=False, null=True)
    updated_at = models.DateTimeField(auto_now_add=False, auto_now=True,
                                      blank=True, null=True)
    language = models.CharField(max_length=10, choices=LANGUAGE_CHOICE,
                                default='tw')
    faq_count = models.CharField(max_length=100, default='0')

    class Meta:
        db_table = 'module'

    def __str__(self):
        return self.robot_name


class ModuleFAQGroup(models.Model):
    '''Module question and answer group

    Args:
        module: Module object.
        csv_group: Getting groups for uploading faq with csv file.
    '''

    module = models.ForeignKey(Module, related_name='modulefaq_module',
                               on_delete=models.CASCADE)
    csv_group = models.IntegerField(default=0)

    class Meta:
        db_table = 'module_faqgroup'


class ModuleAnswer(models.Model):
    '''Module of answer set

    Args:
        content: Answer content.
        created_at: Answer created time.
        updated_at: Answer updated_time.
        module: Module object.
        group: Module FAQ group for answer to connect to questions.
    '''

    content = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True, auto_now=False,
                                      blank=False, null=False)
    updated_at = models.DateTimeField(auto_now_add=False, auto_now=True,
                                      blank=True, null=True)
    module = models.ForeignKey(Module, related_name='moduleans_module',
                               on_delete=models.CASCADE)
    group = models.ForeignKey(ModuleFAQGroup,
                              related_name='moduleans_modulefaq',
                              on_delete=models.CASCADE)

    class Meta:
        db_table = 'module_answer'

    def __str__(self):
        return self.module.robot_name


class ModuleQuestion(models.Model):
    '''Module of question set

    Args:
        content: Question content.
        created_at: Question created time.
        updated_at: Question updated time.
        module: Module object.
        group: Module FAQ group for answer to connect to questions.
    '''

    content = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True, auto_now=False,
                                      blank=False, null=False)
    updated_at = models.DateTimeField(auto_now_add=False, auto_now=True,
                                      blank=True, null=True)
    module = models.ForeignKey(Module, related_name='moduleque_module',
                               on_delete=models.CASCADE)
    group = models.ForeignKey(ModuleFAQGroup,
                              related_name='moduleque_modulefaq',
                              on_delete=models.CASCADE)

    class Meta:
        db_table = 'module_question'

    def __str__(self):
        return self.module.robot_name
