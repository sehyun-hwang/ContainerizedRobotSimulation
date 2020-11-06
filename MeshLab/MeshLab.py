from os import environ
from tempfile import NamedTemporaryFile as Temp

import meshlabxml as mlx

environ['PATH'] = '/Applications/meshlab.app/Contents/MacOS:' + environ['PATH']


def main(obj, faces=300):
    with Temp(suffix='.obj') as In, Temp(suffix='.obj') as Out:
        In.write(obj)
        In.seek(0)

        script = mlx.FilterScript(file_in=In.name, file_out=Out.name)
        mlx.remesh.simplify(script, texture=False, faces=faces)
        script.run_script()

        Out.seek(0)
        return Out.read()

if __name__ == '__main__':
    with open('teapot.obj', 'rb') as obj:
        print('Start')
        print(main(obj.read()))
        print('Success')
