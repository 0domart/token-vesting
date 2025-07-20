
use anchor_lang::prelude::*;

#[account]
pub struct VestingAccount {
	pub owner: Pubkey,
	pub mint_token: Pubkey,
	pub company_name: String,
	pub treasury_token_account: Pubkey,
	pub treasury_bump: u8,
	pub bump: u8,
}
