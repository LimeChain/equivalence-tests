// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SimpleContract {
    uint256 public simpleUint256;
    bytes32 public simpleBytes32;

    function simpleFunction() public returns (uint256) {
        simpleUint256++;
        return simpleUint256;
    }

    function simpleBytesFunction(bytes32 _input) public returns (uint256) {
        simpleBytes32 = _input;
        return simpleUint256;
    }

    function simplePayableFunction() public payable returns (uint256) {
        return 0;
    }
}   