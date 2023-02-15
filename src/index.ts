 


//const web3utils = require('web3').utils


//var Web3 = require('web3')


import { ethers } from "ethers";


import mongoose from 'mongoose'

import {getCustomContract} from './lib/web3-helper'

//const MongoInterface = require('./lib/mongo-interface')
//const Web3Helper = require('./lib/web3-helper')


import SingletonLoopMethod from './lib/singleton-loop-method'
//let envmode = process.env.NODE_ENV

import VibegraphIndexer from '../indexers/VibegraphIndexer' 

import {ContractState, IContractState} from '../models/contract_state'

/*
 TODO: should convert this to typescript with well defined types 
*/

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

var SAFE_EVENT_COUNT = 7000
var LOW_EVENT_COUNT = 1500


/*
var indexers = {
    'erc721': IndexerERC721,
    'erc20': IndexerERC20 
}*/


export type VibegraphConfig = DatabaseConfig & IndexingConfig
export interface DatabaseConfig {
    dbName:string 
    mongoConnectURI?:string 
    databaseSetupCallback?:Function 
}

 

export interface IndexingConfig {
    web3ProviderUri:string 
    indexRate:number 
    updateBlockNumberRate:number 
    courseBlockGap:number 
    fineBlockGap:number 
    subscribe?:boolean

    contracts: ContractConfig [] 
    customIndexers: CustomIndexer[],
    safeEventCount?: number 

    onIndexCallback?: Function 

} 

export interface ContractConfig {
    address:string ,
    startBlock: number ,
    type: string // match type of the custom indexer 

}

export interface CustomIndexer {
    abi: ethers.ContractInterface,
    handler: typeof VibegraphIndexer, 
    type:string 
}


 

export default class VibeGraph {

    currentContractIndex:number = 0 
    rpcProvider?:ethers.providers.JsonRpcProvider


    onIndexCallback?:Function

    blocknumberUpdatedAt?:number 



    contractsArray:ContractConfig[] = []
    customIndexersArray:CustomIndexer[] = []  


    indexingLoop?:any 
    subscribe:boolean = false
    indexRate?:number
    updateBlockNumberRate?:number 
    maxBlockNumber?:number 

    fineBlockGap?:number 

    logLevel?:string = 'debug'

 /*
    var customIndexersArray = []

    var onIndexCallback; 

    var debug = false;

    var blocknumberUpdatedAt;
*/


    constructor(  )
    {
        
     ///   this.currentContractIndex = 0 
       
        
    }

    async init( initConfig:VibegraphConfig ){
        if(!initConfig.dbName){
            throw new Error("Vibegraph init: Must specify a dbName in config")
        }

        let dbName = initConfig.dbName ? initConfig.dbName : 'vibegraph'
        let mongoConnectURI = initConfig.mongoConnectURI ? initConfig.mongoConnectURI : 'localhost:27017'

        mongoose.pluralize(null);
        const mongooseConnection = await mongoose.connect(`mongodb://${mongoConnectURI}/${dbName}`);
        //this.mongoInterface = new MongoInterface( ) 
        //await this.mongoInterface.init( dbName , mongoConnectURI )

        if(initConfig.databaseSetupCallback 
        && typeof initConfig.databaseSetupCallback == "function"){
            await initConfig.databaseSetupCallback( mongooseConnection )
        } 
      
       // await Promise.all( baseIndexers.map( x => x.handler.initialize() )  )


        let indexingConfig = parseIndexingConfig( initConfig )

        await this.prepIndexing( indexingConfig ) 
        
      //  this.indexingConfig = indexingConfig

        this.subscribe = !!indexingConfig.subscribe 
        this.indexRate = indexingConfig.indexRate
        this.updateBlockNumberRate = indexingConfig.updateBlockNumberRate
            
        this.fineBlockGap = indexingConfig.fineBlockGap
    }




