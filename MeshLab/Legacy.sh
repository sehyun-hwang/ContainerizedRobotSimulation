netstat -vanp tcp | awk '$4 ~ /.8000/ { print $9 }' | xargs kill
cd /Volumes/dev/MeshLab
curl $URL/robot/obj/{MeshLab.py,Flask.py} -o MeshLab.py -o Flask.py
/usr/local/bin/python3 Flask.py

ssh -V || apk add sshpass openssh-client || exit 1
cd
if [ ! -d .ssh ]; then
    mkdir .ssh
    cd .ssh || exit 1
    echo "host.docker.internal,192.168.65.2 ecdsa-sha2-nistp256 AAAAE2VjZHNhLXNoYTItbmlzdHAyNTYAAAAIbmlzdHAyNTYAAABBBFXFnwDJzkL6Ni5thvE1tcJlbs6Nkfl2N+EDn12kn0ZjDd3dEieVj1JXD4n3NyNanlvOfoVfq47zjMYL9mn1wQ0=" > known_hosts
fi

echo $2
cat /Docker.sh | sshpass -e ssh hwangsehyun@host.docker.internal bash -s - $2
exit

docker run --name meshlab -d \
--restart unless-stopped --net host \
-v /Volumes/dev/Docker.sh:/Docker.sh \
-e FINGERPRINT="$(cat ~/.ssh/id_rsa.pub)" \
-e SSHPASS=$PASSWORD \
alpine sh Docker.sh ssh meshlab