import json
import os
from django.test import TestCase, Client
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token
from module.models import Module, ModuleFAQGroup, ModuleAnswer, ModuleQuestion
from account.models import AccountInfo
from paidtype.models import PaidType
from thirdparty.models import ThirdParty


class ModuleTest(TestCase):
    '''Module testing

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

        # Initial module
        module_data = {'robot_name': 'test', 'greeting_msg': 'greetings',
                       'failed_msg': 'failed', 'postback_title': 'related',
                       'language': 'tw'}
        module_obj = Module.objects.create(**module_data)

        # Module uri
        self.module_uri = '/agent/module/' + str(module_obj.id) + '/'

    def test_no_auth(self):
        ''' Module operation not authorized

        CRUD
        '''
        c = Client()

        # POST
        module_data = {'robot_name': 'test_1'}
        response = c.post('/agent/module/', json.dumps(module_data),
                          content_type='application/json')
        self.assertEqual(response.status_code, 401)

        # GET
        response = c.get(self.module_uri)
        self.assertEqual(response.status_code, 401)

        # PUT
        module_data = {'robot_name': 'test_1'}
        response = c.put(self.module_uri, json.dumps(module_data),
                         content_type='application/json')
        self.assertEqual(response.status_code, 401)

        # DELETE
        response = c.delete(self.module_uri)
        self.assertEqual(response.status_code, 401)

    def test_not_existed(self):
        ''' Module operation not existed

        RUD
        '''

        c = Client()
        not_existed_uri = '/agent/module/1000/'

        # GET
        response = c.get(not_existed_uri, **self.agent_header)
        self.assertEqual(response.status_code, 404)

        # PUT
        module_data = {'robot_name': 'test_1'}
        response = c.put(not_existed_uri, json.dumps(module_data),
                         content_type='application/json', **self.agent_header)
        self.assertEqual(response.status_code, 404)

        # DELETE
        response = c.delete(not_existed_uri, **self.agent_header)
        self.assertEqual(response.status_code, 404)

    def test_member_cannot_modify(self):
        ''' Member can only get data

        CUD
        '''

        c = Client()

        # POST
        module_data = {'robot_name': 'test'}
        response = c.post('/agent/module/', json.dumps(module_data),
                          content_type='application/json', **self.header)
        self.assertEqual(response.status_code, 403)
        res_data = json.loads(response.content)
        self.assertIn('errors', res_data)

        # PUT
        module_data = {'robot_name': 'test_1'}
        response = c.put(self.module_uri, json.dumps(module_data),
                         content_type='application/json', **self.header)
        self.assertEqual(response.status_code, 403)
        res_data = json.loads(response.content)
        self.assertIn('errors', res_data)

        # DELETE
        response = c.delete(self.module_uri, **self.header)
        self.assertEqual(response.status_code, 403)
        res_data = json.loads(response.content)
        self.assertIn('errors', res_data)

    def test_agent_create(self):
        ''' Agent create new module
        '''

        c = Client()
        module_data = {'robot_name': 'test'}
        response = c.post('/agent/module/', json.dumps(module_data),
                          content_type='application/json', **self.agent_header)
        self.assertEqual(response.status_code, 201)

    def test_list(self):
        ''' Agent and member get module list
        '''

        c = Client()
        list_keys = ['id', 'robot_name']

        response = c.get('/agent/module/', **self.agent_header)
        self.assertEqual(response.status_code, 200)
        res_data = json.loads(response.content)
        if res_data:
            for k in list_keys:
                self.assertIn(k, res_data[0])

    def test_read(self):
        ''' Agent and member retrieve module detail data
        '''

        c = Client()
        module_keys = ['robot_name', 'greeting_msg', 'failed_msg',
                       'postback_title', 'language', 'faq_count']

        response = c.get(self.module_uri, **self.agent_header)
        self.assertEqual(response.status_code, 200)
        res_data = json.loads(response.content)
        for k in module_keys:
            self.assertIn(k, res_data)

    def test_agent_update(self):
        ''' Agent update module
        '''

        c = Client()
        module_data = {'robot_name': 'test_1'}
        response = c.put(self.module_uri, json.dumps(module_data),
                         content_type='application/json', **self.agent_header)
        self.assertEqual(response.status_code, 204)

    def test_agent_delete(self):
        ''' Agent delete module
        '''

        c = Client()
        response = c.delete(self.module_uri, **self.agent_header)
        self.assertEqual(response.status_code, 204)


class ModuleFAQTest(TestCase):
    ''' Module FAQ group testing

    CRD
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

        # Inital module
        self.module_obj = Module.objects.create(robot_name='test',
                                                faq_count='1')

        # Initial module faq group
        module_faq_obj = ModuleFAQGroup.objects.create(module=self.module_obj)

        # Initial module question
        ModuleQuestion.objects.create(content='Hi I am {1:name:Nick}',
                                      module=self.module_obj,
                                      group=module_faq_obj)

        # Initial module answer
        ModuleAnswer.objects.create(content='Hi {1:name:Jack}, Im {2:name_2:}',
                                    module=self.module_obj,
                                    group=module_faq_obj)

        # Initial module faq uri
        self.module_faq_uri = \
            '/agent/module/' + str(self.module_obj.id) + '/faq/' + \
            str(module_faq_obj.id) + '/'
        self.get_field_uri = '/member/module/' + str(self.module_obj.id) \
            + '/get_fields/'

    def test_no_auth(self):
        ''' Module faq operation not authorized

        CRUD
        '''
        c = Client()

        # POST
        module_faq_data = {'module_id': self.module_obj.id}
        module_faq_uri = '/agent/module/' + str(self.module_obj.id) + '/faq/'
        response = c.post(module_faq_uri, json.dumps(module_faq_data),
                          content_type='application/json')
        self.assertEqual(response.status_code, 401)

        # GET
        response = c.get(self.module_faq_uri)
        self.assertEqual(response.status_code, 401)

        # PUT
        response = c.put(self.module_faq_uri, json.dumps(module_faq_data),
                         content_type='application/json')
        self.assertEqual(response.status_code, 401)

        # DELETE
        response = c.delete(self.module_faq_uri)
        self.assertEqual(response.status_code, 401)

    def test_not_existed(self):
        ''' Module faq not existed

        RUD
        '''
        c = Client()
        not_existed_uri = '/agent/module/' + str(self.module_obj.id) \
            + 'faq/1000/'
        # GET
        response = c.get(not_existed_uri, **self.agent_header)
        self.assertEqual(response.status_code, 404)

        # PUT
        module_faq_data = {'module_id': self.module_obj.id}
        response = c.put(not_existed_uri, json.dumps(module_faq_data),
                         content_type='application/json', **self.agent_header)
        self.assertEqual(response.status_code, 404)

        # DELETE
        response = c.delete(not_existed_uri, **self.agent_header)
        self.assertEqual(response.status_code, 404)

    def test_create(self):
        ''' Create module faq group
        '''

        c = Client()
        module_faq_data = {'module': self.module_obj.id}
        module_faq_uri = '/agent/module/' + str(self.module_obj.id) + '/faq/'
        response = c.post(module_faq_uri, json.dumps(module_faq_data),
                          content_type='application/json', **self.agent_header)
        self.assertEqual(response.status_code, 201)

        # Check if module faq_count has updated
        module_uri = '/agent/module/' + str(self.module_obj.id) + '/'
        response = c.get(module_uri, **self.agent_header)
        res_data = json.loads(response.content)
        faq_count = res_data.get('faq_count')
        self.assertEqual(faq_count, '2')

    def test_list(self):
        ''' List all module faq group
        '''

        c = Client()
        module_faq_keys = ['count', 'next', 'previous', 'results']
        module_faq_uri = '/agent/module/' + str(self.module_obj.id) + '/faq/'
        response = c.get(module_faq_uri, **self.agent_header)
        self.assertEqual(response.status_code, 200)
        res_data = json.loads(response.content)
        if res_data:
            for key in module_faq_keys:
                self.assertIn(key, res_data)

    def test_read(self):
        ''' Retrieve module faq group
        '''

        c = Client()
        module_faq_keys = ['group', 'answer', 'question']
        response = c.get(self.module_faq_uri, **self.agent_header)
        self.assertEqual(response.status_code, 200)
        res_data = json.loads(response.content)
        for k in module_faq_keys:
            self.assertIn(k, res_data)

    def test_delete(self):
        ''' Delete module faq group
        '''

        c = Client()
        response = c.delete(self.module_faq_uri, **self.agent_header)
        self.assertEqual(response.status_code, 204)

    def test_member_get_field(self):
        ''' Return a list of fields for member to fill
        Will check answer first. The example will assign with same key from
        question.
        '''

        c = Client()
        order_list = ['name', 'name_2']
        order_ex = ['Nick', '']

        response = c.get(self.get_field_uri, **self.header)
        self.assertEqual(response.status_code, 200)
        res_data = json.loads(response.content)
        self.assertIn('fields', res_data)
        fields = res_data.get('fields')
        for i in range(len(order_list)):
            self.assertIn(order_list[i], fields[i])
            self.assertEqual(order_ex[i], fields[i][order_list[i]])


