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
    volumes:
      - ./data:/fwportal-ics/data:rw
```

After that you can run the container with `docker-compose up -d` command.
