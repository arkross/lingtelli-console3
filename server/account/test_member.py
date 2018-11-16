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
        trail_obj = {
            'pk': 1,
            'name': 'Trail',
            'duration': '0_0',
            'bot_amount': '1',
            'faq_amount': '50'
        }

        demo_obj = {
            'pk': 4,
            'name': 'demo'
        }
        paidtype_obj = PaidType.objects.create(**trail_obj)
        thirdparty_obj = ThirdParty.objects.create(**demo_obj)
        paidtype_obj.thirdparty.add(thirdparty_obj)

    def test_key_amount_not_correct(self):
        c = Client()
        response = c.post('/member/register/',
                          json.dumps({'username':'test@gmail.com',
                                      'password':'thisispassword',
                                      'first_name':'nickname',
                                      'other':'other'}),
                          content_type='application/json')
        res_data = json.loads(response.content)
        self.assertEqual(response.status_code, 400)
        self.assertEqual(res_data.get('errors'), 
                         'Lack or more then the required key amount')
        
        response = c.post('/member/register/',
                          json.dumps({'username':'test@gmail.com',
                                      'password':'thisispassword'}),
                          content_type='application/json')
        res_data = json.loads(response.content)
        self.assertEqual(response.status_code, 400)
        self.assertEqual(res_data.get('errors'),
                         'Lack or more then the required key amount')

        response = c.post('/member/register/',
                          json.dumps({}),
                          content_type='application/json')
        res_data = json.loads(response.content)
        self.assertEqual(response.status_code, 400)
        self.assertEqual(res_data.get('errors'),
                         'Lack or more then the required key amount')
    
    def test_key_not_correct(self):
        c = Client()
        response = c.post('/member/register/',
                          json.dumps({'username':'test@gmail.com',
                                      'password':'thisispassword',
                                      'other':'other'}),
                          content_type='application/json')
        res_data = json.loads(response.content)
        self.assertEqual(response.status_code, 400)
        self.assertEqual(res_data.get('errors'), 'Key missing: first_name')

    def test_email_not_valid(self):
        c = Client()
        response = c.post('/member/register/',
                          json.dumps({'username':'thisisemail123',
                                      'password':'thisispassword',
                                      'first_name':'nickname'}),
                          content_type='application/json')
        res_data = json.loads(response.content)
        self.assertEqual(response.status_code, 400)
        self.assertEqual(res_data.get('errors'), 'Invalid email address')

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
        res_data = json.loads(response.content)
        self.assertEqual(response.status_code, 403)
        self.assertEqual(res_data.get('errors'), 'User name has existed')

    def test_register_successed(self):
        c = Client()
        response = c.post('/member/register/',
                          json.dumps({'username':'cosmo.hu@lingtelli.com',
                                      'password':'thisispassword',
                                      'first_name':'cosmo'}),
                          content_type='application/json')
        res_data = json.loads(response.content)
        user_obj = User.objects.get(username='cosmo.hu@lingtelli.com')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(res_data.get('success'),
            'User has successfully created. ' +\
            'Please check email for account validation')
        self.assertEqual(user_obj.is_active, False)


class ResendEmail(TestCase):
    '''Resend email function

    To test if resend function works
    '''

    def setUp(self):
        # Initial paid type an third party
        trail_obj = {
            'pk': 1,
            'name': 'Trail',
            'duration': '0_0',
            'bot_amount': '1',
            'faq_amount': '50'
        }

        demo_obj = {
            'pk': 4,
            'name': 'demo'
        }

        paidtype_obj = PaidType.objects.create(**trail_obj)
        thirdparty_obj = ThirdParty.objects.create(**demo_obj)
        paidtype_obj.thirdparty.add(thirdparty_obj)


    def test_cannot_find_user(self):
        c = Client()
        
        response = c.get('/member/resend/',
                          {'username': 'cosmo.hu@lingtelli.com'})
        res_data = json.loads(response.content)
        self.assertEqual(response.status_code, 404)
        self.assertEqual(res_data.get('errors'), 
                         'Please register an account first')

    def test_confirmed_resend(self):
        c = Client()
        # Initial a member account first
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
        res_data = json.loads(response.content)
        self.assertEqual(response.status_code, 403)
        self.assertEqual(res_data.get('errors'),
            'Account has been confirmed. ' +\
            'No need to get confirmation email again')

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
        res_data = json.loads(response.content)
        self.assertEqual(response.status_code, 403)
        self.assertIn('Please wait for a while to resend the code',
                      res_data.get('errors'))


