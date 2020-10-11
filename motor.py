from http.client import HTTPConnection
import json
from time import sleep

from ev3dev.ev3 import MediumMotor, LargeMotor
from ev3dev2.sensor.lego import TouchSensor
from atexit import register as atexit
from sys import argv

speed = argv[1] if len(argv) > 1 else 250

Motors = [LargeMotor('outA'), MediumMotor('outB'), LargeMotor('outC')]


def AtExit():
    for Motor in Motors:
        Motor.stop()


atexit(AtExit)


def main():
    while True:

        conn = HTTPConnection('hwangsehyun.local')
        print(1)
        #conn = HTTPSConnection('kbdlab.hwangsehyun.com')
        try:
            conn.request("GET", "/ev3")
            print(2)
        except ConnectionRefusedError as error:
            print(error)
            sleep(1)
            continue

        print('Connected')
        r1 = conn.getresponse()
        while True:
            chunk = r1.readline()
            if (chunk == b'\n'): continue
            if (not chunk): break

            chunk = chunk[:-1].decode()
            angles = json.loads(chunk)
            print(angles)
            if not all(angles): continue

            for Motor, angle in zip(Motors,
                                    [-angles[2], angles[3], angles[5]]):
                Motor.run_to_abs_pos(position_sp=angle,
                                     speed_sp=speed,
                                     stop_action="brake")


main()
