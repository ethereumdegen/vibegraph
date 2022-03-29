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
 
 #### Events Supported
 
        ERC20 Events:  Transfer, Approval, Deposit (weth), Withdrawal (weth), Mint (0xBTC)
 
        ERC721 Events: Transfer
        
        ERC1155 Events: Transfer


#### Custom Indexers

Specify a custom indexer in the vibegraph config like so:

customIndexers:[{ type:'TellerOptions', abi: TellerOptionsABI ,  handler: IndexerTellerOptions  }]


Where 'IndexerTellerOptions' is an imported Class similar to ./indexers/IndexerCryptopunks.js


#### Subscription

If you set subscribe:true, then the indexer will poll and subscribe to new events to capture them faster.  You MUST use a websockets-based connection and not an http based connection for the web3 RPC.  



## How you can contribute to this repo

- add more unit tests
