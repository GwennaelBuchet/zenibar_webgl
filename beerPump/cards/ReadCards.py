#!/usr/bin/env python
# -*- coding: utf8 -*-

# Author: Gwennael Buchet <gwennael.buchet@gmail.com>
#
# This code is based on great MFRC-python library:
# https://github.com/mxgxw/MFRC522-python
# ***

import ConfigParser
import RPi.GPIO as GPIO
import signal
import time
import httplib, urllib

import MFRC522

# SERVER_URL = "127.0.0.1:8092"
# SERVER_URL = "192.168.43.96:8090"
SERVER_URL = "192.168.43.145:8090"
PIN_BUTTON = 12


# Send
def sendUserIdToServer(userID):
    print("Sending userID to server " + SERVER_URL + " => " + userID)

    params = urllib.urlencode({'id': userID})
    headers = {"Content-type": "application/x-www-form-urlencoded", "Accept": "text/plain"}
    conn = httplib.HTTPConnection(SERVER_URL)
    conn.request("POST", "/connect", params, headers)
    conn.close()

def sendOpeningToServer():
    print("Sending opening to server " + SERVER_URL)

    params = urllib.urlencode({})
    headers = {"Content-type": "application/x-www-form-urlencoded", "Accept": "text/plain"}
    conn = httplib.HTTPConnection(SERVER_URL)
    conn.request("POST", "/drink", params, headers)
    conn.close()

# Capture SIGINT for cleanup when the script is aborted
def end_read(signal, frame):
    global continue_reading
    print "Ctrl+C captured, ending read."
    continue_reading = False
    GPIO.cleanup()


# Hook the SIGINT
signal.signal(signal.SIGINT, end_read)

# Create an object of the class MFRC522
MIFAREReader = MFRC522.MFRC522()

# GPIO.setmode(GPIO.BCM)
GPIO.setup(PIN_BUTTON, GPIO.IN, pull_up_down=GPIO.PUD_UP)

# Welcome message
print "Ready to read cards and bottle opener..."

counter = 0
def readButton():
    global counter
    input_value = GPIO.input(PIN_BUTTON)
    if input_value == False:
        counter += 1
        print('The button has been pressed ' + str(counter) + ' time')
        sendOpeningToServer()
        while input_value == False:
            input_value = GPIO.input(PIN_BUTTON)
        time.sleep(1)


def readTag():
    userID = ""

    # Scan for cards
    (status, TagType) = MIFAREReader.MFRC522_Request(MIFAREReader.PICC_REQIDL)

    # Get the UID of the card
    (status, uid) = MIFAREReader.MFRC522_Anticoll()

    # If we have the UID, continue
    if status == MIFAREReader.MI_OK:

        # UID: str(uid[0]), str(uid[1]), str(uid[2]), str(uid[3])

        # This is the default key for authentication
        key = [0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF]

        # Select the scanned tag
        MIFAREReader.MFRC522_SelectTag(uid)

        # Authenticate
        status = MIFAREReader.MFRC522_Auth(MIFAREReader.PICC_AUTHENT1A, 8, key, uid)

        # Check if authenticated
        if status == MIFAREReader.MI_OK:
            # The values are stored in an array of 16 values, but we get them as a string representing an array
            userIDList = MIFAREReader.MFRC522_Read(8)
            # As all 16 values are the same (i.e. the userID), just pick one
            userID = userIDList.split(", ")[1]
            MIFAREReader.MFRC522_StopCrypto1()
            sendUserIdToServer(userID)
            # Wait few seconds so ensure not spamming the server
            time.sleep(4)

        else:
            print "Authentication error"


while True:

    readButton()

    readTag()
