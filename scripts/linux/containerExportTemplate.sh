#!/bin/bash
#TMPID=$(sudo docker run -d __NAMESPACE__/__TARGETNAME__-__BUILDNUMBER__ /bin/bash)
#sudo docker export $TMPID > __BUILDPATH__/__TARGETNAME__-__BUILDNUMBER__
sudo docker save __NAMESPACE__/__TARGETNAME__-__BUILDNUMBER__ > __BUILDPATH__/__TARGETNAME__-__BUILDNUMBER__

