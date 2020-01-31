import Web3 from "web3";
import ERC20json from "../../build/contracts/ERC20.json";
import escrow256Artifact from "../../build/contracts/Escrow256.json";
import BN from "bn.js";

const App = {
  web3: null,
  account: null,
  escrow: null,
  escrowId: null,

  start: async function() {
    const { web3 } = this;
    try {
      // get contract instance
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = escrow256Artifact.networks[networkId];

      this.escrow = new web3.eth.Contract(escrow256Artifact.abi, deployedNetwork.address);

      const ERC20deployedNetwork = ERC20json.networks[networkId];
      this.ERC20TokenContract =  new web3.eth.Contract(ERC20json.abi, ERC20deployedNetwork.address);

      // get accounts
      const accounts = await web3.eth.getAccounts();
      this.account = accounts[0];
      this.displayAccount()
    } catch (error) {
      console.error("Could not connect to contract or chain.");
    }
  },

  // This function will create an escrow contract and store the address of the caller as the seller. The address of the buyer and ERC20 token contract will be stored as provided as well. It will return a unique escrow Id.
  createEscrowContract: async function() {
    try {
      let { createEscrowContract } = this.escrow.methods
      let buyerElement = document.getElementById('buyer').value
      let loggedInWithAccount = this.account
      let tokenAddress = document.getElementById('token').value
      this.setStatus("Initiating transaction... (please wait)")

      this.escrowId = await createEscrowContract(buyerElement, loggedInWithAccount, tokenAddress).send({from: this.account})
      this.escrowId =  await this.getEscrowId()

      this.setStatus("Escrow created! See Id number below");
  } catch (error) {
      this.setStatus("Error creating escrow! Open console in your browser for more details")
      console.log(error)
  }

  },

  //This function returns the latest escrow id 
  getEscrowId:  async function() {
    let { getEscrowId } = this.escrow.methods
    console.log(this.escrowId)
    this.escrowId =  await getEscrowId().call()
    let escrowIdElement = document.getElementById("escrowId")
    escrowIdElement.innerHTML = this.escrowId;
    console.log(this.escrowId)
  },

  //This function returns the ether balance of the escrow with the provided escrow id 
  getEtherBalance: async function() {
    let decimals = 18
    let decimalsBN = new BN(decimals)
    let divisor = new BN(10).pow(decimalsBN)
    let { getEtherBalance } = this.escrow.methods
    let etherBalance = await getEtherBalance(this.escrowId).call()
    let etherBalanceElement = document.getElementById("displayEtherAmount")
    etherBalanceElement.innerHTML = etherBalance/divisor;
  },

  //This function returns the token balance of the escrow with the provided escrow id 
  getTokenSellerBalance: async function() {
    const decimals = 18
    const decimalsBN = new BN(decimals)
    const divisor = new BN(10).pow(decimalsBN)
    let { getTokenSellerBalance } = this.escrow.methods
    let tokenBalance = await getTokenSellerBalance(this.escrowId).call()
    let tokenBalanceElement = document.getElementById("displayTokenAmount")
    tokenBalanceElement.innerHTML = tokenBalance;
  },

  //This function returns the state of the escrow 
  getEscrowState: async function() {
    let { getEscrowState } = this.escrow.methods
    let escrowState = await getEscrowState(this.escrowId).call()
    let escrowElementState = document.getElementById("escrowState")
    escrowElementState.innerHTML = escrowState
    this.getEscrowState()
  },

  //This function resturns the details of the escrow such as ether and token balance, state, and displays the buyers and seller's account
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
    //console.log(escrow256Artifact.address)
  },

  //This function returns the  the buyer's account
  getBuyerAccount: async function () {
    let { getBuyerAccountAddress } = this.escrow.methods
    let buyerAccountAddress = await getBuyerAccountAddress(this.escrowId).call()
    let buyerAddressElement = document.getElementById("buyerAddress")
    buyerAddressElement.innerHTML = buyerAccountAddress;
  },

  //This function returns the seller's account
  getSellerAccount: async function () {
    let { getSellerAccountAddress } = this.escrow.methods
    let sellerAccountAddress = await getSellerAccountAddress(this.escrowId).call()
    let sellerAddressElement = document.getElementById("sellerAddress")
    sellerAddressElement.innerHTML = sellerAccountAddress;
  },

  //This function returns the escrow Id
  increaseEscrowId: async function() {
    let { increaseEscrowId } = this.escrow.methods
    let escrowId = await increaseEscrowId().send({ from: this.account})
    console.log(escrowId)
    let escrowIdElement = document.getElementById("escrowId")
    escrowIdElement.innerHTML = escrowId;
  },

  //This function displays the account with which the user is logged in in Metamask
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

  //This function sends the amount of ether entered by the user to the escrow contract address
  sendEther: async function() {
    let decimals = 18
    let decimalsBN = new BN(decimals)
    let multiplicator = new BN(10).pow(decimalsBN)
    let amount = parseFloat(document.getElementById("etherAmount").value) * multiplicator
    let escrowId = parseInt(document.getElementById("escrowIdEther").value)
    this.setStatus("Initiating transaction... (please wait)")
    let { buyerDeposit } = this.escrow.methods;
    await buyerDeposit(escrowId).send({ from: this.account, value: amount}) 
    this.setStatus("Transaction complete!")
  },  
  
  //This function sends the amount of tokens entered by the user to the buyer address entered by the user
  sendToken: async function() {
    let decimals = 18
    let decimalsBN = new BN(decimals)
    let multiplier = new BN(10).pow(decimalsBN)
    //let escrowContractAddress = escrow256Artifact.address
    let escrowContractAddress = '0x880D7BB56d7433344A2a4A86e92c56d2f0cAB89e'

    let tokenAmount = parseInt(document.getElementById("tokenAmount").value) 
    let escrowId = parseInt(document.getElementById("escrowIdToken").value)
    let tokenContract = document.getElementById("tokenContract").value
    
    try{
    //verify that seller has enough tokens before initiating transfer
    let { validateTokenSellerBalance } = this.escrow.methods

      this.setStatus("Initiating transaction... (please wait)")
      let tokenContractInstance = web3.eth.contract(ERC20json.abi).at(tokenContract)
      // tokenInstance.balanceOf.call("0xb1Cf866ced575FD1A1997Daa5d6F099efb282E41", {from: "0xb1Cf866ced575FD1A1997Daa5d6F099efb282E41"});
      // let tokenContractBalanceOfSeller = await tokenContractInstance.balanceOf(this.account)
      // let tokenContractBalanceOfSeller = tokenContractInstance.balanceOf(this.account)
      // if(tokenBalanceOfSeller<tokenAmount){
      //   this.setStatus("not enough tokens")
      // }
      let totalTokenBalance = await validateTokenSellerBalance(escrowId, tokenContract, tokenAmount).call()
      console.log(totalTokenBalance.toString())
      this.setStatus("checking Token Balance!")

      if ((totalTokenBalance/multiplier) < tokenAmount) {
        this.setStatus("insufficient Token Balance!")
      }
      else{
      await tokenContractInstance.transfer(escrowContractAddress, tokenAmount * multiplier).send({from: this.account})
      }
     // this.setStatus("Transaction complete!")
      //let { TokenSellerDeposit } = this.escrow.methods
      //await TokenSellerDeposit(tokenAmount, escrowId).send({ from: this.account})
    }

    catch{
      this.setStatus("Confirm transaction on Metamask... Open browser console if there is no Metamask notification for more info.")
      let { TokenSellerDeposit } = this.escrow.methods
      await TokenSellerDeposit((tokenAmount), escrowId).send({ from: this.account})
      this.setStatus("Transaction complete!")
      
      
    }
  },


  //This function sets the confirmation variable to true in the contract and updates the state of the escrow
  confirmation: async function() {
    try{
    this.escrowId = document.getElementById("inlineFormInput").value 
    let { confirmTransaction } = this.escrow.methods
    //let confirmation = await confirmTransaction(this.escrowId).send({ from: this.account})
    this.setStatus("Initiating confirmation... (please wait)")
    let escrowState = await confirmTransaction(this.escrowId).send({ from: this.account}) 
    this.setStatus("Confirmed!")
    let escrowStateElement = document.getElementById("escrowState")
    escrowStateElement.innerHTML = escrowState;
    console.log(escrowState)
  }
    catch (error) {
      this.setStatus("Error! Open browser console for more details")
      console.log(error)
  }
  },

  //This function sets "canceled" variable to true in the contract and updates the state of the escrow
  cancelTransaction: async function() {
    try{

    this.escrowId = document.getElementById("inlineFormInput").value 
    let { cancelTransaction } = this.escrow.methods
    this.setStatus("Initiating cancellation... (please wait)")
    let escrowState = await cancelTransaction(this.escrowId).send({ from: this.account}) 
    this.setStatus("Transaction canceled!")    
    let escrowStateElement = document.getElementById("escrowState")
    escrowStateElement.innerHTML = escrowState;
  }
  catch (error) {
    this.setStatus("Error! Open browser console for more details")
    console.log(error)
}
  },

  //This function sets "completed" variable to true in the contract and also updates the state of the escrow
  completeTransaction: async function() {
    try{

    this.escrowId = document.getElementById("inlineFormInput").value 
    let { completeTransaction } = this.escrow.methods

    this.setStatus("Initiating transaction... (please wait)")
    await completeTransaction(this.escrowId).send({ from: this.account}) 
    
    this.setStatus("Transaction complete!")
    let escrowStateElement = document.getElementById("escrowState")
    escrowStateElement.innerHTML = escrowState;
    }
    catch (error) {
      this.setStatus("Error! Open browser console for more details")
      console.log(error)
  }
  },


//This function sets "canceled" variable to true in the contract and updates the state of the escrow
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
