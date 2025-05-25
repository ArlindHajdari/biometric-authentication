FROM postgres:15

RUN apt-get update && \
    apt-get install -y postgresql-server-dev-15 git make gcc && \
    git clone --branch v1.5.2 https://github.com/citusdata/pg_cron.git && \
    cd pg_cron && \
    make && make install && \
    cd .. && rm -rf pg_cron && \
    apt-get remove --purge -y git make gcc && \
    apt-get autoremove -y && apt-get clean

EXPOSE 5432
