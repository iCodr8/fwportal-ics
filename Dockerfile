FROM nginx:bookworm

USER root

ENV FWPORTAL_USER=''
ENV FWPORTAL_PASSWORD=''
ENV FWPORTAL_DEVICE_ID=''
ENV FWPORTAL_DIENSTSTELLEN=''
ENV FWPORTAL_FWMOBILE_VERSION=''
ENV DEBUG=false
ENV TZ=Europe/Berlin

RUN apt-get update -yqq
RUN apt-get install nodejs npm cron -yqq

RUN mkdir -p /fwportal-ics/
WORKDIR /fwportal-ics

COPY package*.json ./
RUN npm install

COPY src src
COPY .eslint* ./
COPY tsconfig.json ./
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

RUN mkdir -p /fwportal-ics/data/
RUN chmod +rwx /fwportal-ics/data/

HEALTHCHECK --interval=1m --timeout=20s CMD [ "npm", "run", "healthcheck" ]

# Run cron every hour
COPY docker/entrypoint-wrapper.sh /entrypoint-wrapper.sh
RUN echo '*/15 * * * * root . /root/env.sh; cd /fwportal-ics && npm start > /proc/1/fd/1 2>&1' > /etc/cron.d/fwportal-ics && \
    chmod 0644 /etc/cron.d/fwportal-ics && \
    crontab /etc/cron.d/fwportal-ics && \
    chmod +x /entrypoint-wrapper.sh

ENTRYPOINT ["/entrypoint-wrapper.sh"]

CMD ["nginx", "-g", "daemon off;"]
