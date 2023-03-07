
import VibegraphIndexer from './VibegraphIndexer'
import { ethers, BigNumber } from 'ethers'


module.exports =  class IndexerERC1155 extends VibegraphIndexer{
 
    async onEventEmitted(event){

        await IndexerERC1155.modifyERC1155LedgerByEvent(event,this.mongoInterface)

    }
     
  

    static async modifyERC1155LedgerByEvent(event,mongoInterface){
        
        let eventName = event.event 

        if(!eventName){
            console.log('WARN: unknown event in ', event.transactionHash )
            return 
        }
        eventName = eventName.toLowerCase()
        

        let outputs = event.returnValues
 
        let contractAddress = ethers.utils.getAddress(event.address)
       

       
        if(eventName == 'transfersingle' ){
            let operator = ethers.utils.getAddress(outputs._operator )
            let from = ethers.utils.getAddress(outputs._from )
            let to = ethers.utils.getAddress(outputs._to )
            let tokenId = parseInt(outputs._id)
            let value = parseInt(outputs._value)

            await IndexerERC1155.removeERC1155TokenFromAccount( from ,contractAddress , tokenId , value ,mongoInterface )
            await IndexerERC1155.addERC1155TokenToAccount( to ,contractAddress , tokenId , value ,mongoInterface ) 
        }

        if(eventName == 'transferbatch' ){
            let operator = ethers.utils.getAddress(outputs._operator )
            let from = ethers.utils.getAddress(outputs._from )
            let to = ethers.utils.getAddress(outputs._to )
            let tokenIdArray =  (outputs._ids)
            let valueArray =  (outputs._values)

            for(let index in tokenIdArray){
                let tokenId = parseInt(tokenIdArray[index])
                let value = parseInt(valueArray[index])
                await IndexerERC1155.removeERC1155TokenFromAccount( from ,contractAddress , tokenId , value ,mongoInterface )
                await IndexerERC1155.addERC1155TokenToAccount( to ,contractAddress , tokenId , value ,mongoInterface ) 
            }

            
        }

       
    }


    static async addERC1155TokenToAccount( accountAddress, contractAddress, tokenId, value, mongoInterface){
        tokenId = parseInt(tokenId)
        value = parseInt(value)
        
        let existingAccount = await mongoInterface.findOne('erc1155_balances', {accountAddress: accountAddress, contractAddress: contractAddress }  )

        let tokenBalancesArray = {}   
        
        if(existingAccount && existingAccount.tokenBalances){
            tokenBalancesArray = Object.assign({}, existingAccount.tokenBalances )
        }

        if(tokenBalancesArray[tokenId]){
            tokenBalancesArray[tokenId] += value 
        }else{
            tokenBalancesArray[tokenId] = value
        }

        if(existingAccount){              
            await mongoInterface.updateOne('erc1155_balances', {accountAddress: accountAddress, contractAddress: contractAddress}, {tokenBalances: tokenBalancesArray} )
        }else{ 
            await mongoInterface.insertOne('erc1155_balances', {accountAddress: accountAddress, contractAddress: contractAddress, tokenBalances: tokenBalancesArray }   )
        }
    }


    static async removeERC1155TokenFromAccount( accountAddress, contractAddress, tokenId, value, mongoInterface ){
        tokenId = parseInt(tokenId)
        value = parseInt(value)

        let existingAccount = await mongoInterface.findOne('erc1155_balances', {accountAddress: accountAddress, contractAddress: contractAddress }  )

        let tokenBalancesArray = {}  

        if(existingAccount && existingAccount.tokenBalances){
            tokenBalancesArray = Object.assign({}, existingAccount.tokenBalances )
        }

        if(tokenBalancesArray[tokenId]){
            tokenBalancesArray[tokenId] -= value 
        }

        if(existingAccount){  
            await mongoInterface.updateOne('erc1155_balances', {accountAddress: accountAddress, contractAddress: contractAddress}, {tokenBalances: tokenBalancesArray} )
        }else{
            await mongoInterface.insertOne('erc1155_balances', {accountAddress: accountAddress, contractAddress: contractAddress, tokenBalances: tokenBalancesArray }   )
        }
    }


}