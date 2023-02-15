import { Schema, Model, InferSchemaType, model, Require_id } from 'mongoose'
 

export const EventDataSchema = new Schema(
  {
   

  } 
)
  
export type IEventData = Require_id<
  InferSchemaType<typeof EventDataSchema>
> 
export const EventData = model<IEventData, Model<IEventData>>('event_list', EventListSchema)
