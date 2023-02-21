 

 

import { ethers } from "ethers";


import mongoose from 'mongoose'

import {getBlockNumber, getCustomContract} from './lib/web3-helper'

//const MongoInterface = require('./lib/mongo-interface')
//const Web3Helper = require('./lib/web3-helper')


import SingletonLoopMethod from './lib/singleton-loop-method'
//let envmode = process.env.NODE_ENV

import VibegraphIndexer from '../indexers/VibegraphIndexer' 

import {ContractState, IContractState} from '../models/contract_state'

import {EventList, IEventList} from '../models/event_list'
import {EventData, IEventData} from '../models/event_data'
import { Interface } from "ethers/lib/utils";

 

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
    logLevel?:string 

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

const DEFAULT_FINE_BLOCK_GAP = 20
const DEFAULT_COURSE_BLOCK_GAP = 8000
 


export interface ContractEventRaw{
    blockNumber:number 
    blockHash:string 
    transactionIndex:number 
    address:string 
    data:string 
    topics:string[]
    transactionHash: string 
    logIndex:number
  }

export interface ContractEvent{
    name:string 
    signature: string 
    args: Object 

    address:string 
    data:string 
    transactionHash:string 
    blockNumber:number 
    blockHash:string

    logIndex:number

}
export default class VibeGraph {

    currentContractIndex:number = 0 
    rpcProvider?:ethers.providers.JsonRpcProvider | ethers.providers.WebSocketProvider


    onIndexCallback?:Function

    blocknumberUpdatedAt?:number 

    ledgerContractIndex?:number 

    contractsArray:ContractConfig[] = []
    customIndexersArray:CustomIndexer[] = []  


    indexingLoop?:any 
    subscribe:boolean = false
    indexRate?:number
    updateBlockNumberRate?:number 
    maxBlockNumber?:number 

    fineBlockGap?:number 
    courseBlockGap?:number

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
        mongoose.set('strictQuery', true);
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
            
        this.fineBlockGap = indexingConfig.fineBlockGap ? indexingConfig.fineBlockGap : DEFAULT_FINE_BLOCK_GAP
        this.courseBlockGap = indexingConfig.courseBlockGap ? indexingConfig.courseBlockGap : DEFAULT_COURSE_BLOCK_GAP

