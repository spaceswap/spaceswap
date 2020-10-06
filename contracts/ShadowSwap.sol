// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.6.0;

/*
    Copyright 2016, Adrià Massanet

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
    
    Checked results with FIPS test vectors
    https://csrc.nist.gov/CSRC/media/Projects/Cryptographic-Algorithm-Validation-Program/documents/dss/186-2rsatestvectors.zip
    file SigVer15_186-3.rsp
    
 */

contract SolRsaVerify {

    function memcpy(uint _dest, uint _src, uint _len) pure internal {
        // Copy word-length chunks while possible
        for ( ;_len >= 32; _len -= 32) {
            assembly {
                mstore(_dest, mload(_src))
            }
            _dest += 32;
            _src += 32;
        }

        // Copy remaining bytes
        uint mask = 256 ** (32 - _len) - 1;
        assembly {
            let srcpart := and(mload(_src), not(mask))
            let destpart := and(mload(_dest), mask)
            mstore(_dest, or(destpart, srcpart))
        }
    }


    function join(
        bytes memory _s, bytes memory _e, bytes memory _m
    ) pure internal returns (bytes memory) {
        uint inputLen = 0x60+_s.length+_e.length+_m.length;

        uint slen = _s.length;
        uint elen = _e.length;
        uint mlen = _m.length;
        uint sptr;
        uint eptr;
        uint mptr;
        uint inputPtr;

        bytes memory input = new bytes(inputLen);
        assembly {
            sptr := add(_s,0x20)
            eptr := add(_e,0x20)
            mptr := add(_m,0x20)
            mstore(add(input,0x20),slen)
            mstore(add(input,0x40),elen)
            mstore(add(input,0x60),mlen)
            inputPtr := add(input,0x20)
        }
        memcpy(inputPtr+0x60,sptr,_s.length);
        memcpy(inputPtr+0x60+_s.length,eptr,_e.length);
        memcpy(inputPtr+0x60+_s.length+_e.length,mptr,_m.length);

        return input;
    }

    /** @dev Verifies a PKCSv1.5 SHA256 signature
      * @param _sha256 is the sha256 of the data
      * @param _s is the signature
      * @param _e is the exponent
      * @param _m is the modulus
      * @return 0 if success, >0 otherwise
    */
    function pkcs1Sha256Verify(
        bytes32 _sha256,
        bytes memory _s, bytes memory _e, bytes memory _m
    ) public view returns (uint) {

        uint8[19] memory sha256Prefix = [
        0x30, 0x31, 0x30, 0x0d, 0x06, 0x09, 0x60, 0x86, 0x48, 0x01, 0x65, 0x03, 0x04, 0x02, 0x01, 0x05, 0x00, 0x04, 0x20
        ];

        require(_m.length >= sha256Prefix.length+_sha256.length+11);

        uint i;

        /// decipher
        bytes memory input = join(_s,_e,_m);
        uint inputlen = input.length;

        uint decipherlen = _m.length;
        bytes memory decipher = new bytes(decipherlen);
        assembly {
            pop(staticcall(sub(gas(), 2000), 5, add(input,0x20), inputlen, add(decipher,0x20), decipherlen))
        }

        /// 0x00 || 0x01 || PS || 0x00 || DigestInfo
        /// PS is padding filled with 0xff
        //  DigestInfo ::= SEQUENCE {
        //     digestAlgorithm AlgorithmIdentifier,
        //     digest OCTET STRING
        //  }

        uint paddingLen = decipherlen - 3 - sha256Prefix.length - 32;

        if (decipher[0] != 0 || uint8(decipher[1]) != 1) {
            return 1;
        }
        for (i = 2;i<2+paddingLen;i++) {
            if (decipher[i] != 0xff) {
                return 2;
            }
        }
        if (decipher[2+paddingLen] != 0) {
            return 3;
        }
        for (i = 0;i<sha256Prefix.length;i++) {
            if (uint8(decipher[3+paddingLen+i])!=sha256Prefix[i]) {
                return 4;
            }
        }
        for (i = 0;i<_sha256.length;i++) {
            if (decipher[3+paddingLen+sha256Prefix.length+i]!=_sha256[i]) {
                return 5;
            }
        }

        return 0;
    }

    /** @dev Verifies a PKCSv1.5 SHA256 signature
      * @param _data to verify
      * @param _s is the signature
      * @param _e is the exponent
      * @param _m is the modulus
      * @return 0 if success, >0 otherwise
    */
    function pkcs1Sha256VerifyRaw(
        bytes memory _data,
        bytes memory _s, bytes memory _e, bytes memory _m
    ) public view returns (uint) {
        return pkcs1Sha256Verify(sha256(_data),_s,_e,_m);
    }

}


abstract contract Context {
    function _msgSender() internal view virtual returns (address payable) {
        return msg.sender;
    }

    function _msgData() internal view virtual returns (bytes memory) {
        this; // silence state mutability warning without generating bytecode - see https://github.com/ethereum/solidity/issues/2691
        return msg.data;
    }
}

contract Ownable is Context {
    address private _owner;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    /**
     * @dev Initializes the contract setting the deployer as the initial owner.
     */
    constructor () internal {
        address msgSender = _msgSender();
        _owner = msgSender;
        emit OwnershipTransferred(address(0), msgSender);
    }

    /**
     * @dev Returns the address of the current owner.
     */
    function owner() public view returns (address) {
        return _owner;
    }

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        require(_owner == _msgSender(), "Ownable: caller is not the owner");
        _;
    }

    /**
     * @dev Leaves the contract without owner. It will not be possible to call
     * `onlyOwner` functions anymore. Can only be called by the current owner.
     *
     * NOTE: Renouncing ownership will leave the contract without an owner,
     * thereby removing any functionality that is only available to the owner.
     */
    function renounceOwnership() public virtual onlyOwner {
        emit OwnershipTransferred(_owner, address(0));
        _owner = address(0);
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Can only be called by the current owner.
     */
    function transferOwnership(address newOwner) public virtual onlyOwner {
        require(newOwner != address(0), "Ownable: new owner is the zero address");
        emit OwnershipTransferred(_owner, newOwner);
        _owner = newOwner;
    }
}

contract ShadowHarvester is Ownable, SolRsaVerify {
    //using SolRsaVerify for bytes32;


    bool[] private enableKeys;

    bytes[] private availableKeys;


    constructor() public {

    }

    function harvest(uint256 i,
        uint256 amount,
        uint256 lastBlockNumber,
        uint256 currentBlockNumber,
        bytes memory signi) public  {
        bytes32 _data = keccak256(abi.encode(amount, lastBlockNumber, currentBlockNumber));
        bytes memory _e;
        require(pkcs1Sha256Verify(_data, signi, _e, availableKeys[i]) == 0, "Incorrect data");
        // 
        address _sender; // = 

    }


    function getVerifyKey(uint256 _id) public view returns (bytes32 e, uint256 n, bool status) {

    }

    function  addNewKey(bytes memory e /*, uint256 n */) public onlyOwner returns(uint256 _id) {
        availableKeys.push(e);
        return availableKeys.length - 1;
    }

    function  enableKey(uint256 _id) public onlyOwner {
        require(!enableKeys[_id], "This key already enable");
        enableKeys[_id] = true;
    }

    function  disableKey(uint256 _id) public onlyOwner {
        require(enableKeys[_id], "This key already disable");
        enableKeys[_id] = false;
    }

}