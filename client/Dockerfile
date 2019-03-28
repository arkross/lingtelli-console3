FROM node:10

ADD . /client
WORKDIR /client

RUN yarn install
RUN yarn build
#RUN yarn build:jarvis
RUN yarn global add serve

#CMD ["serve", "-s", "build", "-p", "3000"]
