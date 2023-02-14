

/*
    Singleton Loop Method

    Instantiate this class with a Promise(method) and an array of args

    Call the start() method on the instance in order to continuously call the method in a loop.  If an instance of the method is currently executing, it will not execute another time -- it will skip. 

    In this way, the execution code will only be running in a single instance at any given time.  However, the code will loop forever until stop() is called
*/

export default class SingletonLoopMethod {

    interval:any
    executing:boolean = false

    constructor(public callback:any, public args?:any){
        this.registerMethod(callback,args)
    }


    //callback should be a promise 
    registerMethod(  callback:any, args?:any  ){
        //console.log('typeof callback', typeof callback)
        //if(typeof callback!='Promise') throw 'Must be a promise'

        this.callback = callback;
        this.args=args;
    } 

    start(delayMs?:number){

        this.execute()

        let delay = delayMs ? delayMs : 1000

        
        this.interval = setInterval( this.execute.bind(this) , delay )

        
    }

    stop(){
        clearInterval(this.interval)
    }

    async execute(){
        if(this.executing){
            console.error('ALREADY EXECUTING')
            return
        }; 

       
        this.executing=true
        if(this.args){ 
            await this.callback(...this.args)
        }else{
            await this.callback()
        }       
        this.executing=false
    }


}

