from django.test import TestCase

class ReportTest(TestCase):
    '''Report basic testing

    Return the report data collected from history
    '''

    def test_read_complete_report(self):
        '''Report generated from history

        Currently include: data, total_chat, success_count and question_count
        '''
        pass
