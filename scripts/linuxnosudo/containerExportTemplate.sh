#!/bin/bash
#TMPID=$( docker run -d __NAMESPACE__/__TARGETNAME__-__BUILDNUMBER__ /bin/bash)
# docker export $TMPID > __BUILDPATH__/__TARGETNAME__-__BUILDNUMBER__
docker save __NAMESPACE__/__TARGETNAME__-__BUILDNUMBER__ > __BUILDPATH__/__TARGETNAME__-__BUILDNUMBER__

