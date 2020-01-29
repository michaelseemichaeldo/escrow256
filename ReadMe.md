<!-- README.md that explains your project
○  	What does your project do?
○  	How to set it up
■  	Run a local development server -->

# Escrow256
Escrow256 is a truffle project that contains the required contracts, migration and test files. To run the project on your system, clone this repo to your local machine.
Start your development blockchain by running `$ truffle develop` from the terminal in the project directory. From the truffle console, compile and migrate the contracts by running `compile` and `migrate`. You can run the pre-written tests by running `test`.

The Escrow256 dApp is a simple contract to escrow ERC20 tokens and ether.
 It allows a token owner to sell their token for ether trustlessly. The steps to complete such a transaction are:

1. The account owning the ERC20 token (seller) creates the escrow and receives a corresponding escrowId.

2. The seller transfers the ownership of a preagreed amount of ERC20 token to the Escrow256 smart contract. The balance is stored in the EscrowMapping with the respective Id generated at escrow creation.

3. The seller lets the buyer know that the escrow had been created and passes along the id number. Upon which the buyer of the ERC20 tokens deposits a preagreed amount of ether into the respective escrow contract. 

4. The buyer and seller can check the balances of the escrow with the respective Id and when they are satisfied with the locked up balances they can individually confirm by clicking the confirm button. If they do decide to not go through with the transaction, they can hit the cancel button instead.

5. Once both buyer and seller have clicked the confirm button, the smart contract will update the state of the respective escrow, upon which the exchange of the token and ether will be completed.


In order to build and run the frontend code LOCALLY:

1. Run have npm (run npm install)
2. Make sure you have ganache running
3. "truffle compile" to create the json contract artifacts
4. "truffle migrate --reset --network development" to deploy the contracts onto the network ("development" will deploy locally to ganache)
5. write down the escrow contract's address and copy it into the front end to assign it to the escrowContract variable.
6. "npm run build" to compile the javascript and html assets into the build folder
7. "npm run dev" to serve the assets in the build folder
8. go to the host and port that truffle is serving (default is localhost:8080) in order to see the served assets