import json
from django.test import TestCase, Client

from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token
from chatbot.models import Chatbot, Line, Facebook
from account.models import AccountInfo
from paidtype.models import PaidType
from thirdparty.models import ThirdParty


class ChatbotTest(TestCase):
    '''Chatbot basic testing

    CRUD
    '''
    def setUp(self):
        # Initial paid type an third party
        staff_data ={
            'pk': 1,
            'name': 'Staff',
            'duration': '0_0',
            'bot_amount': '0',
            'faq_amount': '0'
        }

        demo_data = {
            'pk': 4,
            'name': 'demo'
        }

        staff_obj = PaidType.objects.create(**staff_data)
        demo_obj = ThirdParty.objects.create(**demo_data)
        staff_obj.thirdparty.add(demo_obj)

        # Create new agent account
        agent_data = {'username': 'superuser', 'password': 'agentpassword',
                      'is_staff': True}
        self.agent_obj = User.objects.create(**agent_data)

        # Create agent account info
        acc_data = {'user': self.agent_obj, 'paid_type': staff_obj,
                    'confirmation_code': 'confirmationcode', 
                    'code_reset_time': '2019-12-12 00:00:00'}
        AccountInfo.objects.create(**acc_data)

        # Login Agent
        agent_token_obj = Token.objects.create(user=self.agent_obj)
        self.agent_token = agent_token_obj.key

        # Initial header
        self.agent_header =\
            {'HTTP_AUTHORIZATION': 'bearer ' + self.agent_token}

        # Initial bot
        bot_data = {'robot_name': 'testbot', 'greeting_msg': 'Hi',
                    'failed_msg': 'Cannot understand', 'user': self.agent_obj,
                    'bot_type': 'TASK'}
        self.bot_obj = Chatbot.objects.create(**bot_data)

        # Initial uri
        self.bot_uri = '/chatbot/' + str(self.bot_obj.id) + '/'

    def test_no_auth(self):
        ''' Not authorize actions
        
        POST, GET, PUT, DELETE
        '''
        c = Client()
        # POST
        response = c.post('/chatbot/', json.dumps({'robot_name': 'thebot'}),
                          content_type='application/json')
        self.assertEqual(response.status_code, 401)

        # GET
        response = c.get(self.bot_uri)
        self.assertEqual(response.status_code, 401)

        # PUT
        response = c.put(self.bot_uri, json.dumps({'robot_name': 'newbot'}), 
                         content_type='application/json')
        self.assertEqual(response.status_code, 401)

        # Delete
        response = c.delete(self.bot_uri)
        self.assertEqual(response.status_code, 401)
    
    def test_not_existed(self):
        ''' Bot not existed

        GET, PUT, DELETE
        '''
        # Init not existed bot url
        bot_uri = '/chatbot/5/'

        c = Client()

        # GET
        response = c.get(bot_uri, **self.agent_header)
        self.assertEqual(response.status_code, 404)
        res_data = json.loads(response.content)
        self.assertIn('errors', res_data)

        # PUT
        response = c.put(bot_uri, json.dumps({'robot_name': 'newbot'}),
                         content_type='application/json', **self.agent_header)
        self.assertEqual(response.status_code, 404)
        res_data = json.loads(response.content)
        self.assertIn('errors', res_data)

        # Delete
        response = c.delete(bot_uri, **self.agent_header)
        self.assertEqual(response.status_code, 404)
        res_data = json.loads(response.content)
        self.assertIn('errors', res_data)

    def test_create(self):
        bot_data = {'robot_name': 'testbot', 'greeting_msg': 'Hi',
                    'failed_msg': 'Cannot understand'}
        bot_return_key = ['id', 'robot_name']
        c = Client()
        response = c.post('/chatbot/', json.dumps(bot_data),
                          content_type='application/json', **self.agent_header)
        self.assertEqual(response.status_code, 201)
        res_data = json.loads(response.content)
        bot_obj = Chatbot.objects.get(id=res_data.get('id'))
        self.assertEqual(bot_obj.bot_type, 'NORMAL')
        for k in bot_return_key:
            self.assertIn(k, res_data)
    
    def test_create_no_bot_name(self):
        c = Client()
        response = c.post('/chatbot/', json.dumps({}),
                          content_type='application/json', **self.agent_header)
        self.assertEqual(response.status_code, 403)
        res_data = json.loads(response.content)
        self.assertIn('errors', res_data)
    
    def test_read(self):
        c = Client()
        response = c.get(self.bot_uri, **self.agent_header)
        self.assertEqual(response.status_code, 200)
        res_data = json.loads(response.content)
        for k, v in bot_obj:
            self.assertIn(k, res_data)
    
    def test_update(self):
        bot_update_data = {'robot_name': 'newnamebot', 'greeting_msg': 'LOL'}

        c = Client()
        response = c.put(self.bot_uri, json.dumps(bot_update_data),
                         content_type='application/json', **self.agent_header)
        updated_bot_obj = Chatbot.objects.get(id=self.bot_obj.id,
                                              user=self.agent_obj)
        self.assertEqual(response.status_code, 200)
        res_data = json.loads(response.content)
        for k, v in updated_bot_obj:
            self.assertIn(k, res_data)
            self.assertIn(v, res_data)
    
    def test_update_bot_name_blank(self):
        c = Client()
        response = c.put(self.bot_uri, json.dumps({}),
                         content_type='application/json', **self.agent_header)
        self.assertEqual(response.status_code, 403)
        res_data = json.loads(response.content)
        self.assertIn('errors', res_data)
    
    def test_delete(self):
        # Pretend the confirm has passed
        self.bot_obj.delete_confirm = True
        self.bot_obj.save()

        c = Client()
        response = c.delete(self.bot_uri, **self.agent_header)
        self.assertEqual(response.status_code, 204)
    
    def test_delete_no_confirm(self):
        c = Client()
        response = c.delete(self.bot_uri, **self.agent_header)
        self.assertEqual(response.status_code, 403)
        res_data = json.loads(response.content)
        self.assertIn('errors', res_data)