class ModuleAnswerTest(TestCase):
    ''' Module answer unittest

    CRUD
    '''

    def setUp(self):
        # Initial paid type an third party
        staff_data = {
            'pk': 2,
            'name': 'Staff',
            'duration': '0_0',
            'bot_amount': '0',
            'faq_amount': '0',
            'user_type': 'S'
        }
        staff_obj = PaidType.objects.create(**staff_data)

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
            {'HTTP_AUTHORIZATION': 'Bearer ' + self.agent_token}

        # Initial module
        self.module_obj = Module.objects.create(robot_name='test')

        # Initial module faq group
        self.module_faq_obj = \
            ModuleFAQGroup.objects.create(module=self.module_obj)

        # Initial module answer
        answer_obj = ModuleAnswer.objects.create(content='HI',
                                                 module=self.module_obj,
                                                 group=self.module_faq_obj)

        # Initial module answer uri
        self.module_ans_uri = '/agent/module/' + str(self.module_obj.id) + \
            '/answer/' + str(answer_obj.id) + '/'

    def test_no_auth(self):
        ''' Module answer operation not authorized

        CRUD
        '''
        c = Client()

        # POST
        module_ans_data = {'content': 'hi', 'module_id': self.module_obj.id,
                           'group_id': self.module_faq_obj.id}
        module_faq_uri = '/agent/module/' + str(self.module_obj.id) + \
            '/answer/'
        response = c.post(module_faq_uri, json.dumps(module_ans_data),
                          content_type='application/json')
        self.assertEqual(response.status_code, 401)

        # GET
        response = c.get(self.module_ans_uri)
        self.assertEqual(response.status_code, 401)

        # PUT
        response = c.put(self.module_ans_uri, json.dumps(module_ans_data),
                         content_type='application/json')
        self.assertEqual(response.status_code, 401)

        # DELETE
        response = c.delete(self.module_ans_uri)
        self.assertEqual(response.status_code, 401)

    def test_not_existed(self):
        ''' Module answer does not exist

        RUD
        '''

        c = Client()
        ans_no_found_uri = self.module_ans_uri + '1000/'

        # GET
        response = c.get(ans_no_found_uri, **self.agent_header)
        self.assertEqual(response.status_code, 404)

        # PUT
        module_ans_data = {'content': 'Hello', 'module_id': self.module_obj.id,
                           'group_id': self.module_faq_obj.id}
        response = c.put(ans_no_found_uri, json.dumps(module_ans_data),
                         content_type='application/json', **self.agent_header)
        self.assertEqual(response.status_code, 404)

        # DELETE
        response = c.delete(ans_no_found_uri, **self.agent_header)
        self.assertEqual(response.status_code, 404)

    def test_create(self):
        ''' Create module answer
        '''

        c = Client()
        module_ans_data = {'content': 'Hi', 'group': self.module_faq_obj.id}
        module_faq_uri = '/agent/module/' + str(self.module_obj.id) + \
            '/answer/'
        response = c.post(module_faq_uri, json.dumps(module_ans_data),
                          content_type='application/json', **self.agent_header)
        self.assertEqual(response.status_code, 201)

    def test_list(self):
        ''' List all module answer from the group
        '''

        c = Client()
        module_ans_keys = ['id', 'content']
        module_faq_uri = '/agent/module/' + str(self.module_obj.id) + \
            '/answer/'
        response = c.get(module_faq_uri, **self.agent_header)
        self.assertEqual(response.status_code, 200)
        res_data = json.loads(response.content)
        if res_data:
            for k in module_ans_keys:
                self.assertIn(k, res_data[0])

    def test_read(self):
        ''' Retrieve the module answer
        '''

        c = Client()
        module_ans_keys = ['content', 'group']
        response = c.get(self.module_ans_uri, **self.agent_header)
        self.assertEqual(response.status_code, 200)
        res_data = json.loads(response.content)
        for k in module_ans_keys:
            self.assertIn(k, res_data)

    def test_update(self):
        ''' Update the module answer
        '''

        c = Client()
        module_ans_data = {'content': 'Hello'}
        response = c.put(self.module_ans_uri, json.dumps(module_ans_data),
                         content_type='application/json', **self.agent_header)
        self.assertEqual(response.status_code, 200)
        res_data = json.loads(response.content)
        self.assertIn('success', res_data)

    def test_delete(self):
        ''' Delete the module answer
        '''

        c = Client()
        response = c.delete(self.module_ans_uri, **self.agent_header)
        self.assertEqual(response.status_code, 204)


