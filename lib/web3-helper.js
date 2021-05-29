 

let networkIds = {
    'mainnet':1,
    'goerli':5,
    'kovan':42,
    'matic':137,
  }


  module.exports =  class Web3Helper{

   


    static async getNetworkId(web3){
        return await web3.eth.net.getId() 
    }


    static async getBlockNumber(web3){
        return await web3.eth.getBlockNumber() 
    }
    
    static getCustomContract(  contractABI, contractAddress, web3)
    { 
    var contract = new web3.eth.Contract(contractABI,contractAddress)

    return contract;
    }


    static getContractDataForNetwork(   netId ){
         

        let netName = Web3Helper.getWeb3NetworkName(netId)

        if(netName){
            return contractData[netName].contracts
        }

        return undefined
    }

    static getWeb3NetworkName(networkId){
         
  
        for (const [key, value] of Object.entries(networkIds)) {
          if(value == networkId){
            return key 
          }
        }
  
    
       console.error('Invalid network Id: ',networkId)
      return null
    }

    
}