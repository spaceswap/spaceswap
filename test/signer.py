# -*- coding: utf-8 -*-
import sys

from web3.auto import w3
from eth_account.messages import encode_defunct
"""
eth web3 signer
"""

#for address 0xE71978b1696a972b1a8f724A4eBDB906d9dA0885
priv_key=0x2cdbeadae3122f6b30a67733fd4f0fb6c27ccd85c3c68de97c8ff534c87603c8

if  len(sys.argv)==2:
        hash_origin = sys.argv[1] #file with receivers list
else:
    print (
        'wrong params number - {}'
        ' , usage: python3 {} origin_hash'.format(
            len(sys.argv), sys.argv[0]
        )
    )
    sys.exit('use file as script param')

message = encode_defunct(hexstr=hash_origin)
signed_message = w3.eth.account.sign_message(message, private_key=priv_key)
print(signed_message)