class ModuleQuestionTest(TestCase):
    ''' Module question unittest

    CRUD
    '''

    def setUp(self):
        # Initial paid type an third party
        staff_data = {
            'pk': 2,
            'name': 'Staff',
            'duration': '0_0',
            'bot_amount': '0',
            'faq_amount': '0',
            'user_type': 'S'
        }
        staff_obj = PaidType.objects.create(**staff_data)

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
            {'HTTP_AUTHORIZATION': 'Bearer ' + self.agent_token}

        # Initial module
        self.module_obj = Module.objects.create(robot_name='test')

        # Initial module faq group
        self.module_faq_obj = \
            ModuleFAQGroup.objects.create(module=self.module_obj)

        # Initial module question
        que_obj = ModuleQuestion.objects.create(content='HI',
                                                module=self.module_obj,
                                                group=self.module_faq_obj)

        # Initial module question uri
        self.module_que_uri = '/agent/module/' + str(self.module_obj.id) + \
            '/question/' + str(que_obj.id) + '/'

    def test_no_auth(self):
        ''' Module question operation not authorized

        CRUD
        '''
        c = Client()

        # POST
        module_que_data = {'content': 'hi', 'group': self.module_faq_obj.id}
        module_faq_uri = '/agent/module/' + str(self.module_obj.id) + \
            '/question/'
        response = c.post(module_faq_uri, json.dumps(module_que_data),
                          content_type='application/json')
        self.assertEqual(response.status_code, 401)

        # GET
        response = c.get(self.module_que_uri)
        self.assertEqual(response.status_code, 401)

        # PUT
        response = c.put(self.module_que_uri, json.dumps(module_que_data),
                         content_type='application/json')
        self.assertEqual(response.status_code, 401)

        # DELETE
        response = c.delete(self.module_que_uri)
        self.assertEqual(response.status_code, 401)

    def test_not_existed(self):
        ''' Module question does not exist

        RUD
        '''

        c = Client()
        que_no_found_uri = self.module_que_uri + '1000/'

        # GET
        response = c.get(que_no_found_uri, **self.agent_header)
        self.assertEqual(response.status_code, 404)

        # PUT
        module_que_data = {'content': 'Hello', 'group': self.module_faq_obj.id}
        response = c.put(que_no_found_uri, json.dumps(module_que_data),
                         content_type='application/json', **self.agent_header)
        self.assertEqual(response.status_code, 404)

        # DELETE
        response = c.delete(que_no_found_uri, **self.agent_header)
        self.assertEqual(response.status_code, 404)

    def test_create(self):
        ''' Create module question
        '''

        c = Client()
        module_que_data = {'content': 'Hi', 'group': self.module_faq_obj.id}
        module_faq_uri = '/agent/module/' + str(self.module_obj.id) + \
            '/question/'
        response = c.post(module_faq_uri, json.dumps(module_que_data),
                          content_type='application/json', **self.agent_header)
        self.assertEqual(response.status_code, 201)

    def test_list(self):
        ''' List all module question from the group
        '''

        c = Client()
        module_que_keys = ['id', 'content']
        module_faq_uri = '/agent/module/' + str(self.module_obj.id) + \
            '/question/'
        response = c.get(module_faq_uri, **self.agent_header)
        self.assertEqual(response.status_code, 200)
        res_data = json.loads(response.content)
        if res_data:
            for k in module_que_keys:
                self.assertIn(k, res_data[0])

    def test_read(self):
        ''' Retrieve the module question
        '''

        c = Client()
        module_que_keys = ['content', 'group']
        response = c.get(self.module_que_uri, **self.agent_header)
        self.assertEqual(response.status_code, 200)
        res_data = json.loads(response.content)
        for k in module_que_keys:
            self.assertIn(k, res_data)

    def test_update(self):
        ''' Update the module question
        '''

        c = Client()
        module_que_data = {'content': 'Hello'}
        response = c.put(self.module_que_uri, json.dumps(module_que_data),
                         content_type='application/json', **self.agent_header)
        self.assertEqual(response.status_code, 200)
        res_data = json.loads(response.content)
        self.assertIn('success', res_data)

    def test_delete(self):
        ''' Delete the module question
        '''

        c = Client()
        response = c.delete(self.module_que_uri, **self.agent_header)
        self.assertEqual(response.status_code, 204)


