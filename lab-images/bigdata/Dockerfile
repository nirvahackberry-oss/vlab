ARG LAB_BASE_IMAGE=465443875617.dkr.ecr.ap-south-1.amazonaws.com/vlab-dev-lab-base-java:latest
FROM ${LAB_BASE_IMAGE}

USER root

ENV DEBIAN_FRONTEND=noninteractive \
    HADOOP_VERSION=3.3.6 \
    HADOOP_HOME=/opt/hadoop \
    HADOOP_CONF_DIR=/etc/hadoop/conf \
    MAVEN_VERSION=3.9.9 \
    MAVEN_HOME=/opt/maven \
    BIGDATA_LIBS=/opt/bigdata-libs

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    procps \
    && rm -rf /var/lib/apt/lists/*

RUN curl -fsSL "https://archive.apache.org/dist/hadoop/common/hadoop-${HADOOP_VERSION}/hadoop-${HADOOP_VERSION}.tar.gz" \
    | tar -xz -C /opt \
    && mv "/opt/hadoop-${HADOOP_VERSION}" "${HADOOP_HOME}" \
    && curl -fsSL "https://archive.apache.org/dist/maven/maven-3/${MAVEN_VERSION}/binaries/apache-maven-${MAVEN_VERSION}-bin.tar.gz" \
    | tar -xz -C /opt \
    && mv "/opt/apache-maven-${MAVEN_VERSION}" "${MAVEN_HOME}"

ENV PATH="${HADOOP_HOME}/bin:${HADOOP_HOME}/sbin:${MAVEN_HOME}/bin:${PATH}"

COPY lab-images/bigdata/hadoop-conf/ "${HADOOP_CONF_DIR}/"
COPY lab-images/bigdata/pom.xml /tmp/bigdata-pom.xml

RUN mkdir -p "${BIGDATA_LIBS}" /var/hadoop/hdfs/namenode /var/hadoop/hdfs/datanode /var/hadoop/tmp \
    && mvn -f /tmp/bigdata-pom.xml package -q \
    && rm -f /tmp/bigdata-pom.xml

COPY lab-images/bigdata/entrypoint.sh /usr/local/bin/bigdata-entrypoint.sh
RUN chmod +x /usr/local/bin/bigdata-entrypoint.sh

WORKDIR /app
COPY --chown=labuser:labuser lab-images/common/lab_server.py /app/lab_server.py

RUN chown -R labuser:labuser /workspace /var/hadoop "${BIGDATA_LIBS}"

USER labuser
WORKDIR /workspace

EXPOSE 8080
CMD ["/usr/local/bin/bigdata-entrypoint.sh"]
