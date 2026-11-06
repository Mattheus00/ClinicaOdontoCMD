#!/bin/sh
set -eu

# The Vercel router requires a listener on PORT before Spring finishes its
# database/Flyway startup. The startup proxy owns PORT and retries requests
# until Spring is listening on 8080.
exec node /app/startup-proxy.js
