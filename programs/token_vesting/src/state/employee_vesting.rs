
use anchor_lang::prelude::*;

#[account]
pub struct EmployeeVesting {
	pub beneficiary: Pubkey,
	pub start_time: i64,
	pub end_time: i64,
	pub total_amount: i64,
	pub total_withdraw: i64,
	pub vesting_account: Pubkey,
}
