# equivalence-tests
Testing whether Hedera behaves in an Ethereum equivalent way

# Equivalence testing guide

### Goal

Create a setup that makes it easy to compare Network and/or EVM specific behavior in different environments (Hedera vs Ethereum). 

Use tools which are supported by both Hedera and Ethereum native environments and allow us to switch environment with minimal changes to the setup.

### Overview of tools used in the setup

1. A locally running instance of Hedera Local Node
    
    ```
    node cli.js restart -d --network local --limits false
    ```
    
2. A locally running instance of a Besu node
    
    ```
    docker run -p 8545:8545 -p 8546:8546 hyperledger/besu:latest --miner-enabled --miner-coinbase fe3b557e8fb62b89f4916b721be55ceb828dbd73 --rpc-ws-enabled --network=dev --rpc-http-enabled
    ```
    
3. A Hardhat project that can connect to both environments - this project
    1. including the smart contracts that we want to use for testing
    2. including test cases that assert a certain behavior 
    3. configured to easily switch between environments
4. The Open RPC playground that can be used to execute JSON-RPC requests to both environments and inspect the results

### Running the tests

1. Clone this GitHub repository 
2. Install the project and run with:
    1. `npx hardhat test --network hedera_local` to run the tests against the Besu node
    2. `npx hardhat test --network besu_local` to run the tests against the Hedera local node

### Ideas for improvements / next steps

1. Try to debug_trace a transaction in the Besu client and describe the steps
2. Try to run the Besu client in debug mode from IntelliJ and debug some transactions to inspect the network behavior in more details

