import json
from django.test import TestCase, Client

import chat_console_3.utils as utils

from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token
from account.models import AccountInfo
from paidtype.models import PaidType
from thirdparty.models import ThirdParty


class MemberRegisterTest(TestCase):
    '''Member register new account function

    Only for testing member register apis
    '''
    def setUp(self):
        # Initial paid type an third party
        trial_data = {
            'pk': 1,
            'name': 'Trail',
            'duration': '0_0',
            'bot_amount': '1',
            'faq_amount': '50'
        }

        demo_data = {
            'pk': 4,
            'name': 'demo'
        }
        trial_obj = PaidType.objects.create(**trial_data)
        demo_obj = ThirdParty.objects.create(**demo_data)
        trial_obj.third_party.add(demo_obj)

    def test_key_amount_not_correct(self):
        c = Client()
        response = c.post('/member/register/',
                          json.dumps({'username':'test@gmail.com',
                                      'password':'thisispassword',
                                      'first_name':'nickname',
                                      'other':'other'}),
                          content_type='application/json')
        self.assertEqual(response.status_code, 400)
        res_data = json.loads(response.content)
        self.assertIn('errors', res_data)
        
        response = c.post('/member/register/',
                          json.dumps({'username':'test@gmail.com',
                                      'password':'thisispassword'}),
                          content_type='application/json')
        self.assertEqual(response.status_code, 400)
        res_data = json.loads(response.content)
        self.assertIn('errors', res_data)

        response = c.post('/member/register/',
                          json.dumps({}),
                          content_type='application/json')
        self.assertEqual(response.status_code, 400)
        res_data = json.loads(response.content)
        self.assertIn('errors', res_data)
    
    def test_key_not_correct(self):
        c = Client()
        response = c.post('/member/register/',
                          json.dumps({'username':'test@gmail.com',
                                      'password':'thisispassword',
                                      'other':'other'}),
                          content_type='application/json')
        self.assertEqual(response.status_code, 400)
        res_data = json.loads(response.content)
        self.assertIn('errors', res_data)

    def test_email_not_valid(self):
        c = Client()
        response = c.post('/member/register/',
                          json.dumps({'username':'thisisemail123',
                                      'password':'thisispassword',
                                      'first_name':'nickname'}),
                          content_type='application/json')
        self.assertEqual(response.status_code, 400)
        res_data = json.loads(response.content)
        self.assertIn('errors', res_data)

    def test_register_duplicated(self):
        user_obj = {
            'username': 'cosmo.hu@lingtelli.com',
            'password': 'thisispassword',
            'first_name': 'cosmo'
        }
        User.objects.create(**user_obj)
        c = Client()
        response = c.post('/member/register/',
                          json.dumps({'username':'cosmo.hu@lingtelli.com',
                                      'password':'anotherpassword',
                                      'first_name':'cosmoother'}),
                          content_type='application/json')
        self.assertEqual(response.status_code, 403)
        res_data = json.loads(response.content)
        self.assertIn('errors', res_data)

    def test_register_successed(self):
        c = Client()
        response = c.post('/member/register/',
                          json.dumps({'username':'cosmo.hu@lingtelli.com',
                                      'password':'thisispassword',
                                      'first_name':'cosmo'}),
                          content_type='application/json')
        self.assertEqual(response.status_code, 201)
        res_data = json.loads(response.content)
        user_obj = User.objects.get(username='cosmo.hu@lingtelli.com')
        self.assertIn('success', res_data)
        self.assertEqual(user_obj.is_active, False)


