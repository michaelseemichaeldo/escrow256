import Web3 from "web3";
import ERC20json from "../../build/contracts/ERC20.json";
import escrow256Artifact from "../../build/contracts/Escrow256.json";
// using LibraryDemo.sol?


const App = {
  web3: null,
  account: null,
  escrow: null,
  escrowId: null,
  //ERC20TokenContract: null,

  start: async function() {
    const { web3 } = this;
   
    try {
      // get contract instance
      const networkId = await web3.eth.net.getId();
      console.log(networkId)

      const deployedNetwork = escrow256Artifact.networks[networkId];
      console.log(deployedNetwork)

      this.escrow = new web3.eth.Contract(escrow256Artifact.abi, deployedNetwork.address);
      console.log(this.escrow)

      const ERC20deployedNetwork = ERC20json.networks[networkId];
      console.log(ERC20deployedNetwork)

      this.ERC20TokenContract =  new web3.eth.Contract(ERC20json.abi, ERC20deployedNetwork.address);
      console.log(this.ERC20TokenContract)

      // get accounts
      const accounts = await web3.eth.getAccounts();
      this.account = accounts[0];
      this.displayAccount()
    } catch (error) {
      console.error("Could not connect to contract or chain.");
    }
  },

  createEscrowContract: async function() {
    try {
    let { createEscrowContract } = this.escrow.methods
    let buyerElement = document.getElementById('buyer').value
    let loggedInWithAccount = this.account
    let tokenAddress = document.getElementById('token').value
    this.escrowId = await createEscrowContract(buyerElement, loggedInWithAccount, tokenAddress).send({from: this.account})
    this.setStatus("Escrow created! Id number: " + this.escrowId);
  } catch (error) {
    this.setStatus("Error creating escrow! Open console in your browser for more details")
    console.log(error)
  }

  },

  getEscrowId:  async function() {
    let { getEscrowId } = this.escrow.methods
    console.log(this.escrowId)
    this.escrowId =  await getEscrowId().call()
    let escrowIdElement = document.getElementById("escrowId")
    escrowIdElement.innerHTML = this.escrowId;
    console.log(this.escrowId)
  },

  getEtherBalance: async function() {
    let { getEtherBalance } = this.escrow.methods
    let etherBalance = await getEtherBalance(this.escrowId).call()
    console.log(etherBalance)
    let etherBalanceElement = document.getElementById("displayEtherAmount")
    etherBalanceElement.innerHTML = etherBalance/1000000000000000000;
  },

  getTokenSellerBalance: async function() {
    let { getTokenSellerBalance } = this.escrow.methods
    let tokenBalance = await getTokenSellerBalance(this.escrowId).call()
    console.log(tokenBalance)
    let tokenBalanceElement = document.getElementById("displayTokenAmount")
    tokenBalanceElement.innerHTML = tokenBalance;
  },

  getEscrowState: async function() {
    let { getEscrowState } = this.escrow.methods
    let escrowState = await getEscrowState(this.escrowId).call()
    console.log(escrowState)
    let escrowElementState = document.getElementById("escrowState")
    //console.log(escrowElementState)
    escrowElementState.innerHTML = escrowState
  },

  displayEscrow: async function() {
    this.escrowId = document.getElementById("inlineFormInput").value 
    let escrowIdElement = document.getElementById("escrowId")
    escrowIdElement.innerHTML = this.escrowId;
    await this.getEtherBalance()
    await this.getTokenSellerBalance()
    await this.getEscrowState()
    await this.displayAccount() 
    await this.getBuyerAccount()
    await this.getSellerAccount()
    //await this.getTokenContractBalance()
    //await this.getEscrowId()
    //let tokenId =  _tokenId;
  },

  getBuyerAccount: async function () {
    let { getBuyerAccountAddress } = this.escrow.methods
    let buyerAccountAddress = await getBuyerAccountAddress(this.escrowId).call()
    let buyerAddressElement = document.getElementById("buyerAddress")
    buyerAddressElement.innerHTML = buyerAccountAddress;
  },

  getSellerAccount: async function () {
    let { getSellerAccountAddress } = this.escrow.methods
    let sellerAccountAddress = await getSellerAccountAddress(this.escrowId).call()
    let sellerAddressElement = document.getElementById("sellerAddress")
    sellerAddressElement.innerHTML = sellerAccountAddress;
  },

  increaseEscrowId: async function() {
    let { increaseEscrowId } = this.escrow.methods
    let escrowId = await increaseEscrowId().send({ from: this.account})
    console.log(escrowId)
    let escrowIdElement = document.getElementById("escrowId")
    escrowIdElement.innerHTML = escrowId;
  },

  displayAccount: function () {
    web3.eth.getAccounts(function (err, accounts) {
    if (err != null) {
      this.setStatus('There was an error fetching your accounts.')
      return
    }

    if (accounts.length === 0) {
      this.setStatus("Couldn't get any accounts! Make sure your Ethereum client is configured correctly.")
      return
    }

    let account 
    account = accounts[0]
    let loggedInWithAccount = document.getElementById('account') 
    loggedInWithAccount.innerHTML = account
    console.log(account)
    })
  },
  displayAccountModal: function () {
    account = this.account
    let loggedInWithAccount = document.getElementById('accountModal') 
    loggedInWithAccount.innerHTML = account
    console.log(account)

  },

  sendEther: async function() {
    let amount = parseInt(document.getElementById("etherAmount").value) * 1000000000000000000
    let escrowId = parseInt(document.getElementById("escrowIdEther").value)
    this.setStatus("Initiating transaction... (please wait)")
    let { buyerDeposit } = this.escrow.methods;
    await buyerDeposit(escrowId).send({ from: this.account, value: amount}) 
    this.setStatus("Transaction complete!")
  },  
  // let escrowContractAddress = this.escrow.address
  
  sendToken: async function() {
    let escrowContractAddress = '0xCD438905FD14429fE6135569677efE10DfF5B770'
    let tokenAmount = document.getElementById("tokenAmount").value * Math.pow (10, 18)
    let escrowId = parseInt(document.getElementById("escrowIdToken").value)
    let tokenContract = document.getElementById("tokenContract").value

    this.setStatus("Initiating transaction... (please wait)")
    
    let tokenContractInstance = web3.eth.contract(ERC20json.abi).at(tokenContract)
    let sendTokenBool = tokenContractInstance.transfer(escrowContractAddress, tokenAmount).send({from: this.account})
 
    console.log(sendTokenBool)
    let { TokenSellerDeposit } = this.escrow.methods
    let tokenBalance = await TokenSellerDeposit(tokenContract, tokenAmount, escrowId).send({ from: this.account, value: tokenAmount}) 
    let tokenBalanceElement = document.getElementById("displayTokenAmount").value
    tokenBalanceElement.innerHTML = tokenBalance;
    
    this.setStatus("Transaction complete!")
  },

  confirmation: async function() {
    this.escrowId = document.getElementById("inlineFormInput").value 
    let { confirmTransaction } = this.escrow.methods
    //let confirmation = await confirmTransaction(this.escrowId).send({ from: this.account})
    let escrowState = await confirmTransaction(this.escrowId).send({ from: this.account}) 
    let escrowStateElement = document.getElementById("escrowState")
    escrowStateElement.innerHTML = escrowState;
    console.log(escrowState)
  },

  cancelTransaction: async function() {
    let { cancelTransaction } = this.escrow.methods
    await cancelTransaction(this.escrowId).send({ from: this.account}) 
    let escrowState = await cancelTransaction(this.escrowId)
    this.setStatus("Transaction canceled!")    
    this.escrowId = document.getElementById("inlineFormInput").value 
    let escrowStateElement = document.getElementById("escrowState")
    escrowState.innerHTML = escrowStateElement;
  },

  completeTransaction: async function() {
    this.escrowId = document.getElementById("inlineFormInput").value 
    this.setStatus("Initiating transaction... (please wait)")
    let { completeTransaction } = this.escrow.methods;
    await completeTransaction(this.escrowId).send({ from: this.account}) 
    this.setStatus("Transaction complete!")
  },

  getTokenContractBalance: async function() {
    this.escrowId = document.getElementById("inlineFormInput").value 
    //let { getTokenContractBalance } = this.escrow.methods;
    //let tokenContractBalance = await getTokenContractBalance(this.escrowId).send({ from: this.account}) 

    let escrowId = parseInt(document.getElementById("escrowIdToken").value)
    let tokenContract = document.getElementById("tokenContract").value
    let tokenContractInstance = web3.eth.contract(ERC20json.abi).at(tokenContract)
    //this.setStatus(tokenContractBalance)

    this.setStatus("Initiating transaction... (please wait)")
    let tokenContractBalance = tokenContractInstance.balanceOf('0x3c901DD35d6576cB7Bd3B4f86bd2994F4fcA6b5B');
    let tokenContractBalanceElement = document.getElementById("tokenContractBalance").value

    tokenContractBalanceElement.innerHTML = tokenContractBalance;
  },

  setStatus: function(message) {
    let status = document.getElementById("status");
    status.innerHTML = message;
  },
};

window.App = App;

window.addEventListener("load", function() {
  if (window.ethereum) {
    // use MetaMask's provider
    App.web3 = new Web3(window.ethereum);
    window.ethereum.enable(); // get permission to access accounts
  } 
  //   else {
  //   console.warn(
  //     "No web3 detected. Falling back to http://127.0.0.1:7545. You should remove this fallback when you deploy live",
  //   );
  //   // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
  //   App.web3 = new Web3(
  //     new Web3.providers.HttpProvider("http://127.0.0.1:7545"),
  //   );
  // }

  App.start();
});
