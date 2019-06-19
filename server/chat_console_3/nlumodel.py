'''NLU Related Features
'''
import requests
import json
import os

from django.http import HttpResponse

from chatbot.models import Chatbot
from faq.models import FAQGroup, Answer, Question

env = os.environ.get('ENV')
if env:
    if env == 'DEV':
        from .settings.development import NLU_HOST, SEMANTIC_HOST
    else:
        from .settings.production import NLU_HOST, SEMANTIC_HOST
else:
    from .settings.common import NLU_HOST, SEMANTIC_HOST


def create_model(chatbot_obj):
    '''Create NLU model

    When creating new chatbot, create an initial NLU model for it.

    Args:
        chatbot_obj: New created chatbot object.

    Return:
        Boolean: True if NLU model creates successfuly. False if not.

    Exceptions:
        requests.Timeout: NLU server request timeout.
    '''

    chatbot_id = chatbot_obj.id
    url = NLU_HOST + str(chatbot_id) + '/model'
    data = {'lang': chatbot_obj.language}
    try:
        response = requests.post(url, data=data, timeout=10)
    except Exception as e:
        print('XXX NLU server timeout XXX')
        return False, 'NLU server timeout: ' + str(e)
    else:
        if response.status_code == 200:
            print('XXX Create model successed XXX')
            return True, ''
        else:
            print('XXX Create model failed XXX')
            return False, 'Create model failed: ' +\
                str(json.loads(response.content))


def train_model(chatbot_obj):
    '''Train NLU model

    When uploaded a new FAQ csv file or updated the FAQ data, train the NLU
    model.

    Args:
        chatbot_obj: Chatbot object.

    Returns:
        If chatbot has been found, return the response from NLU server. NLU
        server will return successfully create message or failed.

    Raises:
        requests.Timeout: NLU server request timeout.
    '''

    response = {}
    if chatbot_obj:
        chatbot_id = chatbot_obj.id
        url = NLU_HOST + str(chatbot_id) + '/model'
        data = {'lang': chatbot_obj.language}
        status, errors = get_enhanced_qa(chatbot_obj)
        if status is not True:
            return False, errors
        try:
            response = requests.put(url, data=data)
        except Exception as e:
            print('XXX NLU server timeout XXX')
            return False, 'NLU server timeout: ' + str(e)
        if response.status_code == 200:
            print('XXX Train NLU Model Successed XXX')
            return True, ''
        else:
            print('XXX NLU server error XXX')
            return False, 'NLU server error: ' +\
                str(json.loads(response.content))


def delete_model(chatbot_obj):
    '''Delete NLU model

    Deleting NLU model when chatbot has been deleted or chatbot created failed.

    Args:
        chatbot_obj: The chatbot object.

    Raises:
        requests.Timeout: NLU server request timeout.
    '''
    chatbot_id = chatbot_obj.id
    url = NLU_HOST + str(chatbot_id) + '/model'
    try:
        requests.delete(url, timeout=10)
    except Exception as e:
        print('XXX Delete NLU model error: ' + str(e) + ' XXX')


def initial_question_answer(chatbot_obj):
    '''Initial QA for model

    Initial the question model and answer model when chatbot created the first
    time.

    Args:
        chatbot_obj: The chatbot object.
    '''
    faq_group = {
        'chatbot': chatbot_obj
    }
    faq_group_obj = FAQGroup.objects.create(**faq_group)

    ans_content = {
        'en': 'Hi, what can I help you?',
        'cn': '你好很高兴为你服务',
        'tw': '你好很高興為你服務'
    }
    ques_content = {
        'en': 'Hi!',
        'cn': '嗨',
        'tw': '嗨'
    }
    answer = {
        'content': ans_content.get(chatbot_obj.language),
        'chatbot': chatbot_obj,
        'group': faq_group_obj
    }
    Answer.objects.create(**answer)

    question = {
        'content': ques_content.get(chatbot_obj.language),
        'train_content': ques_content.get(chatbot_obj.language),
        'chatbot': chatbot_obj,
        'group': faq_group_obj
    }
    Question.objects.create(**question)


def get_enhanced_qa(bot_obj):
    '''Send question to Claude's service to enhance the content

    Only question needs to modify. Save the result in question train_content
    column.
    '''

    que_qry = Question.objects.filter(chatbot=bot_obj)
    data = []
    for que in que_qry:
        que_dict = {}
        que_dict['id'] = que.id
        que_dict['content'] = que.content
        data.append(que_dict)
    try:
        response = requests.post(SEMANTIC_HOST, json=data)
    except Exception as e:
        print('XXX Semantic server timeout error: ', str(e))
        return False, 'Semantic server timeout error: ' + str(e)
    if response.status_code == 200:
        que_data = json.loads(response.content)
        print(que_data)
        for que in que_data:
            Question.objects.filter(id=que.get('id'))\
                    .update(train_content=que.get('content'))
        return True, ''
    else:
        return False, 'Semantic error: ' + str(response.__dict__)
