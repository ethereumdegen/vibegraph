//var expect    = require("chai").expect;

import ethers from 'ethers';
/*var VibeGraph = require('../index.js')

var Web3 = require('web3')

let web3Config = require('./testconfig.json')
*/
import Web3 from 'web3'
import { use, should } from 'chai'




import FileHelper from '../../lib/file-helper.mjs'

import MongoInterface from '../../lib/mongo-interface.js'

import IndexerERC1155 from '../../indexers/IndexerERC1155.js'
 
 let web3Config = FileHelper.readJSONFile('tests/testconfig.json')

 should()


describe("ERC1155 Indexer",   function() {

    let web3 = new Web3( web3Config.web3provider  )

    let operator = web3.eth.accounts.create() 
    let userA = web3.eth.accounts.create() 
    let userB  = web3.eth.accounts.create() 

    let mongoInterface 

    
    const nftContractAddress = web3.utils.toChecksumAddress("0x9c8ff314c9bc7f6e59a9d9225fb22946427edc03")


     beforeEach(async function() {

          
         

        let dbName = 'vibegraph_test'    
        mongoInterface = new MongoInterface( ) 
        await mongoInterface.init( dbName ,  {} )

        //should clear out the db ? 

        await mongoInterface.deleteMany('erc1155_balances', { }  )


    })
 
    it("can add records", async function() { 
         
        let event = {
            event:"transfersingle",
            address: nftContractAddress,
            returnValues:{
            _operator: operator.address,
             _from: userA.address,
             _to: userB.address,
             _id: 2,
             _value: 3}} 
        
        await IndexerERC1155.modifyERC1155LedgerByEvent(event,mongoInterface) 
  
        let existingAccount = await mongoInterface.findOne('erc1155_balances', {accountAddress: userB.address, contractAddress: nftContractAddress }  )
          
        existingAccount.should.exist 
        existingAccount.tokenBalances['2'].should.eql(3)

        await IndexerERC1155.modifyERC1155LedgerByEvent(event,mongoInterface) 

        existingAccount = await mongoInterface.findOne('erc1155_balances', {accountAddress: userB.address, contractAddress: nftContractAddress }  )
          
        existingAccount.should.exist 
        existingAccount.tokenBalances['2'].should.eql(6)

    });

    it("can remove records", async function() { 
         
        let event = {
            event:"transfersingle",
            address: nftContractAddress,
            returnValues:{
            _operator: operator.address,
             _from: userA.address,
             _to: userB.address,
             _id: 2,
             _value: 3}} 
        
        await IndexerERC1155.modifyERC1155LedgerByEvent(event,mongoInterface) 
  
        let existingAccount = await mongoInterface.findOne('erc1155_balances', {accountAddress: userB.address, contractAddress: nftContractAddress }  )
          
        existingAccount.should.exist 
        existingAccount.tokenBalances['2'].should.eql(3)

        let removalEvent = {
            event:"transfersingle",
            address: nftContractAddress,
            returnValues:{
            _operator: operator.address,
             _from: userB.address,
             _to: userA.address,
             _id: 2,
             _value: 1}} 

        await IndexerERC1155.modifyERC1155LedgerByEvent(removalEvent,mongoInterface) 

        existingAccount = await mongoInterface.findOne('erc1155_balances', {accountAddress: userB.address, contractAddress: nftContractAddress }  )
          
        existingAccount.should.exist 
        existingAccount.tokenBalances['2'].should.eql(2)

    });


    it("can batch transfer records", async function() { 
         
        let event = {
            event:"transferbatch",
            address: nftContractAddress,
            returnValues:{
            _operator: operator.address,
             _from: userA.address,
             _to: userB.address,
             _ids: [2,7],
             _values: [3,5]}} 
        
        await IndexerERC1155.modifyERC1155LedgerByEvent(event,mongoInterface) 
  
        let existingAccount = await mongoInterface.findOne('erc1155_balances', {accountAddress: userB.address, contractAddress: nftContractAddress }  )
          
        existingAccount.should.exist 
        existingAccount.tokenBalances['2'].should.eql(3)

        await IndexerERC1155.modifyERC1155LedgerByEvent(event,mongoInterface) 

        existingAccount = await mongoInterface.findOne('erc1155_balances', {accountAddress: userB.address, contractAddress: nftContractAddress }  )
          
        existingAccount.should.exist 
        existingAccount.tokenBalances['2'].should.eql(6)

    });

  
   
       
  });

