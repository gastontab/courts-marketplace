FROM ubuntu:24.04

RUN apt-get update && \
    apt-get install -y curl ca-certificates

RUN curl -L https://raw.githubusercontent.com/jcarbonnell/rindexer/main/install.sh | bash

ENV PATH="/root/.rindexer/bin:${PATH}"

WORKDIR /app

COPY . .

CMD ["rindexer", "start", "all"]