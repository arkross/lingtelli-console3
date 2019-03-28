import json

from django.test import TestCase, Client

from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token
from paidtype.models import PaidType
from thirdparty.models import ThirdParty
from account.models import AccountInfo
from chatbot.models import Chatbot
from history.models import History

class ReportTest(TestCase):
    '''Report basic testing

    Return the report data collected from history
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

        # Create new account
        user_data = {'username': 'cosmo.hu@lingtelli.com',
                     'password': 'thisispassword',
                     'first_name': 'cosmo'}
        self.user_obj = User.objects.create_user(**user_data)

        # Create account info
        acc_data = {'user': self.user_obj, 'paid_type': trial_obj,
                    'confirmation_code': 'confirmationcode', 
                    'code_reset_time': '2019-12-12 00:00:00', }
        AccountInfo.objects.create(**acc_data)

        # Login User
        token_obj = Token.objects.create(user=self.user_obj)
        self.accesstoken = token_obj.key

        # Initial header
        self.header = {'HTTP_AUTHORIZATION': 'Bearer ' + self.accesstoken}

        # Initial bot
        bot_data = {'robot_name': 'testbot', 'greeting_msg': 'Hi',
                    'failed_msg': 'Cannot understand', 'user': self.user_obj}
        self.bot_obj = Chatbot.objects.create(**bot_data)

        # Initial uri
        self.report_uri = '/chatbot/' + str(self.bot_obj.id) + '/report/'

        # Initial history data
        history_data = {'id': 1, 'chatbot': self.bot_obj,
                        'user_id': self.user_obj, 'sender': 'USER',
                        'created_at': '2010-10-10 00:00:00',
                        'session_id': 'thisissession', 'content': 'hi',
                        'qa_pair': 'thisispair'}
        self.history_obj = History.objects.create(**history_data)

    def test_no_auth(self):
        c = Client()
        response = c.get(self.report_uri)
        self.assertEqual(response.status_code, 401)
    
    def test_not_existed(self):
        c = Client()
        not_found_uri = '/chatbot/200/report/'
        response = c.get(not_found_uri, **self.header)
        self.assertEqual(response.status_code, 404)
        res_data = json.loads(response.content)
        self.assertIn('errors', res_data)

    def test_read_complete_report(self):
        '''Report generated from history

        Currently include: data, total_chat, success_count and question_count
        '''
        c = Client()
        report_keys = ['date', 'total_chat', 'success_count', 'question_count']
        response = c.get(self.report_uri, **self.header)
        self.assertEqual(response.status_code, 200)
        res_data = json.loads(response.content)
        for k in report_keys:
            if k == 'question_count':
                self.assertIn(k, res_data[-1])
                continue
            self.assertIn(k, res_data[0])
