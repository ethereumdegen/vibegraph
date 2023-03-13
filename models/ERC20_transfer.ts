import mongoose, { Schema, Model, InferSchemaType, model, Require_id } from 'mongoose'
 

export const ERC20TransferSchema = new Schema(
  {
    contractAddress: { type: String, required: true, index: true },
    from: { type: String, required: true, index: true },
    to: { type: String, required: true, index: true },

    amount: { type: Number  },
    lastUpdatedAt:Number 
  } 
)
 
 
mongoose.pluralize(null);

export type IERC20Transfer = Require_id<
  InferSchemaType<typeof ERC20TransferSchema>
> 
export const ERC20Transfer = model<IERC20Transfer, Model<IERC20Transfer>>('erc20_transfer', ERC20TransferSchema)
