#!/bin/bash
sudo docker ps -a --no-trunc | grep 'Exit' | awk '{print $1}' | xargs -r sudo docker rm
sudo docker images --no-trunc| grep none | awk '{print $2}' | xargs -r sudo docker rmi
sudo docker build -t __NAMESPACE__/__TARGETNAME__-__BUILDNUMBER__ .

