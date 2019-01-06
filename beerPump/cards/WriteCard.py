#!/usr/bin/env python
# -*- coding: utf8 -*-

# @author: Gwennael Buchet <gwennael.buchet@gmail.com>
#
# This code is based on great MFRC-python library:
# https://github.com/mxgxw/MFRC522-python
# ...pyth


import RPi.GPIO as GPIO
import signal
import sys

import MFRC522

if len(sys.argv) != 2:
    print("  <<< ERROR >>> 1 parameter needed : user ID.")
    print("      Example: ")
    print("        python WriteCard.py 1234")
    print("\n")
    print("WriteCard just create a new card for a user. \n")
    print("Cards don't contains any other data than the user ID\n")
    sys.exit(1)

userID = int(sys.argv[1])

continue_reading = True


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

print("Please, place your card in front of the reader ...")

# This loop keeps checking for chips. If one is near it will get the UID and authenticate
while continue_reading:

    # Scan for cards
    (status, TagType) = MIFAREReader.MFRC522_Request(MIFAREReader.PICC_REQIDL)

    # Get the UID of the card
    (status, uid) = MIFAREReader.MFRC522_Anticoll()

    # If we have the UID, continue
    if status == MIFAREReader.MI_OK:

        # Print UID
        print "Card detected (UID: " + str(uid[0]) + "," + str(uid[1]) + "," + str(uid[2]) + "," + str(uid[3]) + ")"

        # This is the default key for authentication
        key = [0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF]

        # Select the scanned tag
        MIFAREReader.MFRC522_SelectTag(uid)

        # Authenticate
        status = MIFAREReader.MFRC522_Auth(MIFAREReader.PICC_AUTHENT1A, 8, key, uid)

        # Check if authenticated
        if status == MIFAREReader.MI_OK:

            # Variable for the data to write
            data = []

            # Fill the data with 0xFF
            # [userID, userID, userID, userID, ...]
            # it's needed to use a better IAM but perfectky well for the demo
            for x in range(0, 16):
                data.append(userID)

            # Write the data
            MIFAREReader.MFRC522_Write(8, data)

            # Stop
            MIFAREReader.MFRC522_StopCrypto1()

            print("Card has correctly been written.")

            # Make sure to stop reading for cards
            continue_reading = False
        else:
            print "Authentication error"
