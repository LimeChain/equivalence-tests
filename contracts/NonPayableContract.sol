// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Silently doesn't accept payments as there are no fallback and receive functions declared
contract NonPayableContract {
}

// Revert on payment received in the fallback and receive functions
contract RejectingPaymentsContract {
    
    event OnRevert(string message);

    fallback() external payable {
        if (msg.value > 0) {
            revert("Invalid fee submitted in the fallback() function!");
        }
    }

    receive() external payable {
        if (msg.value > 0) {
            revert("Invalid fee submitted in the receive() function!");
        }
    } 
}