class ResendEmail(TestCase):
    '''Resend email function

    To test if resend function works
    '''
    def setUp(self):
        # Initial paid type an third party
        trial_data = {
            'pk': 1,
            'name': 'Trail',
            'duration': '0_0',
            'bot_amount': '1',
            'faq_amount': '50'
        }

        demo_data = {
            'pk': 4,
            'name': 'demo'
        }

        trial_obj = PaidType.objects.create(**trial_data)
        demo_obj = ThirdParty.objects.create(**demo_data)
        trial_obj.third_party.add(demo_obj)

    def test_cannot_find_user(self):
        c = Client()
        
        response = c.get('/member/resend/',
                          {'username': 'cosmo.hu@lingtelli.com'})
        self.assertEqual(response.status_code, 404)
        res_data = json.loads(response.content)
        self.assertIn('errors', res_data)

    def test_confirmed_resend(self):
        c = Client()
        # Initial a member account first(This part is not good. Should not 
        # implement other function in here for initialing data.)
        c.post('/member/register/', 
               json.dumps({'username': 'cosmo.hu@lingtelli.com',
                           'password': 'thistispassword',
                           'first_name': 'cosmo'}),
               content_type='application/json')

        # Set user is_active to true
        user_obj = User.objects.get(username='cosmo.hu@lingtelli.com')
        user_obj.is_active = True
        user_obj.save()

        # Requset sending email again
        response = \
            c.get('/member/resend/', {'username': 'cosmo.hu@lingtelli.com'})
        self.assertEqual(response.status_code, 403)
        res_data = json.loads(response.content)
        self.assertIn('errors', res_data)

    def test_send_over_3_times(self):
        c = Client()
        # Initial a member account first
        c.post('/member/register/', 
               json.dumps({'username': 'cosmo.hu@lingtelli.com',
                           'password': 'thistispassword',
                           'first_name': 'cosmo'}),
               content_type='application/json')
        response = {}
        for i in range(0,4):
            response = \
                c.get('/member/resend/', 
                      {'username': 'cosmo.hu@lingtelli.com'})
        self.assertEqual(response.status_code, 403)
        res_data = json.loads(response.content)
        self.assertIn('errors', res_data)


class ConfirmEmail(TestCase):
    '''Confirmation email function

    Sending confirmation email after registering the new account
    '''
    def setUp(self):
        # Initial paid type an third party
        trial_data = {
            'pk': 1,
            'name': 'Trail',
            'duration': '0_0',
            'bot_amount': '1',
            'faq_amount': '50'
        }

        demo_data = {
            'pk': 4,
            'name': 'demo'
        }

        trial_obj = PaidType.objects.create(**trial_data)
        demo_obj = ThirdParty.objects.create(**demo_data)
        trial_obj.third_party.add(demo_obj)

    def test_first_confirm_successed(self):
        # Initial a member account first(This part is not good. Should not 
        # implement other function in here for initialing data.)
        c = Client()
        c.post('/member/register/', 
               json.dumps({'username': 'cosmo.hu@lingtelli.com',
                           'password': 'thistispassword',
                           'first_name': 'cosmo'}),
               content_type='application/json')
        user = User.objects.get(username='cosmo.hu@lingtelli.com')
        code = AccountInfo.objects.get(user=user).confirmation_code
        
        response = c.post('/member/confirm/', json.dumps({'code': code}),
                          content_type='application/json')
        user = User.objects.get(username='cosmo.hu@lingtelli.com')
        self.assertEqual(response.status_code, 200)
        res_data = json.loads(response.content)
        self.assertIn('success', res_data)
        self.assertEqual(user.is_active, True)

    def test_code_invalid(self):
        # Initial a member account first(This part is not good. Should not 
        # implement other function in here for initialing data.)
        c = Client()
        c.post('/member/register/', 
               json.dumps({'username': 'cosmo.hu@lingtelli.com',
                           'password': 'thistispassword',
                           'first_name': 'cosmo'}),
               content_type='application/json')
        
        code = 'thisisnotcorrectconfirmationcode'
        response = c.post('/member/confirm/', json.dumps({'code': code}),
                          content_type='application/json')
        self.assertEqual(response.status_code, 403)
        res_data = json.loads(response.content)
        self.assertIn('errors', res_data)

    def test_username_not_found(self):
        c = Client()
        code = '+eSIOmV5GkSz9IRql1nYfmox7/QVlQa1Y1NUF3yvGXc1WchyBrZV+6qPo1V5X+3D8BiP0iDuTQw9B0p/78Tlag=='
        response = c.post('/member/confirm/', json.dumps({'code': code}),
                          content_type='application/json')
        self.assertEqual(response.status_code, 400)
        res_data = json.loads(response.content)
        self.assertIn('errors', res_data)

    def test_has_confirmed(self):
        # Initial a member account(This part is not good. Should not 
        # implement other function in here for initialing data.)
        c = Client()
        c.post('/member/register/', 
               json.dumps({'username': 'cosmo.hu@lingtelli.com',
                           'password': 'thistispassword',
                           'first_name': 'cosmo'}),
               content_type='application/json')
        user = User.objects.get(username='cosmo.hu@lingtelli.com')
        code = AccountInfo.objects.get(user=user).confirmation_code
        
        # First confirmation
        c.post('/member/confirm/', json.dumps({'code': code}),
               content_type='application/json')
        
        # Confirm again
        response = c.post('/member/confirm/', json.dumps({'code': code}),
                          content_type='application/json')
        self.assertEqual(response.status_code, 400)
        res_data = json.loads(response.content)
        self.assertIn('errors', res_data)

    def test_change_username(self):
        # Initial a member account(This part is not good. Should not 
        # implement other function in here for initialing data.)
        c = Client()
        c.post('/member/register/', 
               json.dumps({'username': 'cosmo.hu@lingtelli.com',
                           'password': 'thistispassword',
                           'first_name': 'cosmo'}),
               content_type='application/json')
        user = User.objects.get(username='cosmo.hu@lingtelli.com')
        acc_info = AccountInfo.objects.get(user=user)
        code = acc_info.confirmation_code

        # First confirmation
        c.post('/member/confirm/', json.dumps({'code': code}),
               content_type='application/json')

        # Pretending update username
        new_user = User.objects.get(username='cosmo.hu@lingtelli.com')
        new_user.email = 'cosmo.hu+1@lingtelli.com'
        new_user.save()
        new_code = utils.generate_confirmation_code(new_user)
        acc_info.confirmation_code = new_code
        acc_info.save()

        response = c.post('/member/confirm/', json.dumps({'code': new_code}),
                           content_type='application/json')
        self.assertEqual(response.status_code, 200)
        res_data = json.loads(response.content)
        self.assertIn('success', res_data)
        self.assertIs(user.email, '')


