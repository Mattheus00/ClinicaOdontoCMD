#!/bin/sh
set -eu

# The Vercel router requires a listener on PORT before Spring finishes its
# database/Flyway startup. Nginx owns PORT and proxies to Spring on 8080.
sed -i "s/listen __PORT__;/listen ${PORT:-8080};/" /etc/nginx/conf.d/default.conf
/opt/java/openjdk/bin/java -Dserver.port=8080 -jar /app/app.jar &
exec nginx -g 'daemon off;'
