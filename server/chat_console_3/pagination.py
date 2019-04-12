from rest_framework.pagination import PageNumberPagination


class StandardPagination(PageNumberPagination):
    page_size = 10


class AgentMemberPagination(PageNumberPagination):
    page_size = 30


class HistoryPagination(PageNumberPagination):
    page_size = 50
