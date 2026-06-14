FROM ubuntu:24.04

RUN apt-get update && \
    apt-get install -y curl ca-certificates

RUN curl -L https://rindexer.xyz/install.sh | bash

ENV PATH="/root/.rindexer/bin:${PATH}"

WORKDIR /app

COPY . .

CMD ["/root/.rindexer/bin/rindexer", "start", "all"]