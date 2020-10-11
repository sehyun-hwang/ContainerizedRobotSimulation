docker run -it --rm --name robot \
--net network \
-w /root -v /Volumes/dev/finger_inverse_kinematic:/root -v /Volumes/dev/Docker.sh:/root/Docker.sh \
 -e ACTIONS=2 -e STATES=10 \
 tensorflow/tensorflow bash Docker.sh robot