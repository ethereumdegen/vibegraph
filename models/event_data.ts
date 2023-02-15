import { Schema, Model, InferSchemaType, model, Require_id } from 'mongoose'
 
/*
what is this used for ? 
*/
export const EventDataSchema = new Schema(
  {
    contractAddress:String,
    startBlock:Number,
    endBlock:Number,
    eventsCount:Number 

  } 
)
  
export type IEventData = Require_id<
  InferSchemaType<typeof EventDataSchema>
> 
export const EventData = model<IEventData, Model<IEventData>>('event_data', EventDataSchema)
