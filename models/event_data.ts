import mongoose, { Schema, Model, InferSchemaType, model, Require_id } from 'mongoose'
 

import {getDatabaseName} from "../src/lib/app-helper"


const dbName = getDatabaseName()

export const EventDataSchema = new Schema(
  {
    contractAddress:String,
    startBlock:Number,
    endBlock:Number,
    eventsCount:Number 

  } 
)
  
mongoose.pluralize(null);


let dbConnection = mongoose.connection.useDb(dbName)



export type IEventData = Require_id<
  InferSchemaType<typeof EventDataSchema>
> 
export const EventData = dbConnection.model<IEventData, Model<IEventData>>('event_data', EventDataSchema)
