FROM node:18

USER root

ENV FWPORTAL_USER=''
ENV FWPORTAL_PWASSWORD=''
ENV TZ=Europe/Berlin

RUN apt-get update -yqq

RUN mkdir -p /fwportal-ics/
WORKDIR /fwportal-ics

COPY package*.json ./
RUN npm install

COPY . .

RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

RUN mkdir -p /fwportal-ics/data/
RUN chmod +rwx /fwportal-ics/data/

RUN apt-get install -yqq --no-install-recommends \
    ca-certificates \
    bzip2 \
    curl \
    libfontconfig

HEALTHCHECK --interval=1m --timeout=20s CMD [ "npm", "run", "healthcheck" ]

CMD [ "npm", "start" ]
