# Escrow256

The Escrow256 dApp is a simple contract to escrow ERC20 tokens and ether. It allows a token owner to sell their token for ether trustlessly. In the upcoming tokenization of assets this will be something useful to transact between two parties by minimising credit risk, i.e. the parties don't have to trust each other or a third party (escrow agent) they can instead rely the transparent escrow256 smart contract to hold the assets until both parties have delivered the digital assets.

 The steps to complete such a transaction are:

1. The account owning the ERC20 token (seller) creates the escrow and receives a corresponding escrowId.

2. The seller transfers the ownership of a preagreed amount of ERC20 tokens to the escrow smart contract. The contract stores the balance of the escrow with the respective Id that is generated at escrow creation.

3. The seller lets the buyer know that the escrow had been created and passes along the id number, upon which the buyer of the ERC20 tokens deposits a preagreed amount of ether into the respective escrow contract.

4. The buyer and seller can check the balances of the escrow with the respective Id and when they are satisfied with the locked up balances they can individually confirm by clicking the confirm button. If they do decide to not go through with the transaction, they can hit the cancel button instead.

5. Once both buyer and seller have clicked 'confirm Transaction', the smart contract will update the state of the respective escrow. The buyer or seller can then click 'Complete Transaction', after which the token and ether will be exchanged.

Escrow256 is a truffle project that contains the required contracts, migration and test files.

While I have developed in the Windows environment I checked and it works in the VM using Ubuntu as well.

If you don't want to run it locally you can also access the dApp via http://escrow256.com and connecting your metamask account to the ropsten test network.

In order to build and run the project including the frontend code LOCALLY:

1. Clone this repository to your machine to run the project on your system.
2. Make sure you have nodejs and npm installed
3. Go to the app folder with the package.json file and run `$npm install` to install the dependencies
4. Make sure you have ganache installed and running. 
5. Go up to the escrow256 folder containing the contracts folder
6. Start your development blockchain by running `$ truffle develop` from the terminal in the escrow256 project directory.
7. Run `$ compile` to create the json contract artifacts (you might have to run `$ npm install` again in that folder)
8. Then run `truffle migrate --reset --network development` to deploy the contracts onto the network ("development" will deploy locally to ganache)
9. Copy the escrow contract's deployed address into the front end (index.js) to assign it to the "escrowContractAddress" variable in the "sendToken()" function. That way the tokens get sent to the escrow contract's address when the function is called.
10. `$ npm run build` to compile the javascript and html assets into the build folder
11. `$ npm run dev` to serve the assets in the build folder
12. Go to the host and port that truffle is serving (default is localhost:8080) in order to see the served assets
13. You can run the pre-written tests by running `test` from the terminal.

