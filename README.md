# 🦊 Wolfpack 🦊
Data aggregator for Transfer/Approval events of ERC20 and ERC721 tokens 



### TODO 

- add BTF burned signatures events 




#### How to use (In NodeJS) 
(Requires a MongoDB to be installed on the local machine) 

         let web3 = new Web3( web3Config.web3provider  )

        let wolfPackConfig = {
            contracts:[{address:"0x39ec448b891c476e166b3c3242a90830db556661", startBlock: 4465713, type:'ERC721'},
                            {address:"0x7cea7e61f8be415bee361799f19644b9889713cd", startBlock: 4528636, type:'ERC721'}],
             
            suffix:"dev",
            indexRate: 10*1000,
            courseBlockGap: 8000,
            logging:true,
            reScale: false
        }

        let wolfPack = new WolfPack()
        await wolfPack.init( {suffix: wolfPackConfig.suffix} )
        wolfPack.startIndexing( web3, wolfPackConfig )  


        
        
        
        
 As wolfpack indexes, it starts at 'startBlock' and is collecting events at a pace of 'courseBlockGap' blocks read per 'indexRate' of time.  
 It stores these events inside of a mongo database named 'wolfpack_{{suffix}}' and inside of a collection named 'event_data'
 
 Once wolfpack synchronizes to the front of the blockchain data (current state) then it will use the 'fineBlockGap' to remain synchronized.  
 
 As wolfpack is scraping chaindata for each ERC20/ERC721 token, it is also building a cache of user balances in the tables named 'erc20_balances' and 'erc721_balances'. 
 
 #### Events Supported
 
        ERC20 Events:  Transfer, Approval, Deposit (weth), Withdrawal (weth), Mint (0xBTC)
 
        ERC721 Events: Transfer