class MemberAccessTest(TestCase):
    '''Member access control to the website

    Contain login and logout features
    '''
    def setUp(self):
        # Initial paid type an third party
        trial_data = {
            'pk': 1,
            'name': 'Trail',
            'duration': '0_0',
            'bot_amount': '1',
            'faq_amount': '50'
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
        user_obj = User.objects.create_user(**user_data)

        # Create another account for not confirmed testing
        other_user_data = {'username': 'test@lingtelli.com',
                           'password': 'testpassword',
                           'first_name': 'test',
                           'is_active': False}
        other_user_obj = User.objects.create(**other_user_data)

    def test_login(self):
        c = Client()
        response = c.post('/member/login/',
                          json.dumps({'username': 'cosmo.hu@lingtelli.com',
                                      'password': 'thisispassword'}),
                          content_type='application/json')
        self.assertEqual(response.status_code, 200)
        res_data = json.loads(response.content)
        self.assertIn('success', res_data)
    
    def test_login_empty_input(self):
        c = Client()
        response = c.post('/member/login/', json.dumps({}),
                          content_type='application/json')
        self.assertEqual(response.status_code, 400)
        res_data = json.loads(response.content)
        self.assertIn('errors', res_data)
    
    def test_login_user_not_found(self):
        c = Client()
        response = c.post('/member/login/',
                          json.dumps({'username': 'wrong@lingtelli.com',
                                      'password': 'thisispassword'}),
                          content_type='application/json')
        self.assertEqual(response.status_code, 404)
        res_data = json.loads(response.content)
        self.assertIn('errors', res_data)
    
    def test_login_wrong_password(self):
        c = Client()
        response = c.post('/member/login/',
                          json.dumps({'username': 'cosmo.hu@lingtelli.com',
                                      'password': 'thisiswrongpassword'}),
                          content_type='application/json')
        self.assertEqual(response.status_code, 403)
        res_data = json.loads(response.content)
        self.assertIn('errors', res_data)
    
    def test_login_not_confirmed(self):
        c = Client()
        response = c.post('/member/login/',
                          json.dumps({'username': 'test@lingtelli.com',
                                      'password': 'testpassword'}),
                          content_type='application/json')
        self.assertEqual(response.status_code, 403)
        res_data = json.loads(response.content)
        self.assertIn('errors', res_data)
    
    def test_login_again(self):
        '''User has logged in but tried to login again
        '''
        c = Client()
        response = c.post('/member/login/',
                          json.dumps({'username': 'cosmo.hu@lingtelli.com',
                                      'password': 'thisispassword'}),
                          content_type='application/json')
        res_data = json.loads(response.content)
        token = res_data.get('success')
        header = {'HTTP_AUTHORIZATION': 'Token ' + token}
        response = c.post('/member/login/',
                          json.dumps({'username': 'cosmo.hu@lingtelli.com',
                                      'password': 'thisispassword'}),
                          content_type='application/json', **header)
        self.assertEqual(response.status_code, 400)
        res_data = json.loads(response.content)
        self.assertIn('errors', res_data)

    
    def test_logout(self):
        # Login to get token first
        user_obj = User.objects.get(username='cosmo.hu@lingtelli.com')
        accesstoken = Token.objects.create(user=user_obj)

        # Logout the user
        c = Client()
        header = {'HTTP_AUTHORIZATION': 'Token ' + accesstoken.key}
        response = c.get('/member/logout/', **header)
        self.assertEqual(response.status_code, 200)
        res_data = json.loads(response.content)
        old_token = Token.objects.filter(key=accesstoken.key).first()
        self.assertIn('success', res_data)
        self.assertIs(old_token, None)
    
    def test_logout_no_auth(self):
        c = Client()
        response = c.get('/member/logout/')
        self.assertEqual(response.status_code, 401)


class MemberProfileTest(TestCase):
    '''Member profile operations

    Features:
        Read user's own profile data
        Update username, password and nickname
        Delete account
    '''
    def setUp(self):
        # Initial paid type an third party
        trial_data = {
            'pk': 1,
            'name': 'Trail',
            'duration': '0_0',
            'bot_amount': '1',
            'faq_amount': '50'
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

        # Initial user id uri
        user_id = self.user_obj.id
        self.uri = '/member/' + str(user_id) + '/'

        # Login User
        token_obj = Token.objects.create(user=self.user_obj)
        self.accesstoken = token_obj.key

    def test_no_auth(self):
        '''Member profile action no authorization

        GET, PUT, DELETE
        '''

        c = Client()
        # GET
        response = c.get(self.uri)
        self.assertEqual(response.status_code, 401)

        # PUT
        response = c.put(self.uri, 
                         json.dumps({'old_password': 'thisispassword',
                                     'password': 'newpassword'}),
                         content_type='application/json')
        self.assertEqual(response.status_code, 401)

        # Delete
        response = c.delete(self.uri)
        self.assertEqual(response.status_code, 401)
    
    def test_not_existed(self):
        '''Member account not existed

        GET, PUT, DELETE
        '''
        c = Client()
        header = {'HTTP_AUTHORIZATION': 'Token ' + self.accesstoken}
        not_existed_uri = '/member/123/'
        # GET
        response = c.get(not_existed_uri, **header)
        self.assertEqual(response.status_code, 404)
        res_data = json.loads(response.content)
        self.assertIn('errors', res_data)

        # PUT
        response = c.put(not_existed_uri,
                         json.dumps({'old_password': 'thisispassword',
                                     'password': 'newpassword'}),
                         content_type='application/json', **header)
        self.assertEqual(response.status_code, 404)
        res_data = json.loads(response.content)
        self.assertIn('errors', res_data)

        # Delete
        response = c.delete(not_existed_uri, **header)
        self.assertEqual(response.status_code, 404)
        res_data = json.loads(response.content)
        self.assertIn('errors', res_data)
        
    def test_read(self):
        profile_key = ['id','username', 'first_name', 'paid_type',
                       'start_date', 'expire_date', 'language']
        c = Client()
        header = {'HTTP_AUTHORIZATION': 'Token ' + self.accesstoken}
        response = c.get(self.uri, **header)
        self.assertEqual(response.status_code, 200)
        res_data = json.loads(response.content)
        self.assertEqual(len(res_data), len(profile_key))
        for k in profile_key:
            self.assertIn(k, res_data)
    
    def test_update_empty(self):
        c = Client()
        header = {'HTTP_AUTHORIZATION': 'Token ' + self.accesstoken}
        response = c.put(self.uri, content_type='application/json', **header)
        self.assertEqual(response.status_code, 400)
        res_data = json.loads(response.content)
        self.assertIn('errors', res_data)
    
    def test_update_username(self):
        c = Client()
        header = {'HTTP_AUTHORIZATION': 'Token ' + self.accesstoken}
        response = c.put(self.uri,
                         json.dumps({'username': 'test@lingtelli.com'}),
                         content_type='application/json', **header)
        token = Token.objects.filter(user=self.user_obj).first()
        self.assertEqual(response.status_code, 200)
        res_data = json.loads(response.content)
        self.assertIn('success', res_data)
        self.assertEqual(token, None)
        self.assertEqual(self.user_obj.email, '')

    def test_update_username_duplicated(self):
        c = Client()
        header = {'HTTP_AUTHORIZATION': 'Token ' + self.accesstoken}
        response = c.put(self.uri,
                         json.dumps({'username': 'cosmo.hu@lingtelli.com'}),
                         content_type='application/json', **header)
        token = Token.objects.filter(user=self.user_obj).first()
        self.assertEqual(response.status_code, 400)
        res_data = json.loads(response.content)
        self.assertIn('errors', res_data)
        self.assertEqual(token.key, self.accesstoken)
    
    def test_update_password(self):
        c = Client()
        header = {'HTTP_AUTHORIZATION': 'Token ' + self.accesstoken}
        response = c.put(self.uri, 
                         json.dumps({'old_password': 'thisispassword',
                                     'password': 'newpassword'}),
                         content_type='application/json', **header)
        token = Token.objects.filter(user=self.user_obj).first()
        self.assertEqual(response.status_code, 200)
        res_data = json.loads(response.content)
        self.assertIn('success', res_data)
        self.assertEqual(token, None)
    
    def test_update_wrong_old_password(self):
        c = Client()
        header = {'HTTP_AUTHORIZATION': 'Token ' + self.accesstoken}
        response = c.put(self.uri, json.dumps({'old_password': 'thisiswrong',
                                               'password': 'newpassword'}),
                         content_type='application/json', **header)
        token = Token.objects.filter(user=self.user_obj).first()
        self.assertEqual(response.status_code, 403)
        res_data = json.loads(response.content)
        self.assertIn('errors', res_data)
        self.assertEqual(token.key, self.accesstoken)

    def test_update_nickname(self):
        c = Client()
        header = {'HTTP_AUTHORIZATION': 'Token ' + self.accesstoken}
        response = c.put(self.uri,
                         json.dumps({'first_name': 'test'}),
                         content_type='application/json', **header)
        new_user_obj = User.objects.filter(id=self.user_obj.id).first()
        self.assertEqual(response.status_code, 200)
        res_data = json.loads(response.content)
        self.assertIn('success', res_data)
        self.assertEqual(new_user_obj.first_name, 'test')

    def test_update_language(self):
        c = Client()
        header = {'HTTP_AUTHORIZATION': 'Token ' + self.accesstoken}
        response = c.put(self.uri,
                         json.dumps({'language': 'en'}),
                         content_type='application/json', **header)
        new_acc_obj = AccountInfo.objects.filter(user=self.user_obj).first()
        self.assertEqual(response.status_code, 200)
        res_data = json.loads(response.content)
        self.assertIn('success', res_data)
        self.assertEqual(new_acc_obj.language, 'en')

    def test_update_language_empty(self):
        c = Client()
        header = {'HTTP_AUTHORIZATION': 'Token ' + self.accesstoken}
        ori_acc_obj = AccountInfo.objects.filter(user=self.user_obj).first()
        response = c.put(self.uri,
                         json.dumps({'language':''}),
                         content_type='application/json', **header)
        new_acc_obj = AccountInfo.objects.filter(user=self.user_obj).first()
        self.assertEqual(response.status_code, 400)
        res_data = json.loads(response.content)
        self.assertIn('errors', res_data)
        self.assertEqual(new_acc_obj.language, ori_acc_obj.language)

    def test_delete(self):
        user_obj = User.objects.get(username='cosmo.hu@lingtelli.com')
        acc_obj = AccountInfo.objects.get(user=user_obj)
        acc_obj.delete_confirm = True
        acc_obj.save()
        c = Client()
        header = {'HTTP_AUTHORIZATION': 'Token ' + self.accesstoken}
        response = c.delete(self.uri, **header)
        check_delete_user = \
            User.objects.filter(username='cosmo.hu@lingtelli.com').first()
        self.assertEqual(response.status_code, 204)
        self.assertEqual(check_delete_user, None)
    
    def test_delete_no_confirm(self):
        c = Client()
        header = {'HTTP_AUTHORIZATION': 'Token ' + self.accesstoken}
        response = c.delete(self.uri, **header)
        check_delete_user = \
            User.objects.filter(username='cosmo.hu@lingtelli.com').first()
        self.assertEqual(response.status_code, 403)
        res_data = json.loads(response.content)
        self.assertIn('errors', res_data)
        self.assertNotEqual(check_delete_user, None)

class DeleteAccountConfirmTest(TestCase):
    '''Deleting account confirm

    Asking user to input password before deleting account
    '''
    def setUp(self):
        # Initial thirdparty and paidtype
        trial_data = {
            'pk': 1,
            'name': 'Trail',
            'duration': '0_0',
            'bot_amount': '1',
            'faq_amount': '50'
        }

        demo_data = {
            'pk': 4,
            'name': 'demo'
        }
        trial_obj = PaidType.objects.create(**trial_data)
        demo_obj = ThirdParty.objects.create(**demo_data)
        trial_obj.third_party.add(demo_obj)

        # Initial an account
        user_data = {'username': 'cosmo.hu@lingtelli.com',
                     'password': 'thisispassword',
                     'first_name': 'cosmo'}
        user_obj = User.objects.create_user(**user_data)

        # Create account info
        acc_data = {'user': user_obj, 'paid_type': trial_obj,
                    'confirmation_code': 'confirmationcode', 
                    'code_reset_time': '2019-12-12 00:00:00', }
        AccountInfo.objects.create(**acc_data)

        # Initial user id uri
        user_id = user_obj.id
        self.uri = '/member/' + str(user_id) + '/delete_confirm/'

        # Login User
        token_obj = Token.objects.create(user=user_obj)
        self.accesstoken = token_obj.key

    def test_update_confirm_no_auth(self):
        c = Client()
        correct_password = {'password': 'thisispassword'}
        response = c.put(self.uri, json.dumps(correct_password), 
                          content_type='application/json')
        self.assertEqual(response.status_code, 401)

    def test_update_confirm_correct_password(self):
        c = Client()
        correct_password = {'password': 'thisispassword'}
        header = {'HTTP_AUTHORIZATION': 'Token ' + self.accesstoken}
        response = c.put(self.uri, json.dumps(correct_password), 
                          content_type='application/json', **header)
        user_obj = User.objects.get(username='cosmo.hu@lingtelli.com')
        acc_info = AccountInfo.objects.get(user=user_obj)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(acc_info.delete_confirm, True)
        res_data = json.loads(response.content)
        self.assertIn('success', res_data)

    def test_update_confirm_wrong_password(self):
        c = Client()
        correct_password = {'password': 'wrongpassword'}
        header = {'HTTP_AUTHORIZATION': 'Token ' + self.accesstoken}
        response = c.put(self.uri, json.dumps(correct_password), 
                          content_type='application/json', **header)
        self.assertEqual(response.status_code, 403)
        res_data = json.loads(response.content)
        self.assertIn('errors', res_data)