class ModuleCSVTest(TestCase):
    ''' Module CSV FAQ file testing

    Including upload, export
    '''
    def setUp(self):
        # Initial paid type an third party

        staff_data = {
            'pk': 2,
            'name': 'Staff',
            'duration': '0_0',
            'bot_amount': '0',
            'faq_amount': '0',
            'user_type': 'S'
        }

        staff_obj = PaidType.objects.create(**staff_data)

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
            {'HTTP_AUTHORIZATION': 'Bearer ' + self.agent_token}

        # Initial module
        self.module_obj = Module.objects.create(robot_name='test')

        # Initail uri
        self.module_uri = '/agent/module/' + str(self.module_obj.id)

        # Get sample csv files
        base_path = os.path.dirname(os.path.realpath(__file__))
        self.correct_csv = open(base_path + '/test_file/correct.csv')

    def test_no_auth(self):
        '''CSV action no authorization

        POST(upload), GET(export, train)
        '''
        c = Client()

        # Upload
        upload_uri = self.module_uri + '/upload/'
        response = c.post(upload_uri, {'file': self.correct_csv})
        self.assertEqual(response.status_code, 401)

        # Export
        export_uri = self.module_uri + '/export/'
        response = c.post(upload_uri, {'file': self.correct_csv})
        self.assertEqual(response.status_code, 401)

    def test_not_existed(self):
        ''' CSV action with no file

        For export, it will always export the file with header.
        For train test with bot not found.

        POST(upload)
        '''
        c = Client()

        # Upload
        not_existed_uri = self.module_uri + '/upload/'
        response = c.post(not_existed_uri, {}, **self.agent_header)
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
        upload_uri = self.module_uri + '/upload/'

        response = c.post(upload_uri, {'file': self.correct_csv},
                          **self.agent_header)
        self.assertEqual(response.status_code, 201)
        res_data = json.loads(response.content)
        self.assertIn('success', res_data)

        # Check if module faq_count has updated
        module_uri = self.module_uri + '/'
        response = c.get(module_uri, **self.agent_header)
        res_data = json.loads(response.content)
        faq_count = res_data.get('faq_count')
        self.assertEqual(faq_count, '9')

    def test_export(self):
        c = Client()
        export_uri = self.module_uri + '/export/'

        response = c.get(export_uri, **self.agent_header)
        self.assertEqual(response.status_code, 200)


