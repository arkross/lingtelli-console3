FROM python:3.6

ADD . /server/
WORKDIR /server/
# Test with ci file
RUN pip install -r requirements.txt
RUN apt-get update
RUN apt-get install -y gettext
RUN django-admin makemessages
RUN django-admin compilemessages