    async prepIndexing( indexingConfig: IndexingConfig ){

      //  this.indexingConfig = this.parseIndexingConfig( indexingConfig ) 

 
        if(!indexingConfig || !indexingConfig.web3ProviderUri){
            throw new Error("Vibegraph prepIndexing: Must specify a web3ProviderUri in config")
        }

        this.rpcProvider = new ethers.providers.JsonRpcProvider( indexingConfig.web3ProviderUri );
        //this.web3 = new Web3( indexingConfig.web3ProviderUri )


        this.contractsArray = await this.initializeContractsArray(  indexingConfig.contracts  )
 

        if(indexingConfig.customIndexers){
            this.customIndexersArray = indexingConfig.customIndexers
        } 


        if(indexingConfig.safeEventCount){
            SAFE_EVENT_COUNT = parseInt(indexingConfig.safeEventCount.toString())
        } 
 

        if(indexingConfig.onIndexCallback){
           this.onIndexCallback = indexingConfig.onIndexCallback
        }
  
           
        
    }
 

    async startIndexing(   ){
 
        if(this.subscribe){             
            this.subscribeToEvents( )           
        } 
  
        this.indexingLoop = new SingletonLoopMethod(  this.indexData.bind(this) )
        this.indexingLoop.start( this.indexRate )

        let updateLedgerLoop = new SingletonLoopMethod(  this.updateLedger.bind(this) )
        updateLedgerLoop.start( 1000 )
 
    }




    getIndexerForContractType(contractType:string){
        
        contractType = contractType.toLowerCase()

        

       // let allIndexers = baseIndexers.concat( customIndexersArray )

         
        for(let indexer of this.customIndexersArray){
            if(contractType == indexer.type.toLowerCase()){
                return indexer.handler
            }
        }   


        throw new Error("Vibegraph: No indexer registered for type ".concat( contractType  ))
        
       

    }

    
     getABIFromType(type:string){
        type = type.toLowerCase()


        //let allIndexers = baseIndexers.concat( customIndexersArray )

         
        for(let indexer of this.customIndexersArray){
            if(type == indexer.type.toLowerCase()){
                return indexer.abi
            }
        }
        
        throw new Error("Vibegraph: No registered ABI for type ".concat(type))
  
    }
    






    async initializeContractsArray(  contractsConfigArray:ContractConfig[]    ){

        let outputArray = []

        for(let contract of contractsConfigArray){

            if(!contract.startBlock) contract.startBlock = 0;
            if(!contract.type) throw new Error("Vibegraph: Missing contract type specification ");

            contract.address = ethers.utils.getAddress(contract.address)

            outputArray.push(contract)



            ///init contract state record 
            let existingState = await ContractState.findOne(  {contractAddress: contract.address} )
           
            if(!existingState){        
               let newState:Omit<IContractState,'_id'> = { 
                contractAddress: contract.address, 
                currentIndexingBlock: contract.startBlock, 
                type: contract.type,
                stepSizeScaleFactor: 1,
                synced: false,
                lastUpdated: Date.now()
                 }   

            const created = await ContractState.create( newState )
             
            } 


        }

        return outputArray

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

    

    subscribeToEvents(   ){

        let contractsArray = this.contractsArray  

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


            if(this.logLevel=='debug'){
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
                    
                 if(this.logLevel=='debug'){
                    console.log('inserted new event', rawEvent , inserted ) 
                 }
                

            }else{
                console.log( 'no match found for ', rawEvent) 
            }

            
        } )

