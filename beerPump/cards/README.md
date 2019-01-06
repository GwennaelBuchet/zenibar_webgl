su# Reader and Writer for RFID-RC522 cards.

For information about card, wires and code, please have a look at: 
http://www.instructables.com/id/RFID-RC522-Raspberry-Pi/


Each RFID card contains only 1 data: the userID.
UOther user data is stored in the main server. RFID cards are only used to identify the costumers.

## Additional Setup
sudo pip install ConfigParser

## zenibar.cfg
Encapsulate configuration for the reader : main server URL, reader's ID.

This file is used by ReadCards.py application.

## WriteCard.py
_Arguments_:
- ID of the customer

_Usage_ (example for the customer with ID 1234): 
```shell
python WriteCard.py 1234
``` 
will write the code "1234" on the card and exit.

 
## ReadCards.py
_Arguments_:
None

_Usage_: 
```shell
python ReadCards.py
``` 
will read the customer code from the RFID card and send it to the main server.
 
