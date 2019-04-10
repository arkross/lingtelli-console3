import django_filters

from django.contrib.auth.models import User


class AgentMemberListFilter(django_filters.FilterSet):
    username = django_filters.CharFilter(lookup_expr='icontains')

    class Meta:
        model = User
        fields = ['username']
