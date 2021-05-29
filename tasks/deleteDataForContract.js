 
var WolfPack = require('../index.js')

var Web3 = require('web3')
 

 async function start(){
        let web3 = new Web3( web3Config.web3provider  )

        let suffix = "dev"
        let contractAddress = '0x'

        let wolfPack = new WolfPack()
        await wolfPack.init( {suffix:  suffix } )
        wolfPack.deleteDataForContract(  contractAddress )  

        

    } 


    start()
  
    