class DeleteBotConfirmTest(TestCase):
    '''Delete chatbot confirm

    Asking for user's password before deleting chatbot
    '''
    def setUp(self):
        # Initial paid type an third party
        staff_data ={
            'pk': 1,
            'name': 'Staff',
            'duration': '0_0',
            'bot_amount': '0',
            'faq_amount': '0'
        }

        demo_data = {
            'pk': 4,
            'name': 'demo'
        }

        staff_obj = PaidType.objects.create(**staff_data)
        demo_obj = ThirdParty.objects.create(**demo_data)
        staff_obj.thirdparty.add(demo_obj)

        # Create new agent account
        agent_data = {'username': 'superuser', 'password': 'agentpassword',
                      'is_staff': True}
        self.agent_obj = User.objects.create(**agent_data)

        # Create agent account info
        acc_data = {'user': self.agent_obj, 'paid_type': staff_obj,
                    'confirmation_code': 'confirmationcode', 
                    'code_reset_time': '2019-12-12 00:00:00'}
        AccountInfo.objects.create(**acc_data)

        # Login Agent
        agent_token_obj = Token.objects.create(user=self.agent_obj)
        self.agent_token = agent_token_obj.key

        # Initial header
        self.agent_header =\
            {'HTTP_AUTHORIZATION': 'bearer ' + self.agent_token}

        # Initial bot
        bot_data = {'robot_name': 'testbot', 'greeting_msg': 'Hi',
                    'failed_msg': 'Cannot understand', 'user': self.agent_obj,
                    'bot_type': 'TASK'}
        self.bot_obj = Chatbot.objects.create(**bot_data)

        # Initial bot uri
        self.uri = '/chatbot/' + str(self.bot_obj.id) + '/confirm/'

    def test_update_confirm_no_auth(self):
        ''' Delete bot confirm 

        PUT
        '''
        c = Client()
        correct_password = {'password': 'thisispassword'}
        response = c.put(self.uri, json.dumps(correct_password), 
                          content_type='application/json')
        self.assertEqual(response.status_code, 401)

    def test_update_confirm_correct_password(self):
        c = Client()
        correct_password = {'password': 'thisispassword'}
        response = c.put(self.uri, json.dumps(correct_password), 
                          content_type='application/json', **self.agent_header)
        agent_obj = User.objects.get(username='superuser')
        acc_info = AccountInfo.objects.get(user=agent_obj)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(acc_info.delete_confirm, True)
        res_data = json.loads(response.content)
        self.assertEqual(res_data.get('success'),
                         'Account deleting has confirmed')
    
    def test_update_confirm_wrong_password(self):
        c = Client()
        correct_password = {'password': 'wrongpassword'}
        response = c.put(self.uri, json.dumps(correct_password), 
                          content_type='application/json', **self.agent_header)
        self.assertEqual(response.status_code, 403)
        res_data = json.loads(response.content)
        self.assertEqual(res_data.get('errors'), 'Password is not correct')


