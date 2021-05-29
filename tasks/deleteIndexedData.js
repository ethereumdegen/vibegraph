 
var WolfPack = require('../index.js')

var Web3 = require('web3')
 
let web3Config = require('./taskconfig.json')


 async function start(){
        let web3 = new Web3( web3Config.web3provider  )

        let suffix = process.env.NODE_ENV// "dev"
        //let contractAddress = '0x'

        let wolfPack = new WolfPack()
        await wolfPack.init( {suffix:  suffix } )
        await wolfPack.deleteIndexedData()  
        
        console.log('completed task.')

    } 


    start()
  
    