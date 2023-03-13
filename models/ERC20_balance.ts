import mongoose, { Schema, Model, InferSchemaType, model, Require_id } from 'mongoose'
 

export const ERC20BalanceSchema = new Schema(
  {
    contractAddress: { type: String, required: true, index: true },
    accountAddress: { type: String, required: true, index: true },

    amount: { type: Number  },
    lastUpdatedAt:Number 
  } 
)
 
 
mongoose.pluralize(null);

export type IERC20Balance = Require_id<
  InferSchemaType<typeof ERC20BalanceSchema>
> 
export const ERC20Balance = model<IERC20Balance, Model<IERC20Balance>>('erc20_balances', ERC20BalanceSchema)