class ConfirmEmail(TestCase):
    '''Confirmation email function

    Sending confirmation email after registering the new account
    '''
    def setUp(self):
        # Initial paid type an third party
        trail_obj = {
            'pk': 1,
            'name': 'Trail',
            'duration': '0_0',
            'bot_amount': '1',
            'faq_amount': '50'
        }

        demo_obj = {
            'pk': 4,
            'name': 'demo'
        }

        paidtype_obj = PaidType.objects.create(**trail_obj)
        thirdparty_obj = ThirdParty.objects.create(**demo_obj)
        paidtype_obj.thirdparty.add(thirdparty_obj)

    def test_first_confirm_successed(self):
        # Initial a member account first
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
        res_data = json.loads(response.content)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(res_data.get('success'), 'Account has been validated')
        self.assertEqual(user.is_active, True)

    def test_code_invalid(self):
        # Initial a member account first
        c = Client()
        c.post('/member/register/', 
               json.dumps({'username': 'cosmo.hu@lingtelli.com',
                           'password': 'thistispassword',
                           'first_name': 'cosmo'}),
               content_type='application/json')
        
        code = 'thisisnotcorrectconfirmationcode'
        response = c.post('/member/confirm/', json.dumps({'code': code}),
                          content_type='application/json')
        res_data = json.loads(response.content)
        self.assertEqual(response.status_code, 403)
        self.assertEqual(res_data.get('errors'), 'Invalid code')
        


    def test_username_not_found(self):
        c = Client()
        code = '+eSIOmV5GkSz9IRql1nYfmox7/QVlQa1Y1NUF3yvGXc1WchyBrZV+6qPo1V5X+3D8BiP0iDuTQw9B0p/78Tlag=='
        response = c.post('/member/confirm/', json.dumps({'code': code}),
                          content_type='application/json')
        res_data = json.loads(response.content)
        self.assertEqual(response.status_code, 400)
        self.assertEqual(res_data.get('errors'), 'Account validation failed')

    def test_has_confirmed(self):
        # Initial a member account
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
        res_data = json.loads(response.content)
        self.assertEqual(response.status_code, 400)
        self.assertEqual(res_data.get('errors'), 
                         'Account has been confirmed. ' +\
                         'No need to get confirmation email again')


    def test_change_username(self):
        # Initial a member account
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
        res_data = json.loads(response.content)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(res_data.get('success'), 'User name has been changed')
        self.assertIs(user.email, '')

