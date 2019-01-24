import json
from django.test import TestCase, Client

from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token
from account.models import AccountInfo
from chatbot.models import Chatbot
from paidtype.models import PaidType
from thirdparty.models import ThirdParty
from faq.models import FAQGroup
from history.models import History, QuestionMatchHistory


class HistoryTest(TestCase):
    '''History basic testing

    R
    '''
    def setUp(self):
        # Initial paid type an third party
        trial_data = {
            'pk': 1,
            'name': 'Trail',
            'duration': '0_0',
            'bot_amount': '1',
            'faq_amount': '50',
            'user_type': 'M'
        }

        demo_data = {
            'pk': 4,
            'name': 'demo'
        }
        trial_obj = PaidType.objects.create(**trial_data)
        demo_obj = ThirdParty.objects.create(**demo_data)
        trial_obj.third_party.add(demo_obj)

        # Create new member account
        user_data = {'username': 'cosmo.hu@lingtelli.com',
                     'password': 'thisispassword',
                     'first_name': 'cosmo'}
        self.user_obj = User.objects.create_user(**user_data)

        # Create account info
        acc_data = {'user': self.user_obj, 'paid_type': trial_obj,
                    'confirmation_code': 'confirmationcode', 
                    'code_reset_time': '2019-12-12 00:00:00'}
        AccountInfo.objects.create(**acc_data)

        # Login User
        token_obj = Token.objects.create(user=self.user_obj)
        self.accesstoken = token_obj.key

        # Initial header
        self.header = {'HTTP_AUTHORIZATION': 'Bearer ' + self.accesstoken}

        # Initial bot
        bot_data = {'robot_name': 'test', 'user': self.user_obj}
        self.bot_obj = Chatbot.objects.create(**bot_data)

        # Initial bot uri
        self.bot_uri = '/chatbot/' + str(self.bot_obj.id) + '/history/'

        # Initial history data
        history_data = {'id': 1, 'chatbot': self.bot_obj,
                        'user_id': self.user_obj, 'sender': 'USER',
                        'created_at': '2010-10-10 00:00:00',
                        'session_id': 'thisissession', 'content': 'hi',
                        'qa_pair': 'thisispair'}
        self.history_obj = History.objects.create(**history_data)


    def test_no_auth(self):
        '''History action no authorization

        GET
        '''
        c = Client()
        response = c.get(self.bot_uri)
        self.assertEqual(response.status_code, 401)
    
    def test_not_existed(self):
        '''History data is not existed

        GET
        '''
        c = Client()
        history_uri = self.bot_uri + '123/'
        response = c.get(history_uri, **self.header)
        self.assertEqual(response.status_code, 404)
        res_data = json.loads(response.content)
        self.assertIn('errors', res_data)

    def test_read(self):
        c = Client()
        history_keys = ['sender', 'created_at', 'content']
        history_uri = self.bot_uri + str(self.history_obj.id) + '/'
        response = c.get(history_uri, **self.header)
        self.assertEqual(response.status_code, 200)
        res_data = json.loads(response.content)
        for k in history_keys:
            self.assertIn(k, res_data)

class MatchingQuestionTest(TestCase):
    '''Matching question basic testing

    R
    '''

    def setUp(self):
        # Initial paid type an third party
        trial_data = {
            'pk': 1,
            'name': 'Trail',
            'duration': '0_0',
            'bot_amount': '1',
            'faq_amount': '50',
            'user_type': 'M'
        }

        demo_data = {
            'pk': 4,
            'name': 'demo'
        }
        trial_obj = PaidType.objects.create(**trial_data)
        demo_obj = ThirdParty.objects.create(**demo_data)
        trial_obj.third_party.add(demo_obj)

        # Create new member account
        user_data = {'username': 'cosmo.hu@lingtelli.com',
                     'password': 'thisispassword',
                     'first_name': 'cosmo'}
        self.user_obj = User.objects.create(**user_data)

        # Create account info
        acc_data = {'user': self.user_obj, 'paid_type': trial_obj,
                    'confirmation_code': 'confirmationcode', 
                    'code_reset_time': '2019-12-12 00:00:00'}
        AccountInfo.objects.create(**acc_data)

        # Login User
        token_obj = Token.objects.create(user=self.user_obj)
        self.accesstoken = token_obj.key

        # Initial header
        self.header = {'HTTP_AUTHORIZATION': 'Bearer ' + self.accesstoken}

        # Initial bot
        bot_data = {'robot_name': 'test', 'user': self.user_obj}
        self.bot_obj = Chatbot.objects.create(**bot_data)

        # Initial bot uri
        self.bot_uri = '/chatbot/' + str(self.bot_obj.id) + '/matching/'

        # Inital faq group
        self.bot_faq = FAQGroup.objects.create(chatbot=self.bot_obj)

        # Initial matching data
        matching_data = {'ori_question': 'original question',
                         'select_question': 'selected question',
                         'group': self.bot_faq.id, 'chatbot': self.bot_obj, 
                         'status': '0'}
        self.matching_obj = \
            QuestionMatchHistory.objects.create(**matching_data)
        

    def test_no_auth(self):
        '''Matching action no authorization

        GET
        '''
        c = Client()
        response = c.get(self.bot_uri)
        self.assertEqual(response.status_code, 401)
    
    def test_not_existed(self):
        '''Matching data is not existed

        GET
        '''
        c = Client()
        matching_uri = self.bot_uri + '1234/'
        response = c.get(matching_uri, **self.header)
        self.assertEqual(response.status_code, 404)
        res_data = json.loads(response.content)
        self.assertIn('errors', res_data)

    def test_read(self):
        c = Client()
        matching_keys = ['id', 'ori_question', 'select_question', 'group',
                         'status']
        matching_uri = self.bot_uri + str(self.matching_obj.id) + '/'
        response = c.get(matching_uri, **self.header)
        self.assertEqual(response.status_code, 200)
        res_data = json.loads(response.content)
        for k in matching_keys:
            self.assertIn(k, res_data)


    # TODO:def test_update

