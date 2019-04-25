import json
import os
from django.test import TestCase, Client

from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token
from account.models import AccountInfo
from chatbot.models import Chatbot
from paidtype.models import PaidType
from thirdparty.models import ThirdParty
from faq.models import FAQGroup, Answer, Question


class FAQGroupTest(TestCase):
    '''FAQGroup basic testing

    CRUD
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

        staff_data = {
            'pk': 2,
            'name': 'Staff',
            'duration': '0_0',
            'bot_amount': '0',
            'faq_amount': '0',
            'user_type': 'S'
        }

        demo_data = {
            'pk': 4,
            'name': 'demo'
        }
        trial_obj = PaidType.objects.create(**trial_data)
        staff_obj = PaidType.objects.create(**staff_data)
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

        # Create new agent account
        agent_data = {'username': 'superuser', 'password': 'agentpassword',
                      'is_staff': True}
        self.agent_obj = User.objects.create(**agent_data)

        # Create agent account info
        acc_data = {'user': self.agent_obj, 'paid_type': staff_obj,
                    'confirmation_code': 'confirmationcode',
                    'code_reset_time': '2019-12-12 00:00:00'}
        AccountInfo.objects.create(**acc_data)

        # Login User
        token_obj = Token.objects.create(user=self.user_obj)
        self.accesstoken = token_obj.key

        # Login Agent
        agent_token_obj = Token.objects.create(user=self.agent_obj)
        self.agent_token = agent_token_obj.key

        # Initial header
        self.header = {'HTTP_AUTHORIZATION': 'Bearer ' + self.accesstoken}
        self.agent_header =\
            {'HTTP_AUTHORIZATION': 'Bearer ' + self.agent_token}

        # Initial bot
        bot_data = {'robot_name': 'test', 'user': self.user_obj}
        self.bot_obj = Chatbot.objects.create(**bot_data)

        # Initial taskbot
        taskbot_data = {'robot_name': 'tasktest', 'user': self.agent_obj,
                        'bot_type': 'TASK'}
        self.taskbot_obj = Chatbot.objects.create(**taskbot_data)

        # Initial bot uri
        self.bot_uri = '/chatbot/' + str(self.bot_obj.id) + '/faq/'

    def test_no_auth(self):
        '''FAQ group no authorization

        POST, GET, PUT, DELETE
        '''
        c = Client()

        # POST
        faq_data = {'chatbot': self.bot_obj.id}
        response = c.post(self.bot_uri, json.dumps(faq_data),
                          content_type='application/json')
        self.assertEqual(response.status_code, 401)

        # Initial a faq group
        faq_obj = FAQGroup.objects.create(chatbot=self.bot_obj)
        faq_uri = self.bot_uri + str(faq_obj.id) + '/'

        # GET
        response = c.get(faq_uri)
        self.assertEqual(response.status_code, 401)

        # DELETE
        response = c.delete(faq_uri)
        self.assertEqual(response.status_code, 401)

    def test_not_existed(self):
        '''FAQ group not existed

        GET, DELETE
        '''
        c = Client()
        faq_uri = self.bot_uri + '5/'
        # GET
        response = c.get(faq_uri, **self.header)
        self.assertEqual(response.status_code, 404)
        res_data = json.loads(response.content)
        self.assertIn('errors', res_data)

        # DELETE
        response = c.delete(faq_uri, **self.header)
        self.assertEqual(response.status_code, 404)
        res_data = json.loads(response.content)
        self.assertIn('errors', res_data)

    def test_create(self):
        c = Client()

        # Create with normal bot
        response = c.post(self.bot_uri, {},
                          content_type='application/json', **self.header)
        self.assertEqual(response.status_code, 201)
        res_data = json.loads(response.content)
        self.assertIn('id', res_data)
        # TODO:Task bot
        # Create with task bot
        # response = \
        #     c.post(self.bot_uri, {},
        #            content_type='application/json', **self.agent_header)
        # self.assertEqual(response.status_code, 201)
        # res_data = json.loads(response.content)
        # self.assertIn('id', res_data)

    def test_create_over_limit_member(self):
        # Initial 49 groups
        for i in range(0, 50):
            FAQGroup.objects.create(chatbot=self.bot_obj)
        c = Client()
        response = c.post(self.bot_uri, {},
                          content_type='application/json', **self.header)
        self.assertEqual(response.status_code, 403)
        res_data = json.loads(response.content)
        self.assertIn('errors', res_data)

    def test_read(self):
        c = Client()
        faq_obj = FAQGroup.objects.create(chatbot=self.bot_obj)
        faq_task_obj = FAQGroup.objects.create(chatbot=self.taskbot_obj)
        normal_uri = self.bot_uri + str(faq_obj.id) + '/'
        task_uri = self.bot_uri + str(faq_task_obj.id) + '/'

        # Normal bot
        response = c.get(normal_uri, **self.header)
        self.assertEqual(response.status_code, 200)

        # TODO:Task bot
        # response = c.get(task_uri, **self.agent_header)
        # self.assertEqual(response.status_code, 200)

    def test_delete(self):
        c = Client()
        faq_obj = FAQGroup.objects.create(chatbot=self.bot_obj)
        faq_task_obj = FAQGroup.objects.create(chatbot=self.taskbot_obj)
        normal_uri = self.bot_uri + str(faq_obj.id) + '/'
        task_uri = self.bot_uri + str(faq_task_obj.id) + '/'

        # Normal bot
        response = c.delete(normal_uri, **self.header)
        self.assertEqual(response.status_code, 204)

        # TODO:Task bot
        # response = c.delete(task_uri, **self.agent_header)
        # self.assertEqual(response.status_code, 204)


class CSVTest(TestCase):
    '''CSV FAQ file testing

    Including upload, export and train
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

        staff_data = {
            'pk': 2,
            'name': 'Staff',
            'duration': '0_0',
            'bot_amount': '0',
            'faq_amount': '0',
            'user_type': 'S'
        }

        demo_data = {
            'pk': 4,
            'name': 'demo'
        }
        trial_obj = PaidType.objects.create(**trial_data)
        staff_obj = PaidType.objects.create(**staff_data)
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
                    'code_reset_time': '2019-12-12 00:00:00', }
        AccountInfo.objects.create(**acc_data)

        # Create new agent account
        agent_data = {'username': 'superuser', 'password': 'agentpassword',
                      'is_staff': True}
        self.agent_obj = User.objects.create(**agent_data)

        # Create agent account info
        acc_data = {'user': self.agent_obj, 'paid_type': staff_obj,
                    'confirmation_code': 'confirmationcode',
                    'code_reset_time': '2019-12-12 00:00:00'}
        AccountInfo.objects.create(**acc_data)

        # Login User
        token_obj = Token.objects.create(user=self.user_obj)
        self.accesstoken = token_obj.key

        # Login Agent
        agent_token_obj = Token.objects.create(user=self.agent_obj)
        self.agent_token = agent_token_obj.key

        # Initial header
        self.header = {'HTTP_AUTHORIZATION': 'Bearer ' + self.accesstoken}
        self.agent_header =\
            {'HTTP_AUTHORIZATION': 'Bearer ' + self.agent_token}

        # Initial bot
        bot_data = {'robot_name': 'test', 'user': self.user_obj}
        self.bot_obj = Chatbot.objects.create(**bot_data)

        # Initial taskbot
        taskbot_data = {'robot_name': 'tasktest', 'user': self.agent_obj,
                        'bot_type': 'TASK'}
        self.taskbot_obj = Chatbot.objects.create(**taskbot_data)

        # Initail uri
        self.bot_uri = '/chatbot/' + str(self.bot_obj.id)
        self.task_uri = '/agent/' + str(self.agent_obj.id) + '/chatbot/'\
                        + str(self.taskbot_obj.id)

        # Get sample csv files
        base_path = os.path.dirname(os.path.realpath(__file__))
        self.correct_csv = open(base_path + '/test_file/correct.csv')
        self.over_limit_csv = open(base_path + '/test_file/over_limit.csv')
        self.wrong_format = open(base_path + '/test_file/wrong_format.doc')

    def test_no_auth(self):
        '''CSV action no authorization

        POST(upload), GET(export, train)
        '''
        c = Client()

        # Upload
        upload_uri = self.bot_uri + '/upload/'
        response = c.post(upload_uri, {'file': self.correct_csv})
        self.assertEqual(response.status_code, 401)

        # Export
        export_uri = self.bot_uri + '/export/'
        response = c.post(upload_uri, {'file': self.correct_csv})
        self.assertEqual(response.status_code, 401)

        # Train
        train_uri = self.bot_uri + '/train/'
        response = c.post(upload_uri, {'file': self.correct_csv})
        self.assertEqual(response.status_code, 401)

    def test_not_existed(self):
        ''' CSV action with no file

        For export, it will always export the file with header.
        For train test with bot not found.

        POST(upload), GET(train)
        '''
        c = Client()

        # Upload
        upload_uri = self.bot_uri + '/upload/'
        response = c.post(upload_uri, {}, **self.header)
        self.assertEqual(response.status_code, 404)
        res_data = json.loads(response.content)
        self.assertIn('errors', res_data)

        # Train
        train_uri = '/chatbot/123/train/'
        response = c.get(train_uri, **self.header)
        self.assertEqual(response.status_code, 404)
        res_data = json.loads(response.content)
        self.assertIn('errors', res_data)

    def test_upload(self):
        '''Upload faq csv file.

        Allowed format:
            UTF8 and BIG5(TODO: Haven't created this testing code yet.)
        XXX WARNING XXX
        For task bot, it's using only ONE answer. If there's multiple answer,
        use the first one.
        '''
        c = Client()
        bot_upload_uri = self.bot_uri + '/upload/'
        task_upload_uri = self.task_uri + '/upload/'

        # Normal bot
        response = c.post(bot_upload_uri, {'file': self.correct_csv},
                          **self.header)
        self.assertEqual(response.status_code, 201)
        res_data = json.loads(response.content)
        self.assertIn('success', res_data)

        # TODO:Task bot
        # response = c.post(task_upload_uri, {'file': self.correct_csv},
        #                   **self.agent_header)
        # self.assertEqual(response.status_code, 201)
        # res_data = json.loads(response.content)
        # self.assertIn('success', res_data)

    def test_upload_over_limit(self):
        c = Client()
        bot_upload_uri = self.bot_uri + '/upload/'
        response = c.post(bot_upload_uri, {'file': self.over_limit_csv},
                          **self.header)
        self.assertEqual(response.status_code, 403)
        res_data = json.loads(response.content)
        self.assertIn('errors', res_data)

    # TODO: Currently we do not have wrong format file to test
    # def test_upload_wrong_format(self):
    #     c = Client()
    #     bot_upload_uri = self.bot_uri + '/upload/'
    #     task_upload_uri = self.task_uri + '/upload/'

    #     # Normal bot
    #     response = c.post(bot_upload_uri, {'file': self.wrong_format},
    #                      **self.header)
    #     self.assertEqual(response.status_code, 403)
    #     res_data = json.loads(response.content)
    #     self.assertIn('errors', res_data)

        # TODO:Task bot
        # response = c.post(task_upload_uri, {'file': self.wrong_format},
        #                   **self.agent_header)
        # self.assertEqual(response.status_code, 403)
        # res_data = json.loads(response.content)
        # self.assertIn('errors', res_data)

    def test_export(self):
        c = Client()
        bot_export_uri = self.bot_uri + '/export/'
        task_export_uri = self.task_uri + '/export/'

        # Normal bot
        response = c.get(bot_export_uri, **self.header)
        self.assertEqual(response.status_code, 200)

        # TODO:Task bot
        # response = c.get(task_export_uri, **self.agent_header)
        # self.assertEqual(response.status_code, 200)

    # def test_train(self):
    #     c = Client()
    #     bot_train_uri = self.bot_uri + '/train/'
    #     task_train_uri = self.task_uri + '/train/'

    #     # Normal bot
    #     response = c.get(bot_train_uri, **self.header)
    #     self.assertEqual(response.status_code, 200)
    #     res_data = json.loads(response.content)
    #     self.assertIn('success', res_data)

        # TODO:Task bot
        # response = c.get(task_train_uri, **self.agent_header)
        # self.assertEqual(response.status_code, 200)
        # res_data = json.loads(response.content)
        # self.assertIn('success', res_data)