class MemberModuleTest(TestCase):
    ''' Test for member module

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

        # Initial module
        module_data = {'robot_name': 'test', 'greeting_msg': 'greetings',
                       'failed_msg': 'failed', 'postback_title': 'related',
                       'language': 'tw'}
        self.module_obj = Module.objects.create(**module_data)

        # Module uri
        self.module_uri = '/member/module/' + str(self.module_obj.id) + '/'

    def test_no_auth(self):
        ''' Member get module no auth

        GET
        '''
        c = Client()

        response = c.get(self.module_uri)
        self.assertEqual(response.status_code, 401)

    def test_not_existed(self):
        ''' Member get module not existed

        GET
        '''
        c = Client()
        not_existed_uri = '/member/module/1000/'
        response = c.get(not_existed_uri, **self.header)
        self.assertEqual(response.status_code, 404)

    def test_list_module_check_faq_upper_limit(self):
        ''' List module data for member

        List module and check if faq is in limit
        '''
        c = Client()
        module_key = ['id', 'robot_name', 'available']
        module_uri = '/member/module/'
        response = c.get(module_uri, **self.header)
        self.assertEqual(response.status_code, 200)
        res_data = json.loads(response.content)
        for k in module_key:
            self.assertIn(k, res_data[0])

    def test_get_module_check_faq_upper_limit(self):
        ''' Read module data for member

        Read module and check if faq is in limit
        '''
        c = Client()
        module_key = ['id', 'robot_name', 'greeting_msg', 'failed_msg',
                      'postback_title', 'language', 'available']
        response = c.get(self.module_uri, **self.header)
        self.assertEqual(response.status_code, 200)
        res_data = json.loads(response.content)
        for k in module_key:
            self.assertIn(k, res_data)

    def test_get_module_over_limit(self):
        ''' Read module data for member with faq overlimit

        Read module when faq over limit
        '''
        c = Client()
        self.module_obj.faq_count = '60'
        self.module_obj.save()
        response = c.get(self.module_uri, **self.header)
        self.assertEqual(response.status_code, 200)
        res_data = json.loads(response.content)
        available = res_data.get('available')
        self.assertEqual(available, False)
