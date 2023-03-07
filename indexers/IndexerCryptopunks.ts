

import VibegraphIndexer from './VibegraphIndexer'
import { ethers, BigNumber } from 'ethers'


module.exports =  class IndexerERC721 extends VibegraphIndexer {

    


    async onEventEmitted(event){

        await IndexerERC721.modifyCryptopunkLedgerByEvent(event,this.mongoInterface)

    }

   

  

    static async modifyCryptopunkLedgerByEvent(event,mongoInterface){
        
        let eventName = event.event 

        if(!eventName){
            console.log('WARN: unknown event in ', event.transactionHash )
            return 
        }
        eventName = eventName.toLowerCase()
        

        let outputs = event.returnValues
 
        let contractAddress = ethers.utils.getAddress(event.address)
       
        //event Assign(uint indexed punkIndex, uint value, address indexed fromAddress, address indexed toAddress);
       
        if(eventName == 'assign' ){
            
            let from = contractAddress
            let to = ethers.utils.getAddress(outputs['0'] )
            let tokenId = parseInt(outputs['1'])
            

            await IndexerERC721.removeCryptopunkFromAccount( from ,contractAddress , tokenId  ,mongoInterface )
            await IndexerERC721.addCryptopunkToAccount( to ,contractAddress , tokenId  ,mongoInterface) 
        }
        
        //event PunkBought(uint indexed punkIndex, uint value, address indexed fromAddress, address indexed toAddress);
       
        if(eventName == 'punkbought' ){
            let tokenId = parseInt(outputs['0'])
            let from = ethers.utils.getAddress(outputs['2'] )
            let to = ethers.utils.getAddress(outputs['3'] )
            

            await IndexerERC721.removeCryptopunkFromAccount( from ,contractAddress , tokenId  ,mongoInterface )
            await IndexerERC721.addCryptopunkToAccount( to ,contractAddress , tokenId  ,mongoInterface) 
        }

        //event PunkTransfer(address indexed from, address indexed to, uint256 punkIndex);
        if(eventName == 'punktransfer' ){
            let from = ethers.utils.getAddress(outputs['0'] )
            let to = ethers.utils.getAddress(outputs['1'] )
            let tokenId =  parseInt(outputs['2'])

            await IndexerERC721.removeCryptopunkFromAccount( from ,contractAddress , tokenId  ,mongoInterface )
            await IndexerERC721.addCryptopunkToAccount( to ,contractAddress , tokenId  ,mongoInterface ) 
        }
       
    }

    static async removeCryptopunkFromAccount( accountAddress ,contractAddress , tokenId ,mongoInterface ){

        tokenId = parseInt(tokenId)

        let existingAccount = await mongoInterface.findOne('erc721_balances', {accountAddress: accountAddress, contractAddress: contractAddress }  )

        if(existingAccount){
            let tokenIdsArray = existingAccount.tokenIds

            let index = tokenIdsArray.indexOf( tokenId );
            if (index > -1) {
                tokenIdsArray.splice(index, 1);
            }

            await mongoInterface.updateOne('erc721_balances', {accountAddress: accountAddress, contractAddress: contractAddress}, {tokenIds: tokenIdsArray} )
        }else{
            await mongoInterface.insertOne('erc721_balances', {accountAddress: accountAddress, contractAddress: contractAddress, tokenIds: [] }   )
        }
    }

    static async addCryptopunkToAccount( accountAddress ,contractAddress , tokenId  ,mongoInterface){
        tokenId = parseInt(tokenId)
        
        let existingAccount = await mongoInterface.findOne('erc721_balances', {accountAddress: accountAddress, contractAddress: contractAddress }  )

        if(existingAccount){
            let tokenIdsArray = existingAccount.tokenIds

            tokenIdsArray.push(tokenId)

            await mongoInterface.updateOne('erc721_balances', {accountAddress: accountAddress, contractAddress: contractAddress}, {tokenIds: tokenIdsArray} )
        }else{
            await mongoInterface.insertOne('erc721_balances', {accountAddress: accountAddress, contractAddress: contractAddress, tokenIds: [tokenId] }   )
        }
    }




}