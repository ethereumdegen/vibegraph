

import { ethers, BigNumber } from 'ethers'

import VibegraphIndexer from 'vibegraph/dist/indexers/VibegraphIndexer'
import { ContractEvent } from 'vibegraph'
import { ERC20Balance } from '../models/ERC20_balance'
import { ERC20Approval } from '../models/ERC20_approval'
import { ERC20Transfer } from '../models/ERC20_transfer'
module.exports =  class IndexerERC20 extends VibegraphIndexer  {

   

    async onEventEmitted(event:ContractEvent){

        await this.modifyERC20LedgerByEvent( event )

    }
 

   
    async modifyERC20LedgerByEvent(  event:ContractEvent ){
     
        let eventName = event.name 

      

       let outputs = event.args

       let contractAddress = ethers.utils.getAddress(event.address )
       if(!eventName){

           console.log('WARN: unknown event in ', event.transactionHash )
           return
       }

       eventName = eventName.toLowerCase()
       
       if(eventName == 'transfer'){

           let from = ethers.utils.getAddress( outputs['0'] )
           let to = ethers.utils.getAddress( outputs['1'] )
           let amount = parseInt(outputs['2']) 



           await IndexerERC20.modifyERC20LedgerBalance(   from ,contractAddress , amount * -1   )
           await IndexerERC20.modifyERC20LedgerBalance(   to ,contractAddress , amount  ) 

            
           await IndexerERC20.modifyERC20LedgerApproval(  contractAddress, from ,to  , amount * -1 ) 


           await IndexerERC20.modifyERC20TransferredTotal(  contractAddress, from, to, amount ) 

       }
       else if(eventName == 'approval'){

           let from = ethers.utils.getAddress(outputs['0'] )
           let to = ethers.utils.getAddress(outputs['1'] )
           let amount = parseInt(outputs['2']) 

           await IndexerERC20.setERC20LedgerApproval(   contractAddress , from, to,  amount   ) 

       }
       else if(eventName == 'mint'){

           let to = ethers.utils.getAddress(outputs['0'] ) 
           let amount = parseInt(outputs['1']) 

           await IndexerERC20.modifyERC20LedgerBalance(   to ,contractAddress , amount   )  

       }
       else if(eventName == 'deposit'){

           let to = ethers.utils.getAddress(outputs['0'] ) 
           let amount = parseInt(outputs['1']) 

           await IndexerERC20.modifyERC20LedgerBalance(   to ,contractAddress , amount  )  

       }

       else if(eventName == 'withdrawal'){

           let from = ethers.utils.getAddress(outputs['0'] ) 
           let amount = parseInt(outputs['1']) 

           await IndexerERC20.modifyERC20LedgerBalance(   from ,contractAddress , amount * -1  )  

       }

      
   }

   static async modifyERC20LedgerBalance(accountAddress:string, contractAddress:string, amountDelta:any ){
 

       let existingFrom = await ERC20Balance.findOne( {accountAddress: accountAddress, contractAddress: contractAddress }  )

       if(existingFrom){
           await ERC20Balance.findOneAndUpdate( {accountAddress: accountAddress, contractAddress: contractAddress } , {  $inc: { amount: amountDelta } , $set:{ lastUpdatedAt: Date.now()  } } )
       }else{
           await ERC20Balance.create(  {accountAddress: accountAddress, contractAddress: contractAddress, amount: amountDelta , lastUpdatedAt: Date.now()}   )
       }
   }

   static async modifyERC20LedgerApproval( contractAddress:string, ownerAddress:string, spenderAddress:string,   amountDelta:any){

     

       let existingFrom = await ERC20Approval.findOne(  {ownerAddress: ownerAddress, spenderAddress: spenderAddress, contractAddress: contractAddress }  )

       if(existingFrom){
           await ERC20Approval.findOneAndUpdate(  {ownerAddress: ownerAddress, spenderAddress: spenderAddress, contractAddress: contractAddress } , {  $inc: { amount: amountDelta } , $set:{ lastUpdatedAt: Date.now() } } )
       }else{
           await ERC20Approval.create(  {ownerAddress: ownerAddress, spenderAddress: spenderAddress, contractAddress: contractAddress, amount: amountDelta , lastUpdatedAt: Date.now() }   )
       }
   }

   static async modifyERC20TransferredTotal( contractAddress:string, from:string, to:string,   amountDelta:any ){
 

    let existingFrom = await ERC20Transfer.findOne(  {from: from, to: to, contractAddress: contractAddress }  )

    if(existingFrom){
        await ERC20Transfer.findOneAndUpdate(  {from: from, to: to, contractAddress: contractAddress } , {  $inc: { amount: amountDelta , $set:{ lastUpdatedAt: Date.now() } } } )
    }else{
        await ERC20Transfer.create( {from: from, to: to, contractAddress: contractAddress, amount: amountDelta, lastUpdatedAt: Date.now() }   )
    }
}

   static async setERC20LedgerApproval( contractAddress:string, ownerAddress:string, spenderAddress:string,   newAmount:any   ){

       let collectionName = 'erc20_approval' 

       let existingFrom = await ERC20Approval.findOne(  {ownerAddress: ownerAddress, spenderAddress: spenderAddress, contractAddress: contractAddress }  )

       if(existingFrom){
           await ERC20Approval.findOneAndUpdate(  {ownerAddress: ownerAddress, spenderAddress: spenderAddress, contractAddress: contractAddress } , {  $set: { amount: newAmount , lastUpdatedAt: Date.now()} } )
       }else{
           await ERC20Approval.create(  {ownerAddress: ownerAddress, spenderAddress: spenderAddress, contractAddress: contractAddress, amount: newAmount , lastUpdatedAt: Date.now() }   )
       }
   }




}