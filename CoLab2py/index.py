from os import environ, listdir
from pathlib import Path
from urllib.request import urlopen
import json, traceback

import nbformat
from nbconvert.exporters import PythonExporter

exporter = PythonExporter()


def convert(id):
    global exporter
    print(id)

    res = urlopen('https://drive.google.com/uc?id=' + id)
    nb = nbformat.reads(res.read(), 4)
    data, metadata = exporter.from_notebook_node(nb)
    print(metadata)
    return data


def handler(event, context=None):
    print(event, context)

    def Headers(key):
        try:
            headers["Access-Control-Allow-Origin"] = event["headers"][key]
        except:
            pass

    Headers("referer")
    Headers("origin")

    if 'id' not in event["pathParameters"]:
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json"
            },
            "isBase64Encoded": False,
            "body": json.dumps({"error": "id is not provided in path"})
        }

    try:
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "text/x-python"
            },
            "isBase64Encoded": False,
            "body": convert(event["pathParameters"]["id"])
        }

    except Exception as error:
        print(error)

        return {
            "statusCode":
            200,
            "headers": {
                "Content-Type": "application/json"
            },
            "isBase64Encoded":
            False,
            "body":
            json.dumps({
                "error": repr(error),
                "stack": traceback.format_exc()
            }),
        }


if __name__ == '__main__':
    print(convert('1RVThWof7D9uVW2jt9K8pQgSMxMXhN-zv'))
