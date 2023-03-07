import { VibegraphError } from "../../models/vibegraph_error";


export async function saveErrorToDatabase( errMsg: string , metadata?: string){

    try{
        await VibegraphError.create( {
            error: errMsg,
            metadata,
            createdAt: Date.now().toString()
        } )
    }catch(err:any){
        console.error(`Unable to save error to database ${errMsg}`)
    }
}