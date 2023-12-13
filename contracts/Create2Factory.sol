// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

contract Create2Factory {
    event Deployed(address addr, uint salt);

    uint public salt  = 42342342342394239;

    // Compute the address of the contract to be deployed
    function getDefaultAddress()
    public
    view
    returns (address)
    {
        bytes memory bytecode = type(TestContract).creationCode;
        
        bytes32 hash = keccak256(
            abi.encodePacked(bytes1(0xff), address(this), salt, keccak256(bytecode))
        );

        // NOTE: cast last 20 bytes of hash to address
        return address(uint160(uint(hash)));
    }

    // Deploy the contract
    // NOTE:
    // Check the event log Deployed which contains the address of the deployed TestContract.
    // The address in the log should equal the address computed from above.
    function deploy() public payable {
        address addr;
        bytes memory bytecode = type(TestContract).creationCode;
        uint _salt = salt;

        /*
        NOTE: How to call create2

        create2(v, p, n, s)
        create new contract with code at memory p to p + n
        and send v wei
        and return the new address
        where new address = first 20 bytes of keccak256(0xff + address(this) + s + keccak256(mem[p…(p+n)))
              s = big-endian 256-bit value
        */
        assembly {
            addr := create2(
                callvalue(), // wei sent with current call
                // Actual code starts after skipping the first 32 bytes
                add(bytecode, 0x20),
                mload(bytecode), // Load the size of code contained in the first 32 bytes
                _salt // Salt from function arguments
            )

            if iszero(extcodesize(addr)) {
                revert(0, 0)
            }
        }

        emit Deployed(addr, salt);
    }

        function isContract(address account) public view returns (bool) {
        // This method relies on extcodesize/address.code.length, which returns 0
        // for contracts in construction, since the code is only stored at the end
        // of the constructor execution.

        return account.code.length > 0;
    }
}

contract TestContract {
    address public owner;
    uint public foo;

    function getBalance() public view returns (uint) {
        return address(this).balance;
    }

}
