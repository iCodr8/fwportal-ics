FWportal ics generator
======================

Parse ics file from FWportal appointments.

Usage
-----

Create a docker-compose.yml file and replace the parameters inside.
At the volumes section you can define where your files should be stored.

```
version: '3'

services:
  fwportal_ics:
    image: icodr8/fwportal_ics:latest
    environment:
      - FWPORTAL_USER=''
      - FWPORTAL_PASSWORD=''
      - FWPORTAL_DEVICE_ID='random uuid'
      - FWPORTAL_DIENSTSTELLEN='dienststelle1ID|name_klein_und_ohne_sonderzeichen_1,dienststelle2ID.dienststelle3ID|name_klein_und_ohne_sonderzeichen_2'
      - FWPORTAL_FWMOBILE_VERSION='4.2.1'
      - DEBUG=false
    ports:
      - "8888:80"
    volumes:
      - ./data:/fwportal-ics/data:rw
```

After that you can run the container with `docker-compose up -d` command.

And get the ics files with http://localhost:8888
