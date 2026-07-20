#!/bin/sh
set -eu

url_decode() {
  encoded=$(printf '%s' "$1" | sed 's/+/ /g; s/%/\\x/g')
  printf '%b' "$encoded"
}

if [ -n "${DATABASE_URL:-}" ] && [ -z "${SPRING_DATASOURCE_URL:-}" ]; then
  database_uri=${DATABASE_URL#*://}
  credentials=${database_uri%%@*}
  host_and_database=${database_uri#*@}
  host_port=${host_and_database%%/*}
  database_and_query=${host_and_database#*/}

  database_user=${credentials%%:*}
  database_password=${credentials#*:}
  database_name=${database_and_query%%\?*}

  export SPRING_DATASOURCE_URL="jdbc:postgresql://${host_port}/$(url_decode "$database_name")"
  export SPRING_DATASOURCE_USERNAME="$(url_decode "$database_user")"
  export SPRING_DATASOURCE_PASSWORD="$(url_decode "$database_password")"
fi

if [ -n "${USER_SERVICE_HOST:-}" ]; then
  export USER_SERVICE_URL="https://${USER_SERVICE_HOST}"
fi
if [ -n "${LISTING_SERVICE_HOST:-}" ]; then
  export LISTING_SERVICE_URL="https://${LISTING_SERVICE_HOST}"
fi
if [ -n "${CHAT_SERVICE_HOST:-}" ]; then
  export CHAT_SERVICE_URL="https://${CHAT_SERVICE_HOST}"
fi
if [ -n "${PAYMENT_SERVICE_HOST:-}" ]; then
  export PAYMENT_SERVICE_URL="https://${PAYMENT_SERVICE_HOST}"
fi
if [ -n "${GATEWAY_HOST:-}" ] && [ -z "${PAYSTACK_CALLBACK_URL:-}" ]; then
  export PAYSTACK_CALLBACK_URL="https://${GATEWAY_HOST}/api/payments/paystack/callback"
fi

exec java -jar app.jar
