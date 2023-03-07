
import VibegraphIndexer from './VibegraphIndexer'
import { ethers, BigNumber } from 'ethers'

module.exports =  class IndexerERC20 extends VibegraphIndexer  {

   

    async onEventEmitted(event){

        await IndexerERC20.modifyERC20LedgerByEvent(event,this.mongoInterface)

    }
 

   
    async modifyERC20LedgerByEvent(  event, mongoInterface){
     
        let eventName = event.event 

      

       let outputs = event.returnValues

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



           await IndexerERC20.modifyERC20LedgerBalance(   from ,contractAddress , amount * -1 , mongoInterface )
           await IndexerERC20.modifyERC20LedgerBalance(   to ,contractAddress , amount , mongoInterface) 

            
           await IndexerERC20.modifyERC20LedgerApproval(  contractAddress, from ,to  , amount * -1 , mongoInterface) 


           await IndexerERC20.modifyERC20TransferredTotal(  contractAddress, from, to, amount , mongoInterface) 

       }
       else if(eventName == 'approval'){

           let from = ethers.utils.getAddress(outputs['0'] )
           let to = ethers.utils.getAddress(outputs['1'] )
           let amount = parseInt(outputs['2']) 

           await IndexerERC20.setERC20LedgerApproval(   contractAddress , from, to,  amount  , mongoInterface ) 

       }
       else if(eventName == 'mint'){

           let to = ethers.utils.getAddress(outputs['0'] ) 
           let amount = parseInt(outputs['1']) 

           await IndexerERC20.modifyERC20LedgerBalance(   to ,contractAddress , amount  , mongoInterface)  

       }
       else if(eventName == 'deposit'){

           let to = ethers.utils.getAddress(outputs['0'] ) 
           let amount = parseInt(outputs['1']) 

           await IndexerERC20.modifyERC20LedgerBalance(   to ,contractAddress , amount , mongoInterface)  

       }

       else if(eventName == 'withdrawal'){

           let from = ethers.utils.getAddress(outputs['0'] ) 
           let amount = parseInt(outputs['1']) 

           await IndexerERC20.modifyERC20LedgerBalance(   from ,contractAddress , amount * -1 , mongoInterface)  

       }

      
   }

   static async modifyERC20LedgerBalance(accountAddress, contractAddress, amountDelta, mongoInterface){

       let collectionName = 'erc20_balances' 

       let existingFrom = await mongoInterface.findOne(collectionName, {accountAddress: accountAddress, contractAddress: contractAddress }  )

       if(existingFrom){
           await mongoInterface.updateCustomAndFindOne(collectionName, {accountAddress: accountAddress, contractAddress: contractAddress } , {  $inc: { amount: amountDelta } , $set:{ lastUpdatedAt: Date.now()  } } )
       }else{
           await mongoInterface.insertOne(collectionName, {accountAddress: accountAddress, contractAddress: contractAddress, amount: amountDelta , lastUpdatedAt: Date.now()}   )
       }
   }

   static async modifyERC20LedgerApproval( contractAddress, ownerAddress, spenderAddress,   amountDelta , mongoInterface){

       let collectionName = 'erc20_approval' 

       let existingFrom = await mongoInterface.findOne(collectionName, {ownerAddress: ownerAddress, spenderAddress: spenderAddress, contractAddress: contractAddress }  )

       if(existingFrom){
           await mongoInterface.updateCustomAndFindOne(collectionName, {ownerAddress: ownerAddress, spenderAddress: spenderAddress, contractAddress: contractAddress } , {  $inc: { amount: amountDelta } , $set:{ lastUpdatedAt: Date.now() } } )
       }else{
           await mongoInterface.insertOne(collectionName, {ownerAddress: ownerAddress, spenderAddress: spenderAddress, contractAddress: contractAddress, amount: amountDelta , lastUpdatedAt: Date.now() }   )
       }
   }

   static async modifyERC20TransferredTotal( contractAddress, from, to,   amountDelta , mongoInterface){

    let collectionName = 'erc20_transferred' 

    let existingFrom = await mongoInterface.findOne(collectionName, {from: from, to: to, contractAddress: contractAddress }  )

    if(existingFrom){
        await mongoInterface.updateCustomAndFindOne(collectionName, {from: from, to: to, contractAddress: contractAddress } , {  $inc: { amount: amountDelta , $set:{ lastUpdatedAt: Date.now() } } } )
    }else{
        await mongoInterface.insertOne(collectionName, {from: from, to: to, contractAddress: contractAddress, amount: amountDelta, lastUpdatedAt: Date.now() }   )
    }
}

   static async setERC20LedgerApproval( contractAddress, ownerAddress, spenderAddress,   newAmount , mongoInterface ){

       let collectionName = 'erc20_approval' 

       let existingFrom = await mongoInterface.findOne(collectionName, {ownerAddress: ownerAddress, spenderAddress: spenderAddress, contractAddress: contractAddress }  )

       if(existingFrom){
           await mongoInterface.updateCustomAndFindOne(collectionName, {ownerAddress: ownerAddress, spenderAddress: spenderAddress, contractAddress: contractAddress } , {  $set: { amount: newAmount , lastUpdatedAt: Date.now()} } )
       }else{
           await mongoInterface.insertOne(collectionName, {ownerAddress: ownerAddress, spenderAddress: spenderAddress, contractAddress: contractAddress, amount: newAmount , lastUpdatedAt: Date.now() }   )
       }
   }




}