#!/usr/bin/env bash
set -euo pipefail

export HDFS_NAMENODE_USER="${HDFS_NAMENODE_USER:-labuser}"
export HDFS_DATANODE_USER="${HDFS_DATANODE_USER:-labuser}"
export HDFS_SECONDARYNAMENODE_USER="${HDFS_SECONDARYNAMENODE_USER:-labuser}"

mkdir -p /var/hadoop/hdfs/namenode /var/hadoop/hdfs/datanode /var/hadoop/tmp

if [ ! -f /var/hadoop/hdfs/namenode/current/VERSION ]; then
  hdfs namenode -format -force -nonInteractive
fi

"${HADOOP_HOME}/sbin/start-dfs.sh"

exec python3 /app/lab_server.py