class LineTest(TestCase):
    '''Line basic testing

    RU
    '''
    def setUp(self):
        # Initial paid type an third party
        staff_data ={
            'pk': 1,
            'name': 'Staff',
            'duration': '0_0',
            'bot_amount': '0',
            'faq_amount': '0'
        }

        demo_data = {
            'pk': 4,
            'name': 'demo'
        }

        staff_obj = PaidType.objects.create(**staff_data)
        demo_obj = ThirdParty.objects.create(**demo_data)
        staff_obj.thirdparty.add(demo_obj)

        # Create new agent account
        agent_data = {'username': 'superuser', 'password': 'agentpassword',
                      'is_staff': True}
        self.agent_obj = User.objects.create(**agent_data)

        # Create agent account info
        acc_data = {'user': self.agent_obj, 'paid_type': staff_obj,
                    'confirmation_code': 'confirmationcode', 
                    'code_reset_time': '2019-12-12 00:00:00'}
        AccountInfo.objects.create(**acc_data)

        # Login Agent
        agent_token_obj = Token.objects.create(user=self.agent_obj)
        self.agent_token = agent_token_obj.key

        # Initial header
        self.agent_header =\
            {'HTTP_AUTHORIZATION': 'bearer ' + self.agent_token}

        # Initial bot
        bot_data = {'robot_name': 'testbot', 'greeting_msg': 'Hi',
                    'failed_msg': 'Cannot understand', 'user': self.agent_obj,
                    'bot_type': 'TASK'}
        self.bot_obj = Chatbot.objects.create(**bot_data)

        # Initial line
        line_data = {'secret': 'thisisthesecret', 'token': 'thisisthetoken',
                     'chatbot': self.bot_obj}
        self.line_obj = Line.objects.create(**line_data)

        # Initial uri
        self.uri = '/chatbot/' + str(self.bot_obj.id) + '/line/'

    def test_no_auth(self):
        '''Line no authorization

        GET, PUT
        '''
        c = Client()

        # GET
        response = c.get(self.uri)
        self.assertEqual(response.status_code, 401)

        # PUT
        line_data = {'secret': 'newsecret'}
        response = c.put(self.uri, json.dumps(line_data),
                         content_type='application/json')
        self.assertEqual(response.status_code, 401)

    def test_read_not_allowed(self):
        c = Client()
        line_keys = ['secret', 'token', 'chatbot']
        response = c.get(self.uri, **self.agent_header)
        self.assertEqual(response.status_code, 403)
        res_data = json.loads(response.content)
        self.assertIn('errors', res_data)
 
    def test_update_not_allowed(self):
        c = Client()
        line_data = {'secret': 'newsecret'}
        response = c.put(self.uri, json.dumps(line_data), **self.agent_header)
        self.assertEqual(response.status_code, 403)
        res_data = json.loads(response.content)
        self.assertIn('errors', res_data)


class FacebookTest(TestCase):
    '''Facebook basic testing

    RU
    '''
    def setUp(self):
        # Initial paid type an third party
        staff_data ={
            'pk': 1,
            'name': 'Staff',
            'duration': '0_0',
            'bot_amount': '0',
            'faq_amount': '0'
        }

        demo_data = {
            'pk': 4,
            'name': 'demo'
        }

        staff_obj = PaidType.objects.create(**staff_data)
        demo_obj = ThirdParty.objects.create(**demo_data)
        staff_obj.thirdparty.add(demo_obj)

        # Create new agent account
        agent_data = {'username': 'superuser', 'password': 'agentpassword',
                      'is_staff': True}
        self.agent_obj = User.objects.create(**agent_data)

        # Create agent account info
        acc_data = {'user': self.agent_obj, 'paid_type': staff_obj,
                    'confirmation_code': 'confirmationcode', 
                    'code_reset_time': '2019-12-12 00:00:00'}
        AccountInfo.objects.create(**acc_data)

        # Login Agent
        agent_token_obj = Token.objects.create(user=self.agent_obj)
        self.agent_token = agent_token_obj.key

        # Initial header
        self.agent_header =\
            {'HTTP_AUTHORIZATION': 'bearer ' + self.agent_token}

        # Initial bot
        bot_data = {'robot_name': 'testbot', 'greeting_msg': 'Hi',
                    'failed_msg': 'Cannot understand', 'user': self.agent_obj,
                    'bot_type': 'TASK'}
        self.bot_obj = Chatbot.objects.create(**bot_data)

        # Initial facebook
        fb_data = {'verify_str': 'thisisverifystr', 'token': 'thisisthetoken',
                   'chatbot': self.bot_obj}
        self.fb_obj = Facebook.objects.create(**fb_data)

        # Initial uri
        self.uri = '/chatbot/' + str(self.bot_obj.id) + '/facebook/'

    def test_no_auth(self):
        '''Line no authorization

        GET, PUT
        '''
        c = Client()

        # GET
        response = c.get(self.uri)
        self.assertEqual(response.status_code, 401)

        # PUT
        fb_data = {'verify_str': 'newverifystr'}
        response = c.put(self.uri, json.dumps(fb_data),
                         content_type='application/json')
        self.assertEqual(response.status_code, 401)

    def test_read_not_allowed(self):
        c = Client()
        fb_keys = ['verify_str', 'token', 'chatbot']
        response = c.get(self.uri, **self.agent_header)
        self.assertEqual(response.status_code, 403)
        res_data = json.loads(response.content)
        self.assertIn('errors', res_data)
 
    def test_update_not_allowed(self):
        c = Client()
        fb_data = {'verify_str': 'newverifystr'}
        response = c.put(self.uri, json.dumps(fb_data), **self.agent_header)
        self.assertEqual(response.status_code, 403)
        res_data = json.loads(response.content)
        self.assertIn('errors', res_data)