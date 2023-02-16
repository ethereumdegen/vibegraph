 


import { ethers } from "ethers";

const networkIds = {
    'mainnet':1,
    'goerli':5,
    'kovan':42,
    'matic':137,
  }   


    export async function getNetworkId(provider:ethers.providers.Provider){
         
        const { chainId } = await provider.getNetwork()
        return chainId
    }


    export async function getBlockNumber(provider: ethers.providers.Provider){
        
        let blockNumber = await provider.getBlockNumber() 
 

        return blockNumber
    }
    
    export function getCustomContract(   contractAddress:string, contractABI:ethers.ContractInterface, provider?:ethers.providers.Provider)
    {  

        const contract = new ethers.Contract(
          contractAddress,
          contractABI,
          provider
        );

        return contract 

    }

    /*
    export function getContractDataForNetwork( netId:any ){
         

        let netName = getWeb3NetworkName(netId)

        if(netName){
            return contractData[netName].contracts
        }

        return undefined
    }*/

    export function getWeb3NetworkName(networkId:any){
         
  
        for (const [key, value] of Object.entries(networkIds)) {
          if(value == networkId){
            return key 
          }
        }
  
    
       console.error('Invalid network Id: ',networkId)
      return null
    }
 