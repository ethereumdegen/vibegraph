
 
const MongoInterface = require('./lib/mongo-interface')
const Web3Helper = require('./lib/web3-helper')

const web3utils = require('web3').utils

let envmode = process.env.NODE_ENV

/*
    indexingConfig:{
         
        contracts: [{ address: 0x.....  , startBlock: 0, type: 'ERC20'}],

        
        courseBlockGap: 1000, 
        fineBlockGap: 50,
        indexRate: 10000,
        updateBlockNumberRate:60000,
        logging: false 


    }

*/
let ERC721ABI = require( './config/contracts/SuperERC721ABI.json' )
let ERC20ABI = require( './config/contracts/SuperERC20ABI.json' ) 
let ERC1155ABI = require( './config/contracts/SuperERC1155ABI.json' )

var SAFE_EVENT_COUNT = 7000
var LOW_EVENT_COUNT = 1500


const IndexerERC1155 = require('./indexers/IndexerERC1155')
const IndexerERC721 = require('./indexers/IndexerERC721')
const IndexerERC20 = require('./indexers/IndexerERC20')  

var customIndexersArray = []

var onIndexCallback; 

var debug = false;

var baseIndexers = [
    { type:'erc20', abi: ERC20ABI ,  handler: IndexerERC20  },
    { type:'erc721', abi: ERC721ABI ,  handler: IndexerERC721  },
    { type:'erc1155', abi: ERC721ABI ,  handler: IndexerERC1155  } 
]
/*
var indexers = {
    'erc721': IndexerERC721,
    'erc20': IndexerERC20 
}*/

