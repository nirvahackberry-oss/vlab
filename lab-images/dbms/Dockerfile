FROM postgres:15

ENV POSTGRES_USER=student
ENV POSTGRES_PASSWORD=student
ENV POSTGRES_DB=labdb

EXPOSE 5432
CMD ["sh", "-c", "docker-entrypoint.sh postgres & tail -f /dev/null"]
