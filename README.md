# VibeGraph 🐸
Ethereum event indexing collection service for Web3 events such as Transfer/Approval events of ERC20 and ERC721 tokens.  An opensource and lightweight alternative to Subgraph/TheGraph.


![image](https://user-images.githubusercontent.com/6249263/218893132-89721ace-a86a-4d57-8924-773eedf4fa52.png)

!VIBE 

#### Try it out 


    npm install

    npm run vibegraph 



#### Pre-requisites
 - NodeJS >= 14
 - MongoDB

#### How to use (In NodeJS) 


    //top of file 
    let VibeGraph = require('vibegraph')
    let ERC721ABI = require( '../config/ERC721ABI.json' )

    //define the config 
    let vibegraphConfig = {
        contracts:[{address:"0x39ec448b891c476e166b3c3242a90830db556661", startBlock: 4465713, type:'ERC721'},
                        {address:"0x7cea7e61f8be415bee361799f19644b9889713cd", startBlock: 4528636, type:'ERC721'}],
            
        dbName:"vibegraph__dev",
        indexRate: 10*1000,
        courseBlockGap: 8000,
        logging:true,
        subscribe: false,
        customIndexers:[{
                type:'ERC721', 
                abi: ERC721ABI ,  
                handler: indexerErc721   //see example in ./indexers 
             }],
        web3ProviderUri:  "wss://...." 
    }


#### Boot as a looping service 

    let vibegraph = new VibeGraph()
    await vibegraph.init( vibegraphConfig )
    vibegraph.startIndexing( )  


#### Call in your own loop 

     let vibegraph = new VibeGraph()
     await vibegraph.init( vibegraphConfig )

     while (USER_LOOP){

        await vibegraph.indexData() //fetch the event logs from rpc 
        
        await vibegraph.updateLedger() //execute callbacks on indexers from the events 
        
    
        sleep(1000)
     }

        
        
        
 As vibegraph indexes, it starts at 'startBlock' and is collecting events at a pace of 'courseBlockGap' blocks read per 'indexRate' of time.  
 It stores these events inside of a mongo database named '{{dbName}}' and inside of a collection named 'event_data'
 
 Once vibegraph synchronizes to the front of the blockchain data (current state) then it will use the 'fineBlockGap' to remain synchronized.  
 
 As vibegraph is scraping chaindata for each ERC20/ERC721 token, it is also building a cache of user balances in the tables named 'erc20_balances' and 'erc721_balances'. 
 
 
 ### Examples (see it in action!)
 
 Here is an open source project that uses Vibegraph to scrape ERC20 events. Use this as a reference implementation!
 
 https://github.com/OpenSourceMfers/open-0xbtc-api/blob/master/server/lib/dataghost.ts
 
 
 
 
 #### Configuration 
 
 "contracts": An array of objects, each with 'address', 'startBlock', and'type'.  For a smart contract, the address will be the smart contract address, the start block will be the block number on which the contract was deployed, and the type is a string that describes the custom indexer script that will be used. (See 'Custom Indexers' for more information.) 
 
 "dbName": A string that describes the mongo database that will be used
 
 "indexRate": The number of milliseconds in between requests to the web3 connection for scraping data
 
 "courseBlockGap": The number of blocks to space event collection before synchronization.  The smaller the number, the less bandwidth will be used to scrape chaindata but the longer it will take to fully synchronize.
 
 "fineBlockGap": The number of blocks to space event collection after synchronization. This is only used to keep in sync with the head of the chain.  
 
 "logging": A boolean for additional console logging output
 
 "subscribe":  A boolen to turn on chain data scraping with a subscription to the web3 connection.  With this set to 'true', data is still also scraped using the indexRate and any duplicate events are simply ignored. You MUST use a websockets-based connection (wss://) and not an http:// based connection for the web3 RPC if you choose to enable this.  
 
 "customIndexers":  An array of objects, each with 'type', 'abi', and 'handler'.  If one of your contracts has a 'type' that is not one of the default types ('ERC20' or 'ERC721') then you must declare the custom type here.  In this way, you attach the ABI object (parsed json file) and the handler (a javascript class describing how to store the event data in mongodb.)  There are example handler files to start from. 
 
 #### Default Indexers and Events Supported
 
        ERC20 Events:  Transfer, Approval, Deposit (weth), Withdrawal (weth), Mint (0xBTC)
 
        ERC721 Events: Transfer
        
        ERC1155 Events: Transfer


#### Custom Indexers

Specify a custom indexer in the vibegraph config like so:

    customIndexers:[{ type:'TellerOptions', abi: TellerOptionsABI ,  handler: IndexerTellerOptions  }]

Where 'IndexerTellerOptions' is an imported Class similar to ./indexers/IndexerCryptopunks.js, TellerOptionsABI is a parsed JSON object and the type string is the identifier.  

An indexer javascript file must must export an 'async' method named 'onEventEmitted' which accepts one argument: event.  Extend the interface 'Vibegraph Indexer'.  Vibegraph will call onEventEmitted(event)  whenever it recieves new data from the web3 connection.  You can handle this data in any way that you want. As you can see in example indexers, typically, you will parse the event object and then interpret that data to update or insert data into a database.


#### Database Topology

Vibegraph will automatically create a series of collections inside of the mongo database as it runs.  

"contract_state": Used to track the synchronization status of each contract being indexed. The 'currentIndexingBlock' integer describes the latest block that events have been collected up to.  The 'synced' boolean describes whether or not the event data has been synced to the head of the chain yet.  Type describes the type of the contract and thus the abi and handler that is being used to process incoming events.  

"event_list": used to store raw data of incoming events 

"event_data":  used to store raw data of incoming web3 requests 

 

## How you can contribute to this repo

- add more unit tests
