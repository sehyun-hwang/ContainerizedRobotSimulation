FROM python:slim

WORKDIR /root
RUN pip3 --no-cache install flask meshlabxml
RUN apt -y update && apt install -y xvfb fuse meshlab libgomp1

COPY . .
RUN chmod +x meshlabserver.AppImage
RUN sed -i "s/cmd = 'meshlabserver'/cmd = 'xvfb-run .\/meshlabserver.AppImage'/" /usr/local/lib/python3.9/site-packages/meshlabxml/mlx.py

CMD [ "python3", "Flask.py"]