# TODO: Function not yet finished
class MemberAccessTest(TestCase):
    '''Member access control to the website

    Contain login and logout features
    '''

    def setUp(self):
        # Initial paid type an third party
        trail_obj = {
            'pk': 1,
            'name': 'Trail',
            'duration': '0_0',
            'bot_amount': '1',
            'faq_amount': '50'
        }

        demo_obj = {
            'pk': 4,
            'name': 'demo'
        }
        paidtype_obj = PaidType.objects.create(**trail_obj)
        thirdparty_obj = ThirdParty.objects.create(**demo_obj)
        paidtype_obj.thirdparty.add(thirdparty_obj)

        # Create new account
        user_data = {'username': 'cosmo.hu@lingtelli.com',
                     'password': 'thisispassword',
                     'first_name': 'cosmo'}
        user_obj = User.objects.create(**user_data)

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
        res_data = json.loads(response.content)
        self.assertEqual(response.status_code, 200)
        self.assertIn('token', res_data)
    
    def test_login_user_not_found(self):
        c = Client()
        response = c.post('/member/login/',
                          json.dumps({'username': 'wrong@lingtelli.com',
                                      'password': 'thisispassword'}),
                          content_type='application/json')
        res_data = json.loads(response.content)
        self.assertEqual(response.status_code, 404)
        self.assertEqual(res_data.get('errors'),
                         'Please register an account first')
    
    def test_login_wrong_password(self):
        c = Client()
        response = c.post('/member/login/',
                          json.dumps({'username': 'cosmo.hu@lingtelli.com',
                                      'password': 'thisiswrongpassword'}),
                          content_type='application/json')
        res_data = json.loads(response.content)
        self.assertEqual(response.status_code, 403)
        self.assertEqual(res_data.get('errors'),
                         'Username or password is not correct')
    
    def test_login_not_confirmed(self):
        c = Client()
        response = c.post('/member/login/',
                          json.dumps({'username': 'test@lingtelli.com',
                                      'password': 'testpassword'}),
                          content_type='application/json')
        res_data = json.loads(response.content)
        self.assertEqual(response.status_code, 403)
        self.assertEqual(res_data.get('errors'),
                         'Account has not been confirmed yet. ' +\
                         'Please check your email box')
    
    def test_logout(self):
        # Login to get token first
        user_obj = User.objects.get(username='cosmo.hu@lingtelli.com')
        accesstoken = Token.objects.create(user=user_obj)

        # Logout the user
        c = Client()
        header = {'HTTP_AUTHORIZATION': 'bearer ' + accesstoken.key}
        response = c.get('/member/logout/', **header)
        res_data = json.loads(response.content)
        old_token = Token.objects.filter(key=accesstoken.key).first()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(res_data.get('success'), 'Logout successfully')
        self.assertIs(old_token, None)
    
    def test_logout_no_token(self):
        c = Client()
        response = c.get('/member/logout/')
        res_data = json.loads(response.content)
        self.assertEqual(response.status_code, 403)
        self.assertEqual(res_data.get('errors'), 'You have not logged in yet')

