#!/bin/bash
# For that to work skeema needed to be installed on system
# in login_server/skeema and community_server/db/skeema skeema configuration files need to be there also in the subfolders 
# Update DB Schemas (only the schemas, not the data)

cd ../../login_server/skeema
skeema push --allow-unsafe
cd ../../community_server/db/skeema
skeema push --allow-unsafe
