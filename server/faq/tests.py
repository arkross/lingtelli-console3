from django.test import TestCase

class FAQGroupTest(TestCase):
    '''FAQGroup basic testing

    CRUD
    '''
    
    def test_no_auth(self):
        '''FAQ group no authorization

        POST, GET, PUT, DELETE
        '''
        pass
    
    def test_not_existed(self):
        '''FAQ group not existed

        GET, PUT, DELETE
        '''
        pass

    def test_create(self):
        pass
    
    def test_read(self):
        pass

    def test_update(self):
        pass

    def test_delete(self):
        pass


class FAQStatusTest(TestCase):
    '''FAQ status basic testing

    R
    '''

    def test_no_auth(self):
        '''FAQ status no authorization

        GET
        '''
        pass
    
    def test_read(self):
        pass


class CSVTest(TestCase):
    '''CSV FAQ file testing

    Including upload, export and train
    '''

    def test_no_auth(self):
        '''CSV action no authorization

        POST(upload), GET(export, train)
        '''
        pass
    
    def test_not_existed(self):
        ''' CSV action with bot not existed

        POST(upload), GET(export, train)
        '''
        pass

    def test_upload(self):
        pass

    def test_export(self):
        pass

    def test_train(self):
        pass


class AnswerTest(TestCase):
    '''Answer basic testing

    CRUD
    '''

    def test_no_auth(self):
        ''' Answer action no auth

        POST, GET, PUT, DELETE
        '''
        pass

    def test_not_existed(self):
        '''Answer is not existed

        POST(FAQ group is not existed), GET, PUT, DELETE
        '''
        pass

    def test_create(self):
        pass

    def test_read(self):
        pass

    def test_update(self):
        pass

    def test_delete(self):
        pass


class QuestionTest(TestCase):
    '''Question basic testing

    CRUD
    '''

    def test_no_auth(self):
        '''Question action no auth

        POST, GET, PUT, DELETE
        '''
        pass

    def test_not_existed(self):
        '''Question is not existed

        POST(FAQ group is not existed), GET, PUT, DELETE
        '''
        pass

    def test_create(self):
        pass

    def test_read(self):
        pass

    def test_update(self):
        pass

    def test_delete(self):
        pass

