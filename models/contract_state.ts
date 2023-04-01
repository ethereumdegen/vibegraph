import mongoose, { Schema, Model, InferSchemaType, model, Require_id } from 'mongoose'
 
import {getDatabaseName} from "../src/lib/app-helper"


const dbName = getDatabaseName()

export const ContractStateSchema = new Schema(
  {
    contractAddress: { type: String, required: true, index: true },
    currentIndexingBlock: {type:Number, required:true}, 
    type: {type:String, required:true },
    stepSizeScaleFactor: Number,
    synced: Boolean,
    lastUpdated: Number
  } 
)
 
//ContractStateSchema.index({ contractAddress: 1, tokenId: 1 }, { unique: true })


mongoose.pluralize(null);

let dbConnection = mongoose.connection.useDb(dbName)

export type IContractState = Require_id<
  InferSchemaType<typeof ContractStateSchema>
> 
export const ContractState = dbConnection.model<IContractState, Model<IContractState>>('contract_state', ContractStateSchema)
