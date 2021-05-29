 
var WolfPack = require('../index.js')

var Web3 = require('web3')

let web3Config = require('./testconfig.json')


 async function runWolfPack(){
        let web3 = new Web3( web3Config.web3provider  )

        let wolfPackConfig = {
            contracts:[
                    {address:"0x8a4c85478568ec5284301eaa0ddfd06c0ed73323", startBlock: 4876534 , type:"Cryptopunks"} 
              
                    ],
             
            suffix:"dev",
            indexRate: 10*1000,
            courseBlockGap: 8000,
            logging:true,
            reScale: false
        }

        let wolfPack = new WolfPack()
        await wolfPack.init( {suffix: wolfPackConfig.suffix} )
        wolfPack.startIndexing( web3, wolfPackConfig )  

        

    } 


    runWolfPack()
  
    