        this.logLevel = indexingConfig.logLevel
        
    }




    async prepIndexing( indexingConfig: IndexingConfig ){

      //  this.indexingConfig = this.parseIndexingConfig( indexingConfig ) 

 
        if(!indexingConfig || !indexingConfig.web3ProviderUri){
            throw new Error("Vibegraph prepIndexing: Must specify a web3ProviderUri in config")
        }

       if(indexingConfig.subscribe){
        this.rpcProvider = new ethers.providers.WebSocketProvider( indexingConfig.web3ProviderUri );
       }else{
        this.rpcProvider = new ethers.providers.JsonRpcProvider( indexingConfig.web3ProviderUri );
       }
       
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
            this.subscribeAllToEvents( )           
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

    
     getABIFromType(type:string) : ethers.utils.Interface {
        type = type.toLowerCase()


        //let allIndexers = baseIndexers.concat( customIndexersArray )

         
        for(let indexer of this.customIndexersArray){
            if(type == indexer.type.toLowerCase()){
             
                return new ethers.utils.Interface(JSON.stringify(indexer.abi))
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

    

    subscribeAllToEvents(   ){

        let contractsArray = this.contractsArray  

        let knownEventTokens:any[] = []

        for(let contractData of contractsArray){ 

            let contractABI = this.getABIFromType(contractData.type) 
            let contractAddress = contractData.address

        //    let myContract =  new ethers.Contract( contractAddress, contractABI )

            let contractEventTokens = Object.keys(contractABI.events)

            
          /*  let contractEventTokens = myContract.options.jsonInterface.filter((token:any) => {
                return token.type === 'event';
              });*/
            
         //   knownEventTokens = knownEventTokens.concat(contractEventTokens)

            this.subscribeToEvents( contractData.address, contractABI, contractEventTokens, this.rpcProvider )
        }
      
      
    //    let contractAddresses = contractsArray.map(contract => contract.address)
        
        
       /* 

        console.log('subscribing to logs ', options)
*/
     

      /*  let subscription = this.web3.eth.subscribe('logs', options,(err,event) => {
            if (err) console.error(err)
             
        });*/

       
       // subscription.on('data', async (rawEvent) =>  {

      
    }


    async subscribeToEvents(
        contractAddress:string,
        contractABI:ethers.utils.Interface,
        eventTokens: any[],
        rpcProvider?:ethers.providers.Provider
        ){
  
        if(!rpcProvider) return ;

        let options = { 
            address: contractAddress     //Only get events from specific addresses 
        };

        console.log('subscribing to logs ', options, eventTokens)
          
            //make sure this works !!
        let subscription = rpcProvider.on(options ,  async (rawEvent:ContractEventRaw) =>  {
            
            console.log('gotRawEvent from subscription' , rawEvent)
             
            let matchingEventToken = null


            if(this.logLevel=='debug'){
                console.log(' eventTokens  ', eventTokens)
            }


            let parsedEvent:ContractEvent | undefined = undefined 

            try{
                let decodeResult = contractABI.parseLog( rawEvent )

                parsedEvent = {
                    name: decodeResult.name,
                    signature: decodeResult.signature,
                    args: decodeResult.args,

                    address:rawEvent.address,
                    data: rawEvent.data,
                    transactionHash: rawEvent.transactionHash, 
                    blockNumber: rawEvent.blockNumber ,
                    blockHash: rawEvent.blockHash ,
                    logIndex: rawEvent.logIndex
                     
                 }
            }catch(error:any){
                console.error(error)

            }

            /*

            for(let eventToken of eventTokens){
                if( rawEvent.topics[0] ==  eventToken.signature ){
                    matchingEventToken = eventToken 
                    break 
                }
            }*/

            if(parsedEvent){   
 
                try{
                    let inserted = await EventList.create(parsedEvent)

                    if(this.logLevel=='debug'){
                        console.log('inserted new event from subscription', rawEvent , inserted ) 
                     }
                     
                }catch(err:any){
                    console.error(err)
                }
                // let inserted = await this.mongoInterface.insertOne('event_list', rawEvent)   
                    
              
                

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

        let matchingContract = await this.getContractState(contractAddress)

        if(!matchingContract){
            throw new Error(`Could not find contract state for ${contractAddress}`)
        }

        let contractType = matchingContract.type // await this.readParameterForContract(contractAddress, 'type')
 

        let newEventsArray = await EventList.find({address: contractAddress, hasAffectedLedger: null }).limit(5000)
        // = await this.mongoInterface.findAllWithLimit('event_list',{address: contractAddress, hasAffectedLedger: null }, 5000)

        if(this.logLevel=='debug' && newEventsArray.length > 0){
            console.log('update ledger: ', newEventsArray.length)
          }

        for(let event of newEventsArray){

            let modify = await this.triggerOnEventEmitted(event, contractType)

            await EventList.updateOne( {_id: event._id }, {hasAffectedLedger: true } )
          //  await this.mongoInterface.updateOne('event_list', {_id: event._id }, {hasAffectedLedger: true })
        }

        if(this.onIndexCallback && newEventsArray && newEventsArray.length > 0){
            this.onIndexCallback()
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
        let deleted = await ContractState.deleteMany( {})
    }

    async dropDatabase(){
        
        await ContractState.deleteMany({})
        await EventData.deleteMany({})
        await EventList.deleteMany({})
    }


    async deleteDataForContract(contractAddress:string){
        contractAddress = ethers.utils.getAddress(contractAddress)

        
        await ContractState.deleteMany({contractAddress: contractAddress})
        await EventData.deleteMany({contractAddress: contractAddress})
        await EventList.deleteMany({address: contractAddress})
    }

    async deleteIndexedData(){
      
        await EventList.updateMany({},{hasAffectedLedger:null})
        
    }


    blockNumberIsStale(){

        let updateBlockNumberRate = this.updateBlockNumberRate ? this.updateBlockNumberRate : 60*1000

        return !this.blocknumberUpdatedAt ||  ( Date.now() - this.blocknumberUpdatedAt )  > updateBlockNumberRate
    }


    async fetchLatestBlockNumber(){ 

        let rpcProvider = this.rpcProvider 
        
        if(!rpcProvider) {
            console.error("Could not fetch block number: RPC Provider undefined")
            return undefined
        } 
         
        try{ 
            let latestBlockNumber = await getBlockNumber(rpcProvider)            

            return latestBlockNumber
        }catch(e){
            console.error(e)
        }

        return undefined 
    }

    async setParameterForContract(contractAddress:string, paramName:any, newValue:any){
        await ContractState.updateOne(  {contractAddress:contractAddress}, {[`${paramName}`]:newValue} )
     //   await this.mongoInterface.updateOne('contract_state', {contractAddress:contractAddress}, {[`${paramName}`]:newValue})
        
    }

    async getContractState(contractAddress:string ) : Promise<IContractState | null> {

        let contractState:IContractState | null = await ContractState.findOne(  {contractAddress:contractAddress} )
        //await this.mongoInterface.findOne('contract_state', {contractAddress:contractAddress})

        return contractState//[paramName]
    }

    async getScaledCourseBlockGap(contractAddress:string){
        
        let matchingContract = await this.getContractState(contractAddress)

        if(!matchingContract){
            throw new Error(`Could not find contract state for ${contractAddress}`)
        }

        let stepSizeScaleFactor = matchingContract.stepSizeScaleFactor ? matchingContract.stepSizeScaleFactor : 1 //await this.readParameterForContract( contractAddress, 'stepSizeScaleFactor'  )

        let courseBlockGap = this.courseBlockGap ? this.courseBlockGap : DEFAULT_COURSE_BLOCK_GAP

        return  ( courseBlockGap / stepSizeScaleFactor )
    }

    async indexData(){    
        
        if(!this.maxBlockNumber || this.blockNumberIsStale()){
            this.maxBlockNumber = await this.fetchLatestBlockNumber( )
             
           
            this.blocknumberUpdatedAt = Date.now(); 
        }

        if(!this.maxBlockNumber){
            throw new Error("No max block number! cannot index data")
        }
        

        let contractData = this.contractsArray[this.currentContractIndex]
        let contractAddress = contractData.address
        

        var madeApiRequest = false;

        let matchingContract = await this.getContractState(contractAddress)

        if(!matchingContract){
            throw new Error(`Could not find contract state for ${contractAddress}`)
        }

        let cIndexingBlock = matchingContract.currentIndexingBlock // await this.readParameterForContract(contractAddress , 'currentIndexingBlock')   //parseInt(this.currentIndexingBlock) 

        let contractType = contractData.type //await this.readParameterForContract(contractAddress , 'type')   //parseInt(this.currentIndexingBlock) 

        let fineBlockGap = this.fineBlockGap ? this.fineBlockGap : DEFAULT_FINE_BLOCK_GAP

        if(this.logLevel=='debug'){
            console.log('index data starting at ', cIndexingBlock, contractAddress)
        }
        
        let scaledCourseBlockGap = await this.getScaledCourseBlockGap( contractAddress )


       
        if(cIndexingBlock + Math.floor(scaledCourseBlockGap ) < this.maxBlockNumber){
            
            let contractABI = this.getABIFromType(contractType)
            let rpcProvider = this.rpcProvider 

            if(!rpcProvider){
                throw new Error("rpcProvider is undefined")
            }

             await this.indexContractData( contractAddress, contractABI, rpcProvider, cIndexingBlock, scaledCourseBlockGap  )
            
            
    
             await this.setParameterForContract(contractAddress, 'synced', false)
             await this.setParameterForContract(contractAddress, 'lastUpdated', Date.now())
             
             madeApiRequest = true;

        }else if( cIndexingBlock + fineBlockGap < this.maxBlockNumber ){

            let remainingBlockGap =  (this.maxBlockNumber - cIndexingBlock -  1)


            let contractABI = this.getABIFromType(contractType) 
            let rpcProvider = this.rpcProvider 

            if(!rpcProvider) throw new Error("Undefined rpc provider")

            await this.indexContractData( contractAddress, contractABI, rpcProvider, cIndexingBlock, remainingBlockGap  )

            await this.setParameterForContract(contractAddress, 'synced', true)
            await this.setParameterForContract(contractAddress, 'lastUpdated', Date.now())
             
            madeApiRequest = true;

            if(this.logLevel=='debug'){
                console.log('resynchronizing: ', cIndexingBlock, contractAddress)
            }
     
        }else{

            if(this.logLevel=='debug'){
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

      //give us fewer events 
    async increaseStepSizeScaleFactorForContract(contractAddress:string){

        let matchingContract = await this.getContractState(contractAddress)

        if(!matchingContract){
            throw new Error(`Could not find contract state for ${contractAddress}`)
        }

        let oldFactor = matchingContract.stepSizeScaleFactor ? matchingContract.stepSizeScaleFactor : 1
        let newFactor  =  (oldFactor * 2)

        await this.setParameterForContract(contractAddress, 'stepSizeScaleFactor', newFactor)

        if(this.logLevel=='debug'){
            console.log('ScaleFactor ',contractAddress,newFactor)
        }

    }

       //give us more events
    async decreaseStepSizeScaleFactorForContract(contractAddress:string){

        let matchingContract = await this.getContractState(contractAddress)

        if(!matchingContract){
            throw new Error(`Could not find contract state for ${contractAddress}`)
        }

        let oldFactor = matchingContract.stepSizeScaleFactor ? matchingContract.stepSizeScaleFactor : 1 //await this.readParameterForContract(contractAddress, 'stepSizeScaleFactor')
        let newFactor  = Math.max(   (oldFactor / 2) , 1)

       // this.stepSizeScaleFactor  = Math.max(  parseInt(this.stepSizeScaleFactor / 2) , 1)

        await this.setParameterForContract(contractAddress, 'stepSizeScaleFactor', newFactor)

        if(this.logLevel=='debug'){
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



    async indexContractData(  contractAddress:string, contractABI:ethers.utils.Interface, rpcProvider: ethers.providers.Provider, startBlock:number, blockGap:number ){



      //  let contract = getCustomContract( contractAddress, contractABI, rpcProvider  )
        
        var insertedMany; 
          
         let endBlock = startBlock + Math.max(Math.ceil(blockGap) - 1 , 1)     

        try{
            var results = await this.getContractEvents(contractAddress, contractABI, startBlock, endBlock, rpcProvider )
        }catch(resultsError){ 
          
            await this.increaseStepSizeScaleFactorForContract( contractAddress  )  

            console.error('Request Error: ', resultsError)

            return 
        }
        //need better error catch

            if(this.logLevel=='debug'){ 
                if( results.events && results.events.length == 0){
                    console.log('zero results', results)
                }

                if( results.events && results.events.length > SAFE_EVENT_COUNT){
                    console.log('excessive results', results)
                }                 
            }

          

            if(!results || results.events.length > SAFE_EVENT_COUNT  ){

                await this.increaseStepSizeScaleFactorForContract( contractAddress  )
                   

            }else{

                if(this.logLevel=='debug'){
                    console.log('saved event data ', results.fromBlock, ":", results.toBlock, ' Count: ' , results.events.length)
                }

                //save in mongo  
                let existingEventData = await EventData.findOne( {contractAddress: results.contractAddress, startBlock: results.fromBlock } )
                //await this.mongoInterface.findOne('event_data', {contractAddress: results.contractAddress, startBlock: results.startBlock })
                if(!existingEventData){

                    //reduce storage size 
                    let newEventData:Omit<IEventData,'_id'> = {
                        contractAddress: results.contractAddress, 
                        startBlock: results.fromBlock ,
                        endBlock: results.toBlock,
                        eventsCount: results.events.length 
                        //and some other stuff ?
                    }

                    await EventData.create(newEventData) 
                   

                    //our unique index ensures that we will not double count these 
                    if(results.events && results.events.length > 0){ 
                        

                        let eventsToLog = results.events.filter((evt:any) => ( evt.name != null )  )

                        if(eventsToLog && eventsToLog.length > 0 ){
                            try{ 
                                let options = {ordered: false}

                              //  console.log('inserting',JSON.stringify(eventsToLog))

                                insertedMany = await EventList.insertMany( eventsToLog, options  )
                              //   insertedMany = await this.mongoInterface.insertMany('event_list', eventsToLog /* results.events*/, options  )
                            }catch(e){
                                console.error(e)
                            }
                        }

                        let erroredEvents = results.events.filter((evt:any) => ( !evt.name )  )
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


   
    
   


    async getContractEvents(
        contractAddress:string, contractABI:ethers.utils.Interface, fromBlock:number, toBlock:number, provider:ethers.providers.Provider )
    :Promise<{
        contractAddress:string,
        fromBlock:number,
        toBlock:number,
        events:ContractEvent[]
    }>{        
            let rawEvents:ContractEventRaw[] = await new Promise ((resolve, reject) => {

                provider.getLogs(
                    {
                        fromBlock ,
                        toBlock,
                        address: contractAddress,
                    //  topics: IssueEvent.topics
                    }
                ).then(function(events:ContractEventRaw[]){
                    resolve(events) // same results as the optional callback above
                }).catch(function(error:any){reject(error)});
            })

               // const logData = IssueEvent.parse(log.topics, log.data);
                 
                const decodedEvents: ContractEvent[] = rawEvents.map( (evt:ContractEventRaw) => {

                     

                    const decodeResult = contractABI.parseLog( evt )
                     
                    return {
                       name: decodeResult.name,
                       signature: decodeResult.signature,
                       args: decodeResult.args,

                       address:evt.address,
                       data: evt.data,
                       transactionHash: evt.transactionHash, 
                       blockNumber: evt.blockNumber,
                       blockHash: evt.blockHash ,
                       logIndex: evt.logIndex
                        
                    }

                   }
                        
                        
                ) 


            
                return  {
                    contractAddress,
                    fromBlock, 
                    toBlock, 
                    events: decodedEvents
                }
 
 

    }

 

    async triggerOnEventEmitted(event:any, contractType?:string){
       // let mongoInterface = this.mongoInterface

       if(!contractType){
        console.error('Unable to trigger onEventEmitted for ', event)
        return
       }

        contractType = contractType.toLowerCase()

        let indexer = this.getIndexerForContractType(contractType)



        let eventName = event.name 
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



 