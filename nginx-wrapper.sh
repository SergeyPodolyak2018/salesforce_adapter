#!/usr/bin/bash
############# Default Configuration #############
. /etc/nginx/default_config
#################################################

CONFIG_FILE="/etc/nginx/conf.d/https.conf"
VAR_PREFIX="GWS_NGINX_"

ENV_VARS=($(set | awk -F= "/^${VAR_PREFIX}/ {print \$1}"))

echo "${ENV_VARS[@]}"

for _env in ${ENV_VARS[@]}
do
    sed -i'' -e "s/\${${_env}}/${!_env}/g" "${CONFIG_FILE}"
done

cat "${CONFIG_FILE}"

bash /usr/sbin/nginx-wrapper