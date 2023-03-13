
 
import { ethers, BigNumber } from 'ethers'

import VibegraphIndexer from 'vibegraph/dist/indexers/VibegraphIndexer'
import { ContractEvent } from 'vibegraph'
import { ERC721Balance } from '../models/ERC721_balance'
import { ERC721Token } from '../models/ERC721_token'
import { ERC721Transfer } from '../models/ERC721_transfer'

module.exports = class IndexerERC721 extends VibegraphIndexer{
 
     

    async onEventEmitted(event:ContractEvent){

        await IndexerERC721.modifyERC721LedgerByEvent( event )

    }
  

  
    static async modifyERC721LedgerByEvent(event:ContractEvent){
        
         
        let eventName = event.name 

        let blockNumber = event.blockNumber
        let transactionHash = event.transactionHash
        let transactionIndex = event.transactionIndex 

        if(!eventName){
            console.log('WARN: unknown event in ', event.transactionHash )
            return 
        }
        eventName = eventName.toLowerCase()
        

        let outputs:any = event.args
 
        let contractAddress = ethers.utils.getAddress(event.address)
       

        if(eventName == 'transfer' ){
            let from = ethers.utils.getAddress(outputs['0'] )
            let to = ethers.utils.getAddress(outputs['1'] )
            let tokenId = parseInt(BigNumber.from(outputs['2']  ).toString()) 

          

            await IndexerERC721.recordTransfer( from, to ,contractAddress , tokenId ,blockNumber, transactionIndex  ) 
            
            await IndexerERC721.setOwnerOfERC721Token( to ,contractAddress , tokenId   ) 
             
            await IndexerERC721.removeERC721TokenFromAccount( from ,contractAddress , tokenId   )
            await IndexerERC721.addERC721TokenToAccount( to ,contractAddress , tokenId   ) 
        }

        if(eventName == 'transfersingle' ){
       


            let from = ethers.utils.getAddress(outputs['0'] )
            let to = ethers.utils.getAddress(outputs['1'] )
            let tokenId = parseInt(BigNumber.from(outputs['2']  ).toString()) 


            await IndexerERC721.recordTransfer( from, to ,contractAddress , tokenId ,blockNumber, transactionIndex   ) 
              
            await IndexerERC721.setOwnerOfERC721Token( to ,contractAddress , tokenId  ) 
            
            await IndexerERC721.removeERC721TokenFromAccount( from ,contractAddress , tokenId   )
            await IndexerERC721.addERC721TokenToAccount( to ,contractAddress , tokenId   ) 
        }
       
    }

    static async removeERC721TokenFromAccount( accountAddress:string ,contractAddress:string , tokenId:number   ){
     //   tokenId = parseInt(tokenId)

        let existingAccount = await ERC721Balance.findOne(  {accountAddress: accountAddress, contractAddress: contractAddress }  )

        if(existingAccount){
            let tokenIdsArray = existingAccount.tokenIds

            let index = tokenIdsArray.indexOf( tokenId );
            if (index > -1) {
                tokenIdsArray.splice(index, 1);
            }

            await ERC721Balance.updateOne( {accountAddress: accountAddress, contractAddress: contractAddress}, {tokenIds: tokenIdsArray, lastUpdatedAt: Date.now() } )
        }else{
            await ERC721Balance.create( {accountAddress: accountAddress, contractAddress: contractAddress, tokenIds: [] , lastUpdatedAt: Date.now() }   )
        }
    }

    static async addERC721TokenToAccount( accountAddress:string ,contractAddress:string , tokenId:number  ){
       // tokenId = parseInt(tokenId)
        
        let existingAccount = await ERC721Balance.findOne(  {accountAddress: accountAddress, contractAddress: contractAddress }  )

        if(existingAccount){
            let tokenIdsArray = existingAccount.tokenIds

            if(!tokenIdsArray.includes(tokenId)){
                tokenIdsArray.push(tokenId)
            }  

            await ERC721Balance.updateOne(  {accountAddress: accountAddress, contractAddress: contractAddress}, {tokenIds: tokenIdsArray , lastUpdatedAt: Date.now()  } )
        }else{
            await ERC721Balance.create(  {accountAddress: accountAddress, contractAddress: contractAddress, tokenIds: [tokenId] , lastUpdatedAt: Date.now()  }   )
        }
    }



    static async setOwnerOfERC721Token( accountAddress:string ,contractAddress:string , tokenId:number ){
        //tokenId = parseInt(tokenId)
       
        let existingEntry = await ERC721Token.findOne( {tokenId: tokenId, contractAddress: contractAddress }  )

        if(existingEntry){ 
            await ERC721Token.updateOne(  {tokenId: tokenId, contractAddress: contractAddress}, {accountAddress: accountAddress , lastUpdatedAt: Date.now()  } )
        }else{
            await ERC721Token.create( {tokenId: tokenId, contractAddress: contractAddress, accountAddress: accountAddress , lastUpdatedAt: Date.now()  }   )
        }
       
        
     
    }
 
    static async recordTransfer( from:string, to:string ,contractAddress:string , tokenId :number, blockNumber:number, transactionIndex:number ){
       // tokenId = parseInt(tokenId) 
         
        await ERC721Transfer.create(  {from:from, to:to, tokenId: tokenId, contractAddress: contractAddress,   blockNumber: blockNumber, transactionIndex: transactionIndex, createdAt: Date.now()  }   )
           
    }




}