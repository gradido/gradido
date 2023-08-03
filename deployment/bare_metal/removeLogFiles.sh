find /home/gradido/gradido/deployment/bare_metal/log -name "pm2.*" -ctime +30 -exec rm -r {} \; > /dev/null
find /home/gradido/gradido/deployment/bare_metal/log -name "nginx-*" -ctime +30 -exec rm -r {} \; > /dev/null

find /home/gradido/gradido/logs/backend -name "access_*" -ctime +30 -exec rm -r {} \; > /dev/null
find /home/gradido/gradido/logs/backend -name "apollo_*" -ctime +30 -exec rm -r {} \; > /dev/null
find /home/gradido/gradido/logs/backend -name "backend_*" -ctime +30 -exec rm -r {} \; > /dev/null
find /home/gradido/gradido/logs/backend -name "errors_*" -ctime +30 -exec rm -r {} \; > /dev/null
find /home/gradido/gradido/logs/backend -name "klicktipp_*" -ctime +30 -exec rm -r {} \; > /dev/null

find /home/gradido/gradido/logs/dht-node -name "dht-*" -ctime +30 -exec rm -r {} \; > /dev/null
find /home/gradido/gradido/logs/dht-node -name "errors_*" -ctime +30 -exec rm -r {} \; > /dev/null

find /home/gradido/gradido/logs/federation -name "access-*_????-??-??.*" -ctime +30 -exec rm -r {} \; > /dev/null
find /home/gradido/gradido/logs/federation -name "apiversion-*_????-??-??.*" -ctime +30 -exec rm -r {} \; > /dev/null
find /home/gradido/gradido/logs/federation -name "apollo-*_????-??-??.*" -ctime +30 -exec rm -r {} \; > /dev/null
find /home/gradido/gradido/logs/federation -name "errors-*_????-??-??.*" -ctime +30 -exec rm -r {} \; > /dev/null
