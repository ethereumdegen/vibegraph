import { Schema, Model, InferSchemaType, model, Require_id } from 'mongoose'
 

export const EventListSchema = new Schema(
  {
    event:String ,
    returnValues: Object, 

  } 
)
  
export type IEventList = Require_id<
  InferSchemaType<typeofEventListSchema>
> 
export const EventList = model<IEventList, Model<IEventList>>('event_list', EventListSchema)
