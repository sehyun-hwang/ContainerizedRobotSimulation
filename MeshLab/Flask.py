#1

from flask import Flask, request
from MeshLab import main as MeshLab

app = Flask(__name__)


def Faces(request):
    faces = request.args.get('Faces', None, int)
    faces = [faces] if faces else []
    print('Faces', faces)
    return faces


@app.route('/meshlab', methods=['GET'])
def meshlab_teapot():
    with open('teapot.obj', 'rb') as obj:
        return MeshLab(obj.read(), *Faces(request))


@app.route('/meshlab', methods=['POST'])
def meshlab():
    if (request.content_type != 'application/object'):
        return TypeError('Content-Type not allowed')

    return MeshLab(request.data, *Faces(request))


app.run('0.0.0.0', 8000, debug=True)