# TODO: Function not yet finished
class MemberProfileTest(TestCase):
    '''Member profile operations

    Features:
        Read user's own profile data
        Update username, password and nickname
        Delete account
    '''

    def setUp(self):
        # Initial paid type an third party
        trail_obj = {
            'pk': 1,
            'name': 'Trail',
            'duration': '0_0',
            'bot_amount': '1',
            'faq_amount': '50'
        }

        demo_obj = {
            'pk': 4,
            'name': 'demo'
        }
        paidtype_obj = PaidType.objects.create(**trail_obj)
        thirdparty_obj = ThirdParty.objects.create(**demo_obj)
        paidtype_obj.thirdparty.add(thirdparty_obj)

        # Create new account
        user_data = {'username': 'cosmo.hu@lingtelli.com',
                     'password': 'thisispassword',
                     'first_name': 'cosmo'}
        user_obj = User.objects.create(**user_data)

        # Create account info
        acc_data = {'user': user_obj, 'paid_type': paidtype_obj,
                    'confirmation_code': 'confirmationcode', 
                    'code_reset_time': '2019-12-12 00:00:00', }
        AccountInfo.objects.create(**acc_data)

        # Initial user id uri
        user_id = user_obj.id
        self.uri = '/member/' + str(user_id) + '/'

        # Login User
        token_obj = Token.objects.create(user=user_obj)
        self.accesstoken = token_obj.key

        
    def test_read_profile(self):
        profile_key = ['username', 'first_name', 'paid_type', 'start_date',
                       'expire_date', 'language']
        c = Client()
        header = {'HTTP_AUTHORIZATION': 'bearer ' + self.accesstoken}
        response = c.get(self.uri, **header)
        res_data = json.loads(response.content)
        self.assertEqual(response.status_code, 200)
        for k in profile_key:
            self.assertIn(k, res_data)

    
    def test_not_login_read_profile(self):
        c = Client()
        response = c.get(self.uri)
        res_data = json.loads(response.content)
        self.assertEqual(response.status_code, 403)
        self.assertEqual(res_data.get('errors'), 'Please login')
    
    def test_update_empty(self):
        c = Client()
        header = {'HTTP_AUTHORIZATION': 'bearer ' + self.accesstoken}
        response = c.put(self.uri,
                         json.dumps({}),
                         content_type='application/json', **header)
        res_data = json.loads(response.content)
        # self.assertEqual(response.status_code, 400)
        self.assertEqual(res_data.get('errors'), 'Updating nothing')
    
    def test_update_username(self):
        c = Client()
        header = {'HTTP_AUTHORIZATION': 'bearer ' + self.accesstoken}
        response = c.put(self.uri,
                         json.dumps({'username': 'test@lingtelli.com'}),
                         content_type='application/json', **header)
        res_data = json.loads(response.content)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(res_data.get('success'),
                         'Confirmation email has been sent')

    def test_update_username_duplicated(self):
        c = Client()
        header = {'HTTP_AUTHORIZATION': 'bearer ' + self.accesstoken}
        response = c.put(self.uri,
                         json.dumps({'username': 'cosmo.hu@lingtelli.com'}),
                         content_type='application/json', **header)
        res_data = json.loads(response.content)
        self.assertEqual(response.status_code, 400)
        self.assertEqual(res_data.get('errors'),
                         'Username has been used, please try another one')
    
    def test_no_login_update_username(self):
        c = Client()
        response = c.put(self.uri, 
                         json.dumps({'username': 'test@lingtelli.com'}),
                         content_type='application/json')
        res_data = json.loads(response.content)
        self.assertEqual(response.status_code, 403)
        self.assertEqual(res_data.get('errors'), 'Please login')
    
    def test_update_password(self):
        c = Client()
        header = {'HTTP_AUTHORIZATION': 'bearer ' + self.accesstoken}
        response = c.put(self.uri, 
                         json.dumps({'password': 'thisispassword',
                                     'new_password': 'newpassword'}),
                         content_type='application/json', **header)
        res_data = json.loads(response.content)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(res_data.get('success'),
                        'Successfully reset password. Please login again')
    
    def test_no_login_update_password(self):
        c = Client()
        response = c.put(self.uri, 
                         json.dumps({'old_password': 'thisispassword',
                                     'new_password': 'newpassword'}),
                         content_type='application/json')
        res_data = json.loads(response.content)
        self.assertEqual(response.status_code, 403)
        self.assertEqual(res_data.get('errors'), 'Please login')
    
    def test_wrong_old_password(self):
        c = Client()
        header = {'HTTP_AUTHORIZATION': 'bearer ' + self.accesstoken}
        response = c.put(self.uri, json.dumps({'old_password': 'thisiswrong',
                                               'new_password': 'newpassword'}),
                         content_type='application/json', **header)
        res_data = json.loads(response.content)
        self.assertEqual(response.status_code, 403)
        self.assertEqual(res_data.get('errors'), 'Old password is not correct')

    def test_update_nickname(self):
        c = Client()
        header = {'HTTP_AUTHORIZATION': 'bearer ' + self.accesstoken}
        response = c.put(self.uri,
                         json.dumps({'first_name': 'test'}),
                         content_type='application/json', **header)
        res_data = json.loads(response.content)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(res_data.get('success'),
                         'Successfully updated nickname')
    
    def test_no_login_update_nickname(self):
        c = Client()
        response = c.put(self.uri, 
                         json.dumps({'first_name': 'test'}),
                         content_type='application/json')
        res_data = json.loads(response.content)
        self.assertEqual(response.status_code, 403)
        self.assertEqual(res_data.get('errors'), 'Please login')

    def test_delete_account(self):
        c = Client()
        header = {'HTTP_AUTHORIZATION': 'bearer ' + self.accesstoken}
        response = c.delete(self.uri, **header)
        self.assertEqual(response.status_code, 204)

    def test_no_login_delete_account(self):
        c = Client()
        response = c.delete(self.uri)
        res_data = json.loads(response.content)
        self.assertEqual(response.status_code, 403)
        self.assertEqual(res_data.get('errors'), 'Please login')

        



        


    


    