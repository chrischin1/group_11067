FROM golang:1.18-bullseye

RUN useradd -m runner

RUN mkdir /code && chown runner:runner /code

COPY run_code.sh /usr/local/bin/run_code.sh
RUN chmod +x /usr/local/bin/run_code.sh

WORKDIR /code

USER runner

ENTRYPOINT ["run_code.sh"]
