
 
import fs from 'fs'
import path from 'path'
export default class FileHelper{


    static  readJSONFile(uri){

        //console.log( path.relative( ' ') )

         let input =  fs.readFileSync(  uri ,   {encoding:'utf8', flag:'r'}); 

         return JSON.parse(input)
    }



}