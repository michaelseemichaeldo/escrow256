let Escrow256 = artifacts.require("Escrow256");
let ERC20Token = artifacts.require("./lib/ERC20.sol");
let SimpleToken = artifacts.require("./lib/SimpleToken.sol")
let BN = web3.utils.BN;


contract("Escrow", function(accounts) {

let seller = accounts[0];
let buyer = accounts[1];
let instance;
let instanceSimpleToken;
let _escrowId=1;

beforeEach(async () => {
    instance = await Escrow256.new()
    instanceSimpleToken = await SimpleToken.new()
})

describe("Setup", async() => {
    it("OWNER should be set to the deploying address", async() => {
        let owner = await instance.owner()
        assert.equal(owner, seller, "the deploying address should be the owner")
    })
})

describe("EscrowId", async() => {
    it("Initial EscrowId should be set to zero", async() => {
        let escrowId = await instance.EscrowId.call()
        assert.equal(escrowId, 0, "Initial EscrowId should be set to zero")
    })
})

describe("createEscrowContract", () => {
    it("Creating Escrow should return id of 1", async() => {
        let simpleTokenAddress = instanceSimpleToken.address
        await instance.createEscrowContract(seller, buyer, simpleTokenAddress, {from: seller})
        let escrowId = await instance.EscrowId.call()
        assert.equal(escrowId.valueOf(), 1, "EscrowId should be 1")
    })
})

describe("updateStatus at Escrow Creation", () => {

    it("creating Escrow should set Status to CREATED", async() => {
        let simpleTokenAddress = instanceSimpleToken.address
        let expectedStatus = "CREATED"
        await instance.createEscrowContract(seller, buyer, simpleTokenAddress, {from: seller})
        let escrowStatus = await instance.getEscrowState(1, {from: seller})
        assert.equal(escrowStatus, expectedStatus, "EscrowStatus should be CREATED")
    })
})

describe("updateStatus at Cancellation", () => {
    let _escrowId = 1
    it("Canceling Escrow should set Status to CANCEL", async() => {
        let expectedStatus = "CANCELED"
        let simpleTokenAddress = instanceSimpleToken.address
        await instance.createEscrowContract(seller, buyer, simpleTokenAddress, {from: seller})
        await instance.cancelTransaction(_escrowId, {from: seller})
        let escrowStatus = await instance.getEscrowState(_escrowId, {from: seller})
        assert.equal(escrowStatus, expectedStatus, "EscrowStatus should be CANCELED")
    })
})

describe("updateStatus at buyerConfirmation", () => {
    let seller = accounts[0]
    let buyer = accounts[1]
    let expectedStatus = "TOKENSELLER_CONFIRMATION_OUTSTANDING"
    let _numberOfTokens = 100
    let _escrowId = 1
    let etherAmount = 5
    


    it("Buyer confirming Escrow should set Status to TOKENSELLER_CONFIRMATION_OUTSTANDING", async() => {
        instanceSimpleToken = await SimpleToken.new()
        let simpleTokenAddress = instanceSimpleToken.address

        await instance.createEscrowContract(buyer, seller, simpleTokenAddress, {from: seller})
        await instance.buyerDeposit( _escrowId, {from: buyer, value: etherAmount})
        await instance.TokenSellerDeposit(_numberOfTokens, _escrowId, {from: seller}) 
        await instance.buyerConfirmTransaction(_escrowId, {from: buyer})
        let escrowStatus = await instance.getEscrowState(_escrowId, {from: buyer})
        assert.equal(escrowStatus, expectedStatus, "EscrowStatus should be TOKENSELLER_CONFIRMATION_OUTSTANDING")
    })
})

describe("updateStatus at sellerConfirmation", () => {
    let seller = accounts[0]
    let buyer = accounts[1]
    let expectedStatus = "BUYER_CONFIRMATION_OUTSTANDING"
    let _numberOfTokens = 100
    let _escrowId = 1
    let etherAmount = 5


    it("Seller confirming Escrow should set Status to BUYER_CONFIRMATION_OUTSTANDING", async() => {
        instanceSimpleToken = await SimpleToken.new()
        let simpleTokenAddress = instanceSimpleToken.address

        await instance.createEscrowContract(buyer, seller, simpleTokenAddress, {from: seller})
        await instance.buyerDeposit( _escrowId, {from: buyer, value: etherAmount})
        await instance.TokenSellerDeposit(_numberOfTokens, _escrowId, {from: seller}) 
        await instance.sellerConfirmTransaction(_escrowId, {from: seller})
        let escrowStatus = await instance.getEscrowState(_escrowId, {from: seller})
        assert.equal(escrowStatus, expectedStatus, "EscrowStatus should be BUYER_CONFIRMATION_OUTSTANDING")
    })
})

describe("TokenSellerDeposit", () => {
    let expected = 100
    let _numberOfTokens = 100
    let etherAmount = 5

    it("Token should be deposited correctly", async() => {
        instanceSimpleToken = await SimpleToken.new()
        let simpleTokenAddress = instanceSimpleToken.address

        await instance.createEscrowContract(buyer, seller, simpleTokenAddress, {from: seller})
        await instance.TokenSellerDeposit(_numberOfTokens, _escrowId, {from: seller})
        await instanceSimpleToken.transfer(instance.address, _numberOfTokens, {from: seller})
        let tokenBalanceEscrowMapping = await instance.getTokenSellerBalance(_escrowId)
        assert.equal(tokenBalanceEscrowMapping, expected, "TokenBalance should be 100")
     })
})

describe("SimpleToken initial balance", () => {
    let expected = 10000000000000000000000

    it("Token balance", async() => {
        let sellersTokenBalance = await instanceSimpleToken.balanceOf(seller, {from: seller})
        assert.equal(sellersTokenBalance, expected, "TokenBalance should be 10000000000000000000000")
     })
})

describe("SimpleToken balance after transaction", () => {
    //let expected = 10000000000000000000000
    let expected =  9999999999999999999900
    let _numberOfTokens = 100

    it("Token balance after transaction", async() => {
        instanceSimpleToken = await SimpleToken.new()
        let simpleTokenAddress = instanceSimpleToken.address

        await instance.createEscrowContract(buyer, seller, simpleTokenAddress, {from: seller})
        await instance.TokenSellerDeposit(_numberOfTokens, _escrowId, {from: seller})
        await instanceSimpleToken.transfer(instance.address, _numberOfTokens, {from: seller})
        let sellersTokenBalance = await instanceSimpleToken.balanceOf(seller, {from: seller})
        assert.equal(sellersTokenBalance, expected, "TokenBalance should be 9999999999999999999900")
     })
})

describe("BuyerDeposit", () => {
    let etherAmount = 1
    let expectedEtherBalance = 1

    it("Ether should be deposited correctly", async() => {
        let simpleTokenAddress = instanceSimpleToken.address


        await instance.createEscrowContract(buyer, seller, simpleTokenAddress, {from: seller})
        await instance.buyerDeposit( _escrowId, {from: buyer, value: etherAmount})
        
        let escrowEtherBalance = await instance.getEtherBalance(_escrowId, {from: seller})
        assert.equal(escrowEtherBalance, expectedEtherBalance , "EtherBalance should be 1")
    })
})

describe("updateStatus at Cancellation", () => {

    it("Canceling Escrow should set cancel variable to true", async() => {
        let expectedStatus = "CANCELED"
        let expectedStatusBool = true
        let simpleTokenAddress = instanceSimpleToken.address

        await instance.createEscrowContract(buyer, seller, simpleTokenAddress, {from: seller})
        let escrowStatusBool = await instance.cancelTransaction.call(_escrowId, {from: seller})
        assert.equal(escrowStatusBool, expectedStatusBool, "EscrowStatus should be CANCELED")
    })
})

describe("CompleteTransaction", () => {
    let etherAmount = 5
    let _numberOfTokens = 100
    let etherAmountExpected = 0

    it("completeTransaction should result in ether balance 0", async() => {
       let simpleTokenAddress = instanceSimpleToken.address
       await instanceSimpleToken.transfer(instance.address, _numberOfTokens, {from: seller})
       await instance.createEscrowContract(buyer, seller, simpleTokenAddress, {from: seller})
       await instance.buyerDeposit( _escrowId, {from: buyer, value: etherAmount})
       await instance.TokenSellerDeposit( _numberOfTokens, _escrowId, {from: seller})
       await instance.sellerConfirmTransaction(_escrowId,  {from: seller})
       await instance.buyerConfirmTransaction(_escrowId,  {from: buyer})
       await instance.completeTransaction(_escrowId, {from: seller})
       let escrowEtherBalance = await instance.getEtherBalance(_escrowId, {from: seller})
       assert.equal(escrowEtherBalance, etherAmountExpected , "EtherBalance should be 0")
    })

})

describe("CompleteTransaction", () => {
    let etherAmount = 5
    let _numberOfTokens = 100
    let tokenAmountExpected = 0

    it("completeTransaction should result in buyers token balance 0 at escrowContract", async() => {
       let simpleTokenAddress = instanceSimpleToken.address
       await instanceSimpleToken.transfer(instance.address, _numberOfTokens, {from: seller})
       await instance.createEscrowContract(buyer, seller, simpleTokenAddress, {from: seller})
       await instance.buyerDeposit( _escrowId, {from: buyer, value: etherAmount})
       await instance.TokenSellerDeposit( _numberOfTokens, _escrowId, {from: seller})
       await instance.sellerConfirmTransaction(_escrowId,  {from: seller})
       await instance.buyerConfirmTransaction(_escrowId,  {from: buyer})
       await instance.completeTransaction(_escrowId, {from: seller})
       let escrowTokenBalance = await instance.getTokenSellerBalance(_escrowId, {from: seller})
       assert.equal(escrowTokenBalance, tokenAmountExpected , "TokenBalance should be 0")
    })

})


describe("CompleteTransaction", () => {
    let etherAmount = 5
    let _numberOfTokens = 100
    let tokenAmountExpected = 100
    let seller = accounts[0];
    let buyer = accounts[1];


    it("completeTransaction should result in buyer's token balance of 100 at SimpleToken Contract", async() => {
        instance = await Escrow256.new()
        instanceSimpleToken = await SimpleToken.new()
    
       let simpleTokenAddress = instanceSimpleToken.address
       await instanceSimpleToken.transfer(instance.address, _numberOfTokens, {from: seller})
       await instance.createEscrowContract(buyer, seller, simpleTokenAddress, {from: seller})
       await instance.buyerDeposit( _escrowId, {from: buyer, value: etherAmount})
       await instance.TokenSellerDeposit( _numberOfTokens, _escrowId, {from: seller})
       await instance.sellerConfirmTransaction(_escrowId,  {from: seller})
       await instance.buyerConfirmTransaction(_escrowId,  {from: buyer})
       await instance.completeTransaction(_escrowId, {from: seller})
       let buyersTokenBalance = new BN(await instanceSimpleToken.balanceOf(buyer, {from: buyer})).toString()
       assert.equal(buyersTokenBalance, tokenAmountExpected , "TokenBalance should be 100")
    })

})
})


