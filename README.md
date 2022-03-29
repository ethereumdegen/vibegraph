# 🐸VibeGraph🐸
Data collection bot for Web3 events such as Transfer/Approval events of ERC20 and ERC721 tokens.  Similar to subgraph but opensource and lightweight.

!VIBE



#### Try it out 


    npm install

    npm run testrun 


#### How to use (In NodeJS) 
(Requires MongoDB to be installed on the local machine) 

         let web3 = new Web3( web3Config.web3provider  )

        let vibegraphConfig = {
            contracts:[{address:"0x39ec448b891c476e166b3c3242a90830db556661", startBlock: 4465713, type:'ERC721'},
                            {address:"0x7cea7e61f8be415bee361799f19644b9889713cd", startBlock: 4528636, type:'ERC721'}],
             
            dbName:"vibegraph__dev",
            indexRate: 10*1000,
            courseBlockGap: 8000,
            logging:true,
            subscribe: false
        }

        let vibegraph = new VibeGraph()
        await vibegraph.init( vibegraphConfig )
        vibegraph.startIndexing( web3, vibegraphConfig )  


        
        
        
        
 As vibegraph indexes, it starts at 'startBlock' and is collecting events at a pace of 'courseBlockGap' blocks read per 'indexRate' of time.  
 It stores these events inside of a mongo database named '{{dbName}}' and inside of a collection named 'event_data'
 
 Once vibegraph synchronizes to the front of the blockchain data (current state) then it will use the 'fineBlockGap' to remain synchronized.  
 
 As vibegraph is scraping chaindata for each ERC20/ERC721 token, it is also building a cache of user balances in the tables named 'erc20_balances' and 'erc721_balances'. 
 
 
 #### Configuration 
 
 "contracts": An array of objects, each with 'address', 'startBlock', and'type'.  For a smart contract, the address will be the smart contract address, the start block will be the block number on which the contract was deployed, and the type is a string that describes the custom indexer script that will be used. (See 'Custom Indexers' for more information.) 
 
 "dbName": A string that describes the mongo database that will be used
 
 "indexRate": The number of milliseconds in between requests to the web3 connection for scraping data
 
 "courseBlockGap": The number of blocks to space event collection before synchronization.  The smaller the number, the less bandwidth will be used to scrape chaindata but the longer it will take to fully synchronize.
 
 "fineBlockGap": The number of blocks to space event collection after synchronization. This is only used to keep in sync with the head of the chain.  
 
 "logging": A boolean for additional console logging output
 
 "subscribe":  A boolen to turn on chain data scraping with a subscription to the web3 connection.  With this set to 'true', data is still also scraped using the indexRate and any duplicate events are simply ignored.
 
 "customIndexers":  An array of objects, each with 'type', 'abi', and 'handler'.  If one of your contracts has a 'type' that is not one of the default types ('ERC20' or 'ERC721') then you must declare the custom type here.  In this way, you attach the ABI object (parsed json file) and the handler (a javascript class describing how to store the event data in mongodb.)  There are example handler files to start from. 
 
 #### Default Indexers and Events Supported
 
        ERC20 Events:  Transfer, Approval, Deposit (weth), Withdrawal (weth), Mint (0xBTC)
 
        ERC721 Events: Transfer
        
        ERC1155 Events: Transfer


#### Custom Indexers

Specify a custom indexer in the vibegraph config like so:

    customIndexers:[{ type:'TellerOptions', abi: TellerOptionsABI ,  handler: IndexerTellerOptions  }]

Where 'IndexerTellerOptions' is an imported Class similar to ./indexers/IndexerCryptopunks.js, TellerOptionsABI is a parsed JSON object and the type string is the identifier.  

#### Subscription

If you set subscribe:true, then the indexer will poll and subscribe to new events to capture them faster.  You MUST use a websockets-based connection (wss://) and not an http:// based connection for the web3 RPC if you choose to enable this.  



## How you can contribute to this repo

- add more unit tests
