from django.test import TestCase


class ThirdpartyTest(TestCase):
    '''Third party basic testing

    R
    '''

    def test_no_auth(self):
        '''Third party action no authorization

        GET
        '''
        pass
    
    def test_not_existed(self):
        '''Third party is not existed

        GET
        '''
        pass

    def test_read(self):
        pass
