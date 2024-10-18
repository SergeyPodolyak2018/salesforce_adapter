FROM gws-docker-registry.artifactory.gws.genesys.com/stable/base/gws-base-nginx:9.0.000.01.30

ARG _project_name
ARG _project_version

ENV GWS_NGINX_CONSUL_SERVICE='crm1' \
    GWS_NGINX_CONSUL_DEFAULT_TAGS='crm1'

EXPOSE 8080

COPY webapp /var/www/gws/ui/crm-workspace
