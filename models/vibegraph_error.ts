import mongoose, { Schema, Model, InferSchemaType, model, Require_id } from 'mongoose'
 

export const VibegraphErrorSchema = new Schema(
  {
   
    error: String,
    metadata: String,

    createdAt: String, 

  } 
)

 

mongoose.pluralize(null);
  
export type IVibegraphError = Require_id<
  InferSchemaType<typeof VibegraphErrorSchema>
> 
export const VibegraphError = model<IVibegraphError, Model<IVibegraphError>>('vibegraph_error', VibegraphErrorSchema)
