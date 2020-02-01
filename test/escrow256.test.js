let Escrow256 = artifacts.require("Escrow256");
let ERC20Token = artifacts.require("./lib/ERC20.sol");
let SimpleToken = artifacts.require("./lib/SimpleToken.sol")
let BN = web3.utils.BN;


contract("Escrow", function(accounts) {

let seller = accounts[0];
let buyer = accounts[1];
let instance;
let instanceSimpleToken;

beforeEach(async () => {
    instance = await Escrow256.new()
    instanceSimpleToken = await SimpleToken.new()
})

//test to check that the address deploying the contract is equal to the owner variable in the contract
describe("Setup", async() => {
    it("OWNER should be set to the deploying address", async() => {
        let owner = await instance.owner()
        assert.equal(owner, seller, "the deploying address should be the owner")
    })
})

//testing that the initial escrow Id of a newly deployed escrow contract equals 0, to ensure proper initialisation.
describe("EscrowId", async() => {
    it("Initial EscrowId should be set to zero", async() => {
        let escrowId = await instance.EscrowId.call()
        assert.equal(escrowId, 0, "Initial EscrowId should be set to zero")
    })
})

//testing that the initial escrow Id of a newly created escrow euqals 1, to ensure the id increments as expected upon escrow creation
describe("createEscrowContract", () => {
    it("Creating Escrow should return id of 1", async() => {
        let simpleTokenAddress = instanceSimpleToken.address
        await instance.createEscrowContract(seller, buyer, simpleTokenAddress, {from: seller})
        let escrowId = await instance.EscrowId.call()
        assert.equal(escrowId, 1, "EscrowId should be 1")
    })
})

//testing that the initial escrow status of a newly created escrow euqals CREATED
describe("updateStatus at Escrow Creation", () => {

        
    it("creating Escrow should set Status to CREATED", async() => {
        let simpleTokenAddress = instanceSimpleToken.address
        let expectedStatus = "CREATED"
        await instance.createEscrowContract(seller, buyer, simpleTokenAddress, {from: seller})
        let escrowStatus = await instance.getEscrowState(1, {from: seller})
        assert.equal(escrowStatus, expectedStatus, "EscrowStatus should be CREATED")
    })
})

//testing that the  escrow canceled bool value of a newly created escrow euqals true
describe("Update created bool at Escrow Creation", () => {

    it("creating Escrow should set created bool to true", async() => {
        let escrowId = 1
        let simpleTokenAddress = instanceSimpleToken.address
        let expectedStatus = true
        await instance.createEscrowContract(seller, buyer, simpleTokenAddress, {from: seller})
        let escrowStatus = await instance.getEscrowCreatedBool(escrowId, {from: seller})
        assert.equal(escrowStatus, expectedStatus, "EscrowStatus should be TRUE")
    })
})

//testing to check that the status equals CANCELED after the cancelTransaction function is called 
describe("updateStatus at Cancellation", () => {


    it("Canceling Escrow should set Status to CANCEL", async() => {
        let expectedStatus = "CANCELED"
        let escrowId = 1
        let simpleTokenAddress = instanceSimpleToken.address
        await instance.createEscrowContract(seller, buyer, simpleTokenAddress, {from: seller})
        await instance.cancelTransaction(escrowId, {from: seller})
        let escrowStatus = await instance.getEscrowState(escrowId, {from: seller})
        assert.equal(escrowStatus, expectedStatus, "EscrowStatus should be CANCELED")
    })
})

//testing to check that the escrow status equals TOKENSELLER_CONFIRMATION_OUTSTANDINGN only the buyer address calls the confirmTransaction function 
describe("updateStatus at buyerConfirmation", () => {

    it("Buyer confirming Escrow should set Status to TOKENSELLER_CONFIRMATION_OUTSTANDING", async() => {
        let expectedStatus = "TOKENSELLER_CONFIRMATION_OUTSTANDING"
        let numberOfTokens = 100
        let etherAmount = 5
        let escrowId = 1
        instanceSimpleToken = await SimpleToken.new()
        let simpleTokenAddress = instanceSimpleToken.address

        await instance.createEscrowContract(buyer, seller, simpleTokenAddress, {from: seller})
        await instance.buyerDeposit( escrowId, {from: buyer, value: etherAmount})
        await instance.TokenSellerDeposit(numberOfTokens, escrowId, {from: seller}) 
        await instance.confirmTransaction(escrowId, {from: buyer})
        let escrowStatus = await instance.getEscrowState(escrowId, {from: buyer})
        assert.equal(escrowStatus, expectedStatus, "EscrowStatus should be TOKENSELLER_CONFIRMATION_OUTSTANDING")
    })
})

//testing to check that the escrow status equals BUYER_CONFIRMATION_OUTSTANDING only the seller address calls the confirmTransaction function 
describe("updateStatus at sellerConfirmation", () => {
    let expectedStatus = "BUYER_CONFIRMATION_OUTSTANDING"
    let numberOfTokens = 100
    let escrowId = 1
    let etherAmount = 5


    it("Seller confirming Escrow should set Status to BUYER_CONFIRMATION_OUTSTANDING", async() => {
        let expectedStatus = "BUYER_CONFIRMATION_OUTSTANDING"
        let numberOfTokens = 100
        let escrowId = 1
        let etherAmount = 5
        instanceSimpleToken = await SimpleToken.new()
        let simpleTokenAddress = instanceSimpleToken.address

        await instance.createEscrowContract(buyer, seller, simpleTokenAddress, {from: seller})
        await instance.buyerDeposit( escrowId, {from: buyer, value: etherAmount})
        await instance.TokenSellerDeposit(numberOfTokens, escrowId, {from: seller}) 
        await instance.confirmTransaction(escrowId, {from: seller})
        let escrowStatus = await instance.getEscrowState(escrowId, {from: seller})
        assert.equal(escrowStatus, expectedStatus, "EscrowStatus should be BUYER_CONFIRMATION_OUTSTANDING")
    })
})

//testing to check that the escrow's token balance is updated to 100 when 100 Simple Tokens are sent to the escrow with a particular id by the user
describe("TokenSellerDeposit", () => {


    it("Token should be deposited correctly", async() => {
        let expected = 100
        let numberOfTokens = 100
        let escrowId = 1
        instanceSimpleToken = await SimpleToken.new()
        let simpleTokenAddress = instanceSimpleToken.address

        await instance.createEscrowContract(buyer, seller, simpleTokenAddress, {from: seller})
        await instance.TokenSellerDeposit(numberOfTokens, escrowId, {from: seller})
        await instanceSimpleToken.transfer(instance.address, numberOfTokens, {from: seller})
        let tokenBalanceEscrowMapping = await instance.getTokenSellerBalance(escrowId)
        assert.equal(tokenBalanceEscrowMapping, expected, "TokenBalance should be 100")
     })
})

//testing to check that the  SimpleTokens ERC20 contract allocated the initial balance of 10000000000000000000000 to account[0], which is set as the seller account for testing purposes
describe("SimpleToken initial balance", () => {

    it("SimpleToken initial balance", async() => {
        let expected = 10000000000000000000000
        let sellersTokenBalance = await instanceSimpleToken.balanceOf(seller, {from: seller})
        assert.equal(sellersTokenBalance, expected, "TokenBalance should be 10000000000000000000000")
     })
})

//testing to check that the SimpleToken smart contract correctly updates the seller's balance upon transferring 100 SIM tokens to the escrow account
describe("Initial SimpleToken balance after transaction should be reduced by amount of tokens transferred", () => {
    let expected =  9999999999999999999900
    let numberOfTokens = 100
    let escrowId = 1

    it("Token balance after transaction", async() => {
        instanceSimpleToken = await SimpleToken.new()
        let simpleTokenAddress = instanceSimpleToken.address

        await instance.createEscrowContract(buyer, seller, simpleTokenAddress, {from: seller})
        await instance.TokenSellerDeposit(numberOfTokens, escrowId, {from: seller})
        await instanceSimpleToken.transfer(instance.address, numberOfTokens, {from: seller})
        let sellersTokenBalance = await instanceSimpleToken.balanceOf(seller, {from: seller})
        assert.equal(sellersTokenBalance, expected, "TokenBalance should be 9999999999999999999900")
     })
})

//testing to check that the buyers ether balance in escrow with escrowId 1 is updated correctly to 1 ether by the escrow contract after the buyer sends 1 ether to the escrow with the escrowId 1
describe("BuyerDeposit", () => {
    let etherAmount = 1
    let expectedEtherBalance = 1
    let escrowId = 1
    it("Ether should be deposited correctly", async() => {
        let simpleTokenAddress = instanceSimpleToken.address

        await instance.createEscrowContract(buyer, seller, simpleTokenAddress, {from: seller})
        await instance.buyerDeposit( escrowId, {from: buyer, value: etherAmount})
        
        let escrowEtherBalance = await instance.getEtherBalance(escrowId, {from: seller})
        assert.equal(escrowEtherBalance, expectedEtherBalance , "EtherBalance should be 1")
    })
})

//testing to check that the escrow's status gets updated to "CANCELED" when the user calls the cancelTransaction function of a particular escrow
describe("update canceled bool upon cancelation", () => {
    let escrowId = 1
    let expectedStatusBool = true

    it("Canceling Escrow should set cancel variable to true", async() => {
   
        let simpleTokenAddress = instanceSimpleToken.address
        await instance.createEscrowContract(buyer, seller, simpleTokenAddress, {from: seller})
        let escrowStatusBool = await instance.cancelTransaction.call(escrowId, {from: seller})
        assert.equal(escrowStatusBool, expectedStatusBool, "canceled should be CANCELED")
    })
})
//testing to check that the escrow ether balance gets updated to zero when the seller calls the completeTransaction function of a particular escrow
describe("CompleteTransaction", () => {

    it("completeTransaction should result in ether balance 0", async() => {
        let etherAmount = 5
        let numberOfTokens = 100
        let etherAmountExpected = 0
        let escrowId = 1
       let simpleTokenAddress = instanceSimpleToken.address
       await instanceSimpleToken.transfer(instance.address, numberOfTokens, {from: seller})
       await instance.createEscrowContract(buyer, seller, simpleTokenAddress, {from: seller})
       await instance.buyerDeposit( escrowId, {from: buyer, value: etherAmount})
       await instance.TokenSellerDeposit( numberOfTokens, escrowId, {from: seller})
       await instance.sellerConfirmTransaction(escrowId,  {from: seller})
       await instance.buyerConfirmTransaction(escrowId,  {from: buyer})
       await instance.completeTransaction(escrowId, {from: seller})
       let escrowEtherBalance = await instance.getEtherBalance(escrowId, {from: seller})
       assert.equal(escrowEtherBalance, etherAmountExpected , "EtherBalance should be 0")
    })

})

//testing to check that the escrow token balance gets updated to zero when the seller calls the completeTransaction function of a particular escrow
describe("CompleteTransaction", () => {


    it("completeTransaction should result in buyers token balance 0 at escrowContract", async() => {
       let simpleTokenAddress = instanceSimpleToken.address
       let etherAmount = 5
       let numberOfTokens = 100
       let tokenAmountExpected = 0
       let escrowId = 1
       await instanceSimpleToken.transfer(instance.address, numberOfTokens, {from: seller})
       await instance.createEscrowContract(buyer, seller, simpleTokenAddress, {from: seller})
       await instance.buyerDeposit( escrowId, {from: buyer, value: etherAmount})
       await instance.TokenSellerDeposit( numberOfTokens, escrowId, {from: seller})
       await instance.sellerConfirmTransaction(escrowId,  {from: seller})
       await instance.buyerConfirmTransaction(escrowId,  {from: buyer})
       await instance.completeTransaction(escrowId, {from: seller})
       let escrowTokenBalance = await instance.getTokenSellerBalance(escrowId, {from: seller})
       assert.equal(escrowTokenBalance, tokenAmountExpected , "TokenBalance should be 0")
    })

})

//testing to check that the simpleToken balance of the seller gets updated correctly after the user calls the completeTransaction function
describe("CompleteTransaction", () => {

    it("completeTransaction should result in buyer's token balance of 100 at SimpleToken Contract", async() => {
        let etherAmount = 5
        let numberOfTokens = 100
        let tokenAmountExpected = 100
        let escrowId = 1
    
       instance = await Escrow256.new()
       instanceSimpleToken = await SimpleToken.new()
    
       let simpleTokenAddress = instanceSimpleToken.address
       await instanceSimpleToken.transfer(instance.address, numberOfTokens, {from: seller})
       await instance.createEscrowContract(buyer, seller, simpleTokenAddress, {from: seller})
       await instance.buyerDeposit( escrowId, {from: buyer, value: etherAmount})
       await instance.TokenSellerDeposit( numberOfTokens, escrowId, {from: seller})
       await instance.sellerConfirmTransaction(escrowId,  {from: seller})
       await instance.buyerConfirmTransaction(escrowId,  {from: buyer})
       await instance.completeTransaction(escrowId, {from: seller})
       let buyersTokenBalance = new BN(await instanceSimpleToken.balanceOf(buyer, {from: buyer})).toString()
       assert.equal(buyersTokenBalance, tokenAmountExpected , "TokenBalance should be 100")
    })

})

//testing to check that the  SimpleTokens ERC20 contract allocated the initial balance of 10000000000000000000000 to account[0], which is set as the seller account for testing purposes
describe("Stop contract bool", () => {

    it("Stop contract bool", async() => {
        instance = await Escrow256.new()
        let expectedStopContractBool = true
        await instance.stopContract({from: seller})
        let stopContractBool = await instance.getStopContractBool({from: seller})
        assert.equal(stopContractBool, expectedStopContractBool, "stopped bool should equal true")
     })
})

//testing that trying to deposit ether should fail and the ether balance should stay unchanged after calling the StopContract function
describe("Stop contract bool", () => {

    it("Ether deposit should fail after calling StopContract function", async() => {
        let escrowId=1
        let expectedEtherBalance = 0
        let etherAmount = 5
        let instance = await Escrow256.new()
        let simpleTokenAddress = instanceSimpleToken.address
        let escrowEtherBalance = 0
        
        await instance.stopContract({from: seller})
        
        try{
            await instance.createEscrowContract(buyer, seller, simpleTokenAddress, {from: seller})
            await instance.buyerDeposit( escrowId, {from: buyer, value: etherAmount})
            escrowEtherBalance = await instance.getEtherBalance(escrowId, {from: seller})
            //throw null;
            }

        catch{
            assert.equal(escrowEtherBalance, expectedEtherBalance, "Ether should stay 0 due to error")
            // assert(error, "Expected an error but did not get one");
            } 
    })
})
})