module.exports =  class VibeGraph {

    constructor(  )
    {
        
        this.currentContractIndex = 0 
       
        
    }

    async init( mongoOptions ){
        if(!mongoOptions.suffix){
            mongoOptions.suffix = 'development'
        }

        let dbName = 'vibegraph_'.concat(mongoOptions.suffix)

        if(mongoOptions.dbName){
            dbName = mongoOptions.dbName
        }

        this.mongoInterface = new MongoInterface( ) 
        await this.mongoInterface.init( dbName , mongoOptions )

        if(mongoOptions.databaseSetupCallback 
        && typeof mongoOptions.databaseSetupCallback == "function"){
            await mongoOptions.databaseSetupCallback(this.mongoInterface)
        }
        
        
    }


    getIndexerForContractType(contractType){
        
        contractType = contractType.toLowerCase()

        

        let allIndexers = baseIndexers.concat( customIndexersArray )

         
        for(let indexer of allIndexers){
            if(contractType == indexer.type.toLowerCase()){
                return indexer.handler
            }
        }
        
        console.error('WARNING: falling back to IndexerERC20')
        //fallback 
        return IndexerERC20;

    }

    
     getABIFromType(type){
        type = type.toLowerCase()


        let allIndexers = baseIndexers.concat( customIndexersArray )

         
        for(let indexer of allIndexers){
            if(type == indexer.type.toLowerCase()){
                return indexer.abi
            }
        }
        
 
        //fallback 
        console.error('WARNING: falling back to ERC20ABI')
        return ERC20ABI;
    }
    

    async startIndexing( web3, indexingConfig ){

        this.web3 = web3
        this.indexingConfig = indexingConfig


        

        this.contractsArray = []

        for(let contract of indexingConfig.contracts){

            if(!contract.startBlock) contract.startBlock = 0;
            if(!contract.type) contract.type = 'ERC20';

            contract.address = web3utils.toChecksumAddress(contract.address)

            this.contractsArray.push(contract)



            ///init mongo records

            let existingState = await this.mongoInterface.findOne('contract_state', {contractAddress: contract.address})
            if(!existingState){    

               let newState = { contractAddress: contract.address, 
                currentIndexingBlock: contract.startBlock, 
                type: contract.type,
                stepSizeScaleFactor: 1,
                synced: false,
                lastUpdated: Date.now()
            
            }
               await this.mongoInterface.insertOne('contract_state', newState)
            } 


        }

       

       
        if(indexingConfig.customIndexers){
            customIndexersArray = indexingConfig.customIndexers
        }

        if(!indexingConfig.indexRate){
            indexingConfig.indexRate = 10*1000;
        }

        if(indexingConfig.debug){
            debug = true 
        }

        if(indexingConfig.onIndexCallback){
           onIndexCallback = indexingConfig.onIndexCallback
        }

        if(!indexingConfig.updateBlockNumberRate){
            indexingConfig.updateBlockNumberRate = 60*1000;
        }
 

        if(!indexingConfig.courseBlockGap){
            indexingConfig.courseBlockGap =  1000;
        }

        if(!indexingConfig.fineBlockGap){
            indexingConfig.fineBlockGap = 50;
        }
 

        if(indexingConfig.safeEventCount){
            SAFE_EVENT_COUNT = parseInt(indexingConfig.safeEventCount)
        }

        if(indexingConfig.subscribe){
            


            this.subscribeToEvents( this.contractsArray )
           
        }
    

        //this.currentEventFilterBlock = indexingConfig.startBlock;

        //this.maxBlockNumber = await Web3Helper.getBlockNumber(this.web3)
        await this.updateBlockNumber()

        this.ledgerContractIndex = 0;

        this.updateLedger(  )

        if(this.maxBlockNumber == null){
            console.error('Cannot fetch the blocknumber: Stopping Process')
            return 
        }
        
        this.activelyIndexing = true;
       
        this.indexData()



        //this.indexUpdater = setInterval(this.indexData.bind(this), indexingConfig.indexRate)

        this.blockNumberUpdater = setInterval(this.updateBlockNumber.bind(this), indexingConfig.updateBlockNumberRate)
    }


    incrementContractsCount( ){
 

        this.currentContractIndex = this.currentContractIndex +1
        
        if(this.currentContractIndex >= this.contractsArray.length){
            this.currentContractIndex  = 0  
        }

        /*if(this.indexingConfig.logging){
           console.log('incrementContractsCount',this.currentContractIndex)
        }*/
     

    }

    

    subscribeToEvents(  contractsArray /* contractAddress, contractABI*/ ){

        

        let knownEventTokens = []

        for(let contractData of contractsArray){ 

            let contractABI = this.getABIFromType(contractData.type) 
            let contractAddress = contractData.address

            let myContract =  new this.web3.eth.Contract( contractABI , contractAddress   )

            let contractEventTokens = myContract.options.jsonInterface.filter((token) => {
                return token.type === 'event';
              });
            
            knownEventTokens = knownEventTokens.concat(contractEventTokens)

            //this.subscribeToEvents( contractData.address, contractABI )
        }
         
      
        let contractAddresses = contractsArray.map(contract => contract.address)
        
        
        let options = { 
            address: contractAddresses     //Only get events from specific addresses 
        };

        console.log('subscribing to logs ', options)
        
        let subscription = this.web3.eth.subscribe('logs', options,(err,event) => {
            if (err) console.error(err)
             
        });

       
        subscription.on('data', async (rawEvent) =>  {

             
            let matchingEventToken = null


            if(debug){
                console.log(' knownEventTokens  ', knownEventTokens)
            }

            for(let eventToken of knownEventTokens){
                if( rawEvent.topics[0] ==  eventToken.signature ){
                    matchingEventToken = eventToken 
                    break 
                }
            }

            if(matchingEventToken){

               
                const outputs = this.web3.eth.abi.decodeLog(
                    matchingEventToken.inputs,
                    rawEvent.data,
                    rawEvent.topics.slice(1)
                  ) 
     

                 rawEvent.event = matchingEventToken.name 
                 rawEvent.returnValues = outputs 

                 
    
                 let inserted = await this.mongoInterface.insertOne('event_list', rawEvent)   
                    
                 if(debug){
                    console.log('inserted new event', rawEvent , inserted ) 
                 }
                

            }else{
                console.log( 'no match found for ', rawEvent) 
            }

            
        } )

        subscription.on('changed', changed => console.log(changed))
        subscription.on('error', err => { throw err })
        subscription.on('connected', nr => console.log(nr)) 

    }

    async updateLedger(){
        
        let contractData = this.contractsArray[this.ledgerContractIndex]
        let contractAddress =  contractData.address 

        let contractType = await this.readParameterForContract(contractAddress, 'type')
 

        let newEventsArray = await this.mongoInterface.findAllWithLimit('event_list',{address: contractAddress, hasAffectedLedger: null }, 5000)

        if(this.indexingConfig.logging && newEventsArray.length > 0){
            console.log('update ledger: ', newEventsArray.length)
          }

        for(let event of newEventsArray){

            let modify = await this.modifyLedgerForEventType(event, contractType)

            
            await this.mongoInterface.updateOne('event_list', {_id: event._id }, {hasAffectedLedger: true })
        }

        if(onIndexCallback && newEventsArray && newEventsArray.length > 0){
            onIndexCallback()
        }

        this.ledgerContractIndex = this.ledgerContractIndex +1
        if(this.ledgerContractIndex >= this.contractsArray.length){
            this.ledgerContractIndex=0;
        } 

        setTimeout( this.updateLedger.bind(this)  , 1000 );
    }

    stopIndexing(){
        //clearInterval(this.indexUpdater)
        //clearInterval(this.blockNumberUpdater)

        this.activelyIndexing = false
    }


   

    async resetState(){
        let deleted = await this.mongoInterface.deleteMany('contract_state', {})
    }

    async dropDatabase(){
        let deleted = await this.mongoInterface.dropDatabase( )
    }


    async deleteDataForContract(contractAddress){
        contractAddress = web3utils.toChecksumAddress(contractAddress)

        await this.mongoInterface.deleteMany('contract_state', {contractAddress: contractAddress})
        await this.mongoInterface.deleteMany('event_data', {contractAddress: contractAddress})
        await this.mongoInterface.deleteMany('event_list', {address: contractAddress})
    }

    async deleteIndexedData(){
        await this.mongoInterface.deleteMany('erc20_balances' )
        await this.mongoInterface.deleteMany('erc20_approval' )
        await this.mongoInterface.deleteMany('erc20_transferred' )
        await this.mongoInterface.deleteMany('erc721_balances' )
        await this.mongoInterface.deleteMany('erc1155_balances' )
        await this.mongoInterface.deleteMany('erc20_burned' )
        await this.mongoInterface.deleteMany('offchain_signatures' )
        await this.mongoInterface.deleteMany('nft_sale' )

        await this.mongoInterface.updateMany('event_list', {  }, {hasAffectedLedger: null })
    }


    async updateBlockNumber(){

        try{ 
            this.maxBlockNumber = await Web3Helper.getBlockNumber(this.web3)
        }catch(e){

            console.error(e)
        }

    }

    async setParameterForContract(contractAddress, paramName, newValue){
        await this.mongoInterface.updateOne('contract_state', {contractAddress:contractAddress}, {[`${paramName}`]:newValue})
        
    }

    async readParameterForContract(contractAddress, paramName){
        let contractState = await this.mongoInterface.findOne('contract_state', {contractAddress:contractAddress})

        return contractState[paramName]
    }

    async getScaledCourseBlockGap(contractAddress){
        let stepSizeScaleFactor = await this.readParameterForContract( contractAddress, 'stepSizeScaleFactor'  )

        return parseInt( this.indexingConfig.courseBlockGap / stepSizeScaleFactor )
    }

    async indexData(){    

      //  let tinyfoxState = await this.mongoInterface.findOne('contract_state', {})

        

        let contractData = this.contractsArray[this.currentContractIndex]
        let contractAddress = contractData.address

        var madeApiRequest = false;

        let cIndexingBlock =  await this.readParameterForContract(contractAddress , 'currentIndexingBlock')   //parseInt(this.currentIndexingBlock) 

        let contractType =  await this.readParameterForContract(contractAddress , 'type')   //parseInt(this.currentIndexingBlock) 

        let fineBlockGap = this.indexingConfig.fineBlockGap

        if(this.indexingConfig.logging){
            console.log('index data starting at ', cIndexingBlock, contractAddress)
        }
        
        let scaledCourseBlockGap = await this.getScaledCourseBlockGap( contractAddress )


        if(!this.maxBlockNumber){
            console.log('Warning: no maxBlockNumber ' )
            return 
        }
       
        if(cIndexingBlock + scaledCourseBlockGap < this.maxBlockNumber){
            
            let contractABI = this.getABIFromType(contractType) 
            await this.indexContractData( contractAddress, contractABI, cIndexingBlock, scaledCourseBlockGap  )
            
            
    
             await this.setParameterForContract(contractAddress, 'synced', false)
             await this.setParameterForContract(contractAddress, 'lastUpdated', Date.now())
             
             madeApiRequest = true;

        }else if( cIndexingBlock + fineBlockGap < this.maxBlockNumber ){

            let remainingBlockGap = parseInt(this.maxBlockNumber - cIndexingBlock -  1)


            let contractABI = this.getABIFromType(contractType) 
            await this.indexContractData( contractAddress, contractABI, cIndexingBlock, remainingBlockGap  )
         
          

            await this.setParameterForContract(contractAddress, 'synced', true)
            await this.setParameterForContract(contractAddress, 'lastUpdated', Date.now())
             
            madeApiRequest = true;

            if(this.indexingConfig.logging){
                console.log('resynchronizing: ', cIndexingBlock, contractAddress)
            }
     
        }else{

            if(this.indexingConfig.logging){
                console.log('synchronized: ', cIndexingBlock, contractAddress)
            }
            
            madeApiRequest = false;

        }
        this.incrementContractsCount(  )

        let delayToNextIndex = this.indexingConfig.indexRate;
        
        if(this.activelyIndexing){
            if(madeApiRequest){
                setTimeout(this.indexData.bind(this),delayToNextIndex);
            }else{
                setTimeout(this.indexData.bind(this),100);
            }
            
        }
        



    }

    //fix me , save to mongo 
    async increaseStepSizeScaleFactorForContract(contractAddress){

        let oldFactor = await this.readParameterForContract(contractAddress, 'stepSizeScaleFactor')
        let newFactor  = parseInt(oldFactor * 2)

        await this.setParameterForContract(contractAddress, 'stepSizeScaleFactor', newFactor)

        if(this.indexingConfig.logging){
            console.log('ScaleFactor ',contractAddress,newFactor)
        }

    }

    async decreaseStepSizeScaleFactorForContract(contractAddress){
        
        let oldFactor = await this.readParameterForContract(contractAddress, 'stepSizeScaleFactor')
        let newFactor  = Math.max(  parseInt(oldFactor / 2) , 1)

       // this.stepSizeScaleFactor  = Math.max(  parseInt(this.stepSizeScaleFactor / 2) , 1)

        await this.setParameterForContract(contractAddress, 'stepSizeScaleFactor', newFactor)

        if(this.indexingConfig.logging){
            console.log('ScaleFactor ',contractAddress,newFactor)
        }
    }
    

    async incrementCurrentBlockNumberForContract(contractAddress, startBlock, blockGap){

        let newBlockNumber = startBlock + parseInt(blockGap)

        await this.setParameterForContract(contractAddress, 'currentIndexingBlock', newBlockNumber)
       
         if(this.indexingConfig.logging){
          console.log('currentIndexingBlock ',contractAddress , newBlockNumber)
        } 


    }

    async indexContractData(  contractAddress, contractABI, startBlock, blockGap ){



        let contract = Web3Helper.getCustomContract( contractABI ,contractAddress, this.web3  )
        
        var insertedMany; 
          
         let endBlock = startBlock + Math.max(blockGap - 1 , 1)     

        try{
            var results = await this.getContractEvents( contract, "allEvents", startBlock, endBlock )
        }catch(resultsError){
            console.error('Request Error: ', results)

            
        }
        //need better error catch

            if(this.indexingConfig.logging){
                 

                if(results && results.events && results.events.length == 0){
                    console.log('zero results', results)
                }

                if(results && results.events && results.events.length > SAFE_EVENT_COUNT){
                    console.log('excessive results', results)
                } 
                 
            }

          

            if(!results || results.events.length > SAFE_EVENT_COUNT  ){

                    await this.increaseStepSizeScaleFactorForContract( contractAddress  )
                  
                     

            }else{

                if(this.indexingConfig.logging){
                    console.log('saved event data ', results.startBlock, ":", results.endBlock, ' Count: ' , results.events.length)
                }

                //save in mongo  
                let existingEventData = await this.mongoInterface.findOne('event_data', {contractAddress: results.contractAddress, startBlock: results.startBlock })
                if(!existingEventData){

                    //reduce storage size 
                    let eventDataToStore = {
                        contractAddress: results.contractAddress, 
                        startBlock: results.startBlock ,
                        endBlock: results.endBlock,
                        eventsCount: results.events.length 
                        //and some other stuff ?
                    }

                    await this.mongoInterface.insertOne('event_data',  eventDataToStore    )
  
                   

                    //our unique index ensures that we will not double count these 
                    if(results.events && results.events.length > 0){

                        

                        let eventsToLog = results.events.filter(evt => ( evt.event != null )  )

                        if(eventsToLog && eventsToLog.length > 0 ){
                            try{ 
                                let options = {ordered: false}
                                 insertedMany = await this.mongoInterface.insertMany('event_list', eventsToLog /* results.events*/, options  )
                            }catch(e){
                                console.error(e)
                            }
                        }

                        let erroredEvents = results.events.filter(evt => ( !evt.event )  )
                        if(erroredEvents && erroredEvents.length >0){
                            console.log('Could not insert events: ', JSON.stringify(erroredEvents))
                        }


                        
                    }

 
                    
                } 

                


 

                await this.incrementCurrentBlockNumberForContract(contractAddress, startBlock, blockGap);


                if(results.events.length < LOW_EVENT_COUNT){

                    await this.decreaseStepSizeScaleFactorForContract( contractAddress  )
                  
                }
                
            }


    }


   
    
   


    async getContractEvents(contract, eventName, startBlock, endBlock  ){

        
            return new Promise ((resolve, reject) => {
                contract.getPastEvents(eventName, { fromBlock: startBlock, toBlock: endBlock }) 
                .then(function(events){
                    resolve({contractAddress: contract.options.address , startBlock: startBlock, endBlock: endBlock, events:events}) // same results as the optional callback above
                }).catch(function(error){reject(error)});
            })
         
 

    }

 

    async modifyLedgerForEventType(event, contractType){
        let mongoInterface = this.mongoInterface
        contractType = contractType.toLowerCase()

        let indexer = this.getIndexerForContractType(contractType)



        let eventName = event.event 
        if(!eventName){
 
            console.log('WARN: unknown event in ', event.transactionHash )
            return {success:true } 
        }

        try{ 
            let result = await indexer.modifyLedgerByEvent(event,mongoInterface)

            return {success:true, result: result} 
        }catch(e){
            console.error(e)
            return {success:false } 
        }
      
        

    }

    








 

}
 


 