        subscription.on('changed', (changed:any) => console.log(changed))
        subscription.on('error', (err:any) => { throw err })
        subscription.on('connected', (nr:any) => console.log(nr)) 

    }

    async updateLedger(){

        

        if(typeof this.ledgerContractIndex == 'undefined'){
            this.ledgerContractIndex = 0
        }
        
        let contractData = this.contractsArray[this.ledgerContractIndex]
        let contractAddress =  contractData.address 

        let contractType = await this.readParameterForContract(contractAddress, 'type')
 

        let newEventsArray = await this.mongoInterface.findAllWithLimit('event_list',{address: contractAddress, hasAffectedLedger: null }, 5000)

        if(this.logLevel=='debug' && newEventsArray.length > 0){
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

        //setTimeout( this.updateLedger.bind(this)  , 1000 );

        return true 
    }

    stopIndexing(){
      

        if(this.indexingLoop){
            this.indexingLoop.stop() 
        }else{
            console.error("no indexing loop to stop!")
        }
        
    }


   

    async resetState(){
        let deleted = await this.mongoInterface.deleteMany('contract_state', {})
    }

    async dropDatabase(){
        let deleted = await this.mongoInterface.dropDatabase( )
    }


    async deleteDataForContract(contractAddress:string){
        contractAddress = ethers.utils.getAddress(contractAddress)

        await this.mongoInterface.deleteMany('contract_state', {contractAddress: contractAddress})
        await this.mongoInterface.deleteMany('event_data', {contractAddress: contractAddress})
        await this.mongoInterface.deleteMany('event_list', {address: contractAddress})
    }

    async deleteIndexedData(){
      /*  await this.mongoInterface.deleteMany('erc20_balances' )
        await this.mongoInterface.deleteMany('erc20_approval' )
        await this.mongoInterface.deleteMany('erc20_transferred' )
        await this.mongoInterface.deleteMany('erc721_balances' )
        await this.mongoInterface.deleteMany('erc1155_balances' )
        await this.mongoInterface.deleteMany('erc20_burned' )
        await this.mongoInterface.deleteMany('offchain_signatures' )
        await this.mongoInterface.deleteMany('nft_sale' )*/

        await this.mongoInterface.updateMany('event_list', {  }, {hasAffectedLedger: null })
    }


    blockNumberIsStale(){

        let updateBlockNumberRate = this.updateBlockNumberRate ? this.updateBlockNumberRate : 60*1000

        return !blocknumberUpdatedAt ||  ( Date.now() - blocknumberUpdatedAt )  > updateBlockNumberRate
    }


    async fetchLatestBlockNumber(){
         
        try{ 
            let latestBlockNumber = await Web3Helper.getBlockNumber(this.web3)

            

            return latestBlockNumber
        }catch(e){
            console.error(e)
        }

        return undefined 
    }

    async setParameterForContract(contractAddress:string, paramName:any, newValue:any){
        await this.mongoInterface.updateOne('contract_state', {contractAddress:contractAddress}, {[`${paramName}`]:newValue})
        
    }

    async readParameterForContract(contractAddress:string, paramName:any){
        let contractState = await this.mongoInterface.findOne('contract_state', {contractAddress:contractAddress})

        return contractState[paramName]
    }

    async getScaledCourseBlockGap(contractAddress:string){
        let stepSizeScaleFactor = await this.readParameterForContract( contractAddress, 'stepSizeScaleFactor'  )

        return parseInt( this.indexingConfig.courseBlockGap / stepSizeScaleFactor )
    }

    async indexData(){    
        
        if(!this.maxBlockNumber || this.blockNumberIsStale){
            this.maxBlockNumber = await this.fetchLatestBlockNumber( )
            this.blocknumberUpdatedAt = Date.now(); 
        }

        if(!this.maxBlockNumber){
            throw new Error("No max block number! cannot index data")
        }
        

        let contractData = this.contractsArray[this.currentContractIndex]
        let contractAddress = contractData.address

        var madeApiRequest = false;

        let cIndexingBlock =  await this.readParameterForContract(contractAddress , 'currentIndexingBlock')   //parseInt(this.currentIndexingBlock) 

        let contractType =  await this.readParameterForContract(contractAddress , 'type')   //parseInt(this.currentIndexingBlock) 

        let fineBlockGap = this.fineBlockGap

        if(this.logLevel=='debug'){
            console.log('index data starting at ', cIndexingBlock, contractAddress)
        }
        
        let scaledCourseBlockGap = await this.getScaledCourseBlockGap( contractAddress )


       
        if(cIndexingBlock + scaledCourseBlockGap < this.maxBlockNumber){
            
            let contractABI = this.getABIFromType(contractType)
            let rpcProvider = this.rpcProvider 

            await this.indexContractData( contractAddress, contractABI, rpcProvider, cIndexingBlock, scaledCourseBlockGap  )
            
            
    
             await this.setParameterForContract(contractAddress, 'synced', false)
             await this.setParameterForContract(contractAddress, 'lastUpdated', Date.now())
             
             madeApiRequest = true;

        }else if( cIndexingBlock + fineBlockGap < this.maxBlockNumber ){

            let remainingBlockGap = parseInt(this.maxBlockNumber - cIndexingBlock -  1)


            let contractABI = this.getABIFromType(contractType) 
            let rpcProvider = this.rpcProvider 
            await this.indexContractData( contractAddress, contractABI, rpcProvider, cIndexingBlock, remainingBlockGap  )
         
          

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


        return {
            madeApiRequest,
            cIndexingBlock,
            contractAddress

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

    async decreaseStepSizeScaleFactorForContract(contractAddress:string){
        
        let oldFactor = await this.readParameterForContract(contractAddress, 'stepSizeScaleFactor')
        let newFactor  = Math.max(  parseInt(oldFactor / 2) , 1)

       // this.stepSizeScaleFactor  = Math.max(  parseInt(this.stepSizeScaleFactor / 2) , 1)

        await this.setParameterForContract(contractAddress, 'stepSizeScaleFactor', newFactor)

        if(this.indexingConfig.logging){
            console.log('ScaleFactor ',contractAddress,newFactor)
        }
    }
    

    async incrementCurrentBlockNumberForContract(contractAddress:string, startBlock:number, blockGap:number){

        let newBlockNumber = startBlock + parseInt(blockGap.toString())

        await this.setParameterForContract(contractAddress, 'currentIndexingBlock', newBlockNumber)
       
         if(this.logLevel=='debug'){
          console.log('currentIndexingBlock ',contractAddress , newBlockNumber)
        } 


    }

    async indexContractData(  contractAddress:string, contractABI:ethers.ContractInterface, rpcProvider: ethers.providers.Provider, startBlock:number, blockGap:number ){



        let contract = getCustomContract( contractAddress, contractABI, rpcProvider  )
        
        var insertedMany; 
          
         let endBlock = startBlock + Math.max(blockGap - 1 , 1)     

        try{
            var results = await this.getContractEvents( contract, "allEvents", startBlock, endBlock )
        }catch(resultsError){
            console.error('Request Error: ', results)

            
        }
        //need better error catch

            if(this.logLevel=='debug'){
                 

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

                if(this.logLevel=='debug'){
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


   
    
   


    async getContractEvents(contract:any, eventName:string, startBlock:number, endBlock:number ){

        
            return new Promise ((resolve, reject) => {
                contract.getPastEvents(eventName, { fromBlock: startBlock, toBlock: endBlock }) 
                .then(function(events){
                    resolve({contractAddress: contract.options.address , startBlock: startBlock, endBlock: endBlock, events:events}) // same results as the optional callback above
                }).catch(function(error){reject(error)});
            })
         
 

    }

 

    async modifyLedgerForEventType(event:any, contractType:string){
       // let mongoInterface = this.mongoInterface


        contractType = contractType.toLowerCase()

        let indexer = this.getIndexerForContractType(contractType)



        let eventName = event.event 
        if(!eventName){
 
            console.log('WARN: unknown event in ', event.transactionHash )
            return {success:true } 
        }

        try{
            //@ts-ignore
            let result = await indexer.onEventEmitted(event)

            return {success:true, result: result} 
        }catch(e){
            console.error(e)
            return {success:false } 
        }
      
        

    }

    








 

}
 


function parseIndexingConfig( config:IndexingConfig ){

    let output = config 

    if(!output.indexRate){
        output.indexRate = 10*1000;
    }

    if(!output.updateBlockNumberRate){
        output.updateBlockNumberRate = 60*1000;
    }


    if(!output.courseBlockGap){
        output.courseBlockGap =  1000;
    }

    if(!output.fineBlockGap){
        output.fineBlockGap = 50;
    }


    return output 
}



 