class AnswerTest(TestCase):
    '''Answer basic testing

    CRUD
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

        staff_data = {
            'pk': 2,
            'name': 'Staff',
            'duration': '0_0',
            'bot_amount': '0',
            'faq_amount': '0',
            'user_type': 'S'
        }

        demo_data = {
            'pk': 4,
            'name': 'demo'
        }
        trial_obj = PaidType.objects.create(**trial_data)
        staff_obj = PaidType.objects.create(**staff_data)
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
                    'code_reset_time': '2019-12-12 00:00:00', }
        AccountInfo.objects.create(**acc_data)

        # Create new agent account
        agent_data = {'username': 'superuser', 'password': 'agentpassword',
                      'is_staff': True}
        self.agent_obj = User.objects.create(**agent_data)

        # Create agent account info
        acc_data = {'user': self.agent_obj, 'paid_type': staff_obj,
                    'confirmation_code': 'confirmationcode',
                    'code_reset_time': '2019-12-12 00:00:00'}
        AccountInfo.objects.create(**acc_data)

        # Login User
        token_obj = Token.objects.create(user=self.user_obj)
        self.accesstoken = token_obj.key

        # Login Agent
        agent_token_obj = Token.objects.create(user=self.agent_obj)
        self.agent_token = agent_token_obj.key

        # Initial header
        self.header = {'HTTP_AUTHORIZATION': 'Bearer ' + self.accesstoken}
        self.agent_header =\
            {'HTTP_AUTHORIZATION': 'Bearer ' + self.agent_token}

        # Initial bot
        bot_data = {'robot_name': 'test', 'user': self.user_obj}
        self.bot_obj = Chatbot.objects.create(**bot_data)

        # Initial bot faqgroup
        self.bot_faq = FAQGroup.objects.create(chatbot=self.bot_obj)

        # Initial taskbot
        taskbot_data = {'robot_name': 'tasktest', 'user': self.agent_obj}
        self.taskbot_obj = Chatbot.objects.create(**taskbot_data)

        # Initial taskbot faqgroup
        self.task_faq = FAQGroup.objects.create(chatbot=self.taskbot_obj)

        # Initial answer uri
        self.bot_uri = '/chatbot/' + str(self.bot_obj.id) + '/answer/'
        self.task_uri = '/agent/taskbot/' + str(self.taskbot_obj.id) +\
                        '/answer/'

        # Initial answer obj
        self.bot_ans_obj = \
            Answer.objects.create(group=self.bot_faq,
                                  chatbot=self.bot_obj, content='hi')
        self.task_ans_obj = \
            Answer.objects.create(group=self.task_faq,
                                  chatbot=self.taskbot_obj, content='hi')

    def test_no_auth(self):
        ''' Answer action no auth

        POST, GET, PUT, DELETE
        '''
        c = Client()

        # POST
        response = \
            c.post(self.bot_uri,
                   json.dumps({'group': self.bot_faq.id, 'content': 'hi'}),
                   content_type='application/json')
        self.assertEqual(response.status_code, 401)

        # GET
        ans_uri = self.bot_uri + str(self.bot_ans_obj.id) + '/'
        response = c.get(ans_uri)
        self.assertEqual(response.status_code, 401)

        # PUT
        response = c.put(ans_uri, json.dumps({'content': 'x'}),
                         content_type='application/json')
        self.assertEqual(response.status_code, 401)

        # DELETE
        response = c.delete(ans_uri)
        self.assertEqual(response.status_code, 401)

    def test_not_existed(self):
        '''Answer is not existed

        POST(FAQ group is not existed), GET, PUT, DELETE
        '''
        c = Client()

        # POST
        response = c.post(self.bot_uri, json.dumps({'group': 123,
                                                    'content': 'hi'}),
                          content_type='application/json', **self.header)
        self.assertEqual(response.status_code, 404)
        res_data = json.loads(response.content)
        self.assertIn('errors', res_data)

        # GET
        bot_ans_uri = self.bot_uri + '123/'
        response = c.get(bot_ans_uri, **self.header)
        self.assertEqual(response.status_code, 404)
        res_data = json.loads(response.content)
        self.assertIn('errors', res_data)

        # PUT
        response = c.put(self.bot_uri + '123/',
                         json.dumps({'content': 'x'}),
                         content_type='application/json', **self.header)
        self.assertEqual(response.status_code, 404)
        res_data = json.loads(response.content)
        self.assertIn('errors', res_data)

        # DELETE
        bot_ans_uri = self.bot_uri + '123/'
        response = c.delete(bot_ans_uri, **self.header)
        self.assertEqual(response.status_code, 404)
        res_data = json.loads(response.content)
        self.assertIn('errors', res_data)

    def test_create(self):
        c = Client()
        ans_keys = ['id', 'content', 'group']

        # Normal bot
        response = c.post(self.bot_uri,
                          json.dumps({'group': self.bot_faq.id,
                                      'content': 'hi'}),
                          content_type='application/json', **self.header)
        self.assertEqual(response.status_code, 201)
        res_data = json.loads(response.content)
        self.assertEqual(len(ans_keys), len(res_data))
        for k in ans_keys:
            self.assertIn(k, res_data)

        # Task bot
        response = c.post(self.task_uri, json.dumps({'group': self.task_faq.id,
                                                     'content': 'hi'}),
                          content_type='application/json', **self.agent_header)
        self.assertEqual(response.status_code, 201)
        res_data = json.loads(response.content)
        self.assertEqual(len(ans_keys), len(res_data))
        for k in ans_keys:
            self.assertIn(k, res_data)

    def test_read(self):
        c = Client()
        ans_keys = ['id', 'content', 'group']
        bot_ans_uri = self.bot_uri + str(self.bot_ans_obj.id) + '/'
        task_ans_uri = self.task_uri + str(self.task_ans_obj.id) + '/'

        # Normal bot
        response = c.get(bot_ans_uri, **self.header)
        self.assertEqual(response.status_code, 200)
        res_data = json.loads(response.content)
        self.assertEqual(len(ans_keys), len(res_data))
        for k in ans_keys:
            self.assertIn(k, res_data)

        # Task bot
        response = c.get(task_ans_uri, **self.agent_header)
        self.assertEqual(response.status_code, 200)
        res_data = json.loads(response.content)
        self.assertEqual(len(ans_keys), len(res_data))
        for k in ans_keys:
            self.assertIn(k, res_data)

    def test_update(self):
        c = Client()
        ans_keys = ['content']
        bot_ans_uri = self.bot_uri + str(self.bot_ans_obj.id) + '/'
        task_ans_uri = self.task_uri + str(self.task_ans_obj.id) + '/'

        # Normal bot
        response = c.put(bot_ans_uri, json.dumps({'content': 'hello'}),
                         content_type='application/json', **self.header)
        self.assertEqual(response.status_code, 200)
        res_data = json.loads(response.content)
        self.assertIn('success', res_data)

        # Task bot
        response = c.put(task_ans_uri, json.dumps({'content': 'hello'}),
                         content_type='application/json', **self.agent_header)
        self.assertEqual(response.status_code, 200)
        res_data = json.loads(response.content)
        self.assertIn('success', res_data)

    def test_delete(self):
        c = Client()
        bot_ans_uri = self.bot_uri + str(self.bot_ans_obj.id) + '/'
        task_ans_uri = self.task_uri + str(self.task_ans_obj.id) + '/'

        # Normal bot
        response = c.delete(bot_ans_uri, **self.header)
        self.assertEqual(response.status_code, 204)

        # Task bot
        response = c.delete(task_ans_uri, **self.agent_header)
        self.assertEqual(response.status_code, 204)


class QuestionTest(TestCase):
    '''Question basic testing

    CRUD
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

        staff_data = {
            'pk': 2,
            'name': 'Staff',
            'duration': '0_0',
            'bot_amount': '0',
            'faq_amount': '0',
            'user_type': 'S'
        }

        demo_data = {
            'pk': 4,
            'name': 'demo'
        }
        trial_obj = PaidType.objects.create(**trial_data)
        staff_obj = PaidType.objects.create(**staff_data)
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
                    'code_reset_time': '2019-12-12 00:00:00', }
        AccountInfo.objects.create(**acc_data)

        # Create new agent account
        agent_data = {'username': 'superuser', 'password': 'agentpassword',
                      'is_staff': True}
        self.agent_obj = User.objects.create(**agent_data)

        # Create agent account info
        acc_data = {'user': self.agent_obj, 'paid_type': staff_obj,
                    'confirmation_code': 'confirmationcode',
                    'code_reset_time': '2019-12-12 00:00:00'}
        AccountInfo.objects.create(**acc_data)

        # Login User
        token_obj = Token.objects.create(user=self.user_obj)
        self.accesstoken = token_obj.key

        # Login Agent
        agent_token_obj = Token.objects.create(user=self.agent_obj)
        self.agent_token = agent_token_obj.key

        # Initial header
        self.header = {'HTTP_AUTHORIZATION': 'Bearer ' + self.accesstoken}
        self.agent_header =\
            {'HTTP_AUTHORIZATION': 'Bearer ' + self.agent_token}

        # Initial bot
        bot_data = {'robot_name': 'test', 'user': self.user_obj}
        self.bot_obj = Chatbot.objects.create(**bot_data)

        # Initial bot faqgroup
        self.bot_faq = FAQGroup.objects.create(chatbot=self.bot_obj)

        # Initial taskbot
        taskbot_data = {'robot_name': 'tasktest', 'user': self.agent_obj}
        self.taskbot_obj = Chatbot.objects.create(**taskbot_data)

        # Initial taskbot faqgroup
        self.task_faq = FAQGroup.objects.create(chatbot=self.taskbot_obj)

        # Initial question uri
        self.bot_uri = '/chatbot/' + str(self.bot_obj.id) + '/question/'
        self.task_uri = '/agent/taskbot/' + str(self.taskbot_obj.id) +\
                        '/question/'

        # Initial question obj
        self.bot_que_obj = \
            Question.objects.create(group=self.bot_faq,
                                    chatbot=self.bot_obj, content='hi')
        self.task_que_obj = \
            Question.objects.create(group=self.task_faq,
                                    chatbot=self.taskbot_obj, content='hi')

    def test_no_auth(self):
        '''Question action no auth

        POST, GET, PUT, DELETE
        '''
        c = Client()

        # POST
        response = \
            c.post(self.bot_uri,
                   json.dumps({'group': self.bot_faq.id, 'content': 'hi'}),
                   content_type='application/json')
        self.assertEqual(response.status_code, 401)

        # GET
        bot_que_uri = self.bot_uri + str(self.bot_que_obj.id) + '/'

        response = c.get(bot_que_uri)
        self.assertEqual(response.status_code, 401)

        # PUT
        response = c.put(bot_que_uri, json.dumps({'content': 'x'}),
                         content_type='application/json')
        self.assertEqual(response.status_code, 401)

        # DELETE
        response = c.delete(bot_que_uri)
        self.assertEqual(response.status_code, 401)

    def test_not_existed(self):
        '''Question is not existed

        POST(FAQ group is not existed), GET, PUT, DELETE
        '''
        c = Client()

        # POST
        response = c.post(self.bot_uri, json.dumps({'group': 123,
                                                    'content': 'hi'}),
                          content_type='application/json', **self.header)
        self.assertEqual(response.status_code, 404)
        res_data = json.loads(response.content)
        self.assertIn('errors', res_data)

        # GET
        bot_que_uri = self.bot_uri + '123/'
        response = c.get(bot_que_uri, **self.header)
        self.assertEqual(response.status_code, 404)
        res_data = json.loads(response.content)
        self.assertIn('errors', res_data)

        # PUT
        response = c.put(self.bot_uri + '123/',
                         json.dumps({'content': 'x'}),
                         content_type='application/json', **self.header)
        self.assertEqual(response.status_code, 404)
        res_data = json.loads(response.content)
        self.assertIn('errors', res_data)

        # DELETE
        bot_que_uri = self.bot_uri + '123/'
        response = c.delete(bot_que_uri, **self.header)
        self.assertEqual(response.status_code, 404)
        res_data = json.loads(response.content)
        self.assertIn('errors', res_data)

    def test_create(self):
        c = Client()
        que_keys = ['id', 'content', 'group']

        # Normal bot
        response = c.post(self.bot_uri,
                          json.dumps({'group': self.bot_faq.id,
                                      'content': 'hi'}),
                          content_type='application/json', **self.header)
        self.assertEqual(response.status_code, 201)
        res_data = json.loads(response.content)
        self.assertEqual(len(que_keys), len(res_data))
        for k in que_keys:
            self.assertIn(k, res_data)

        # Task bot
        response_task = c.post(self.task_uri,
                               json.dumps({'group': self.task_faq.id,
                                           'content': 'hi'}),
                               content_type='application/json',
                               **self.agent_header)
        self.assertEqual(response.status_code, 201)
        res_data = json.loads(response.content)
        self.assertEqual(len(que_keys), len(res_data))
        for k in que_keys:
            self.assertIn(k, res_data)

    def test_read(self):
        c = Client()
        que_keys = ['id', 'content', 'group']
        bot_que_uri = self.bot_uri + str(self.bot_que_obj.id) + '/'
        task_que_uri = self.task_uri + str(self.task_que_obj.id) + '/'

        # Normal bot
        response = c.get(bot_que_uri, **self.header)
        self.assertEqual(response.status_code, 200)
        res_data = json.loads(response.content)
        self.assertEqual(len(que_keys), len(res_data))
        for k in que_keys:
            self.assertIn(k, res_data)

        # Task bot
        response_task = c.get(task_que_uri, **self.agent_header)
        self.assertEqual(response.status_code, 200)
        res_data = json.loads(response.content)
        self.assertEqual(len(que_keys), len(res_data))
        for k in que_keys:
            self.assertIn(k, res_data)

    def test_update(self):
        c = Client()
        que_keys = ['content']
        bot_que_uri = self.bot_uri + str(self.bot_que_obj.id) + '/'
        task_que_uri = self.task_uri + str(self.task_que_obj.id) + '/'

        # Normal bot
        response = c.put(bot_que_uri, json.dumps({'content': 'hello'}),
                         content_type='application/json', **self.header)
        self.assertEqual(response.status_code, 200)
        res_data = json.loads(response.content)
        self.assertIn('success', res_data)

        # Task bot
        response_task = c.put(task_que_uri,
                              json.dumps({'group': self.task_faq.id,
                                          'content': 'hello'}),
                              content_type='application/json',
                              **self.agent_header)
        self.assertEqual(response.status_code, 200)
        res_data = json.loads(response.content)
        self.assertIn('success', res_data)

    def test_delete(self):
        c = Client()
        bot_que_uri = self.bot_uri + str(self.bot_que_obj.id) + '/'
        task_que_uri = self.task_uri + str(self.task_que_obj.id) + '/'

        # Normal bot
        response = c.delete(bot_que_uri, **self.header)
        self.assertEqual(response.status_code, 204)

        # Task bot
        response_task = c.delete(task_que_uri, **self.agent_header)
        self.assertEqual(response_task.status_code, 204)
