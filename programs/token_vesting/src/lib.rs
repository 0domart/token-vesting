pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;
use std::str::FromStr;

pub use constants::*;
pub use instructions::*;
pub use state::*;

declare_id!("8MDVdVK9ShgA7W6mNkRSjSySw219hzdrvhFxCCWSieZV");

#[program]
pub mod token_vesting {
    use super::*;

/// Creates a new vesting account for a company
///
/// Accounts:
/// 0. `[signer]` fee_payer: [AccountInfo] 
/// 1. `[writable]` vesting_account: [VestingAccount] The vesting account to be created
/// 2. `[signer]` owner: [AccountInfo] The owner of the vesting account
/// 3. `[]` mint_token: [Mint] The token mint address
/// 4. `[writable, signer]` treasury_token_account: [AccountInfo] The token account that will hold the tokens to be vested
/// 5. `[]` system_program: [AccountInfo] Auto-generated, for account initialization
///
/// Data:
/// - company_name: [String] The name of the company
	pub fn create_vesting_account(ctx: Context<CreateVestingAccount>, company_name: String) -> Result<()> {
		create_vesting_account::handler(ctx, company_name)
	}

/// Creates a new employee vesting schedule
///
/// Accounts:
/// 0. `[signer, writable]` fee_payer: [AccountInfo] The fee payer and owner of the vesting account
/// 1. `[writable]` vesting_account: [VestingAccount] The vesting account that will manage the employee vesting
/// 2. `[writable]` employee_vesting: [EmployeeVesting] The employee vesting account to be created
/// 3. `[]` beneficiary: [AccountInfo] The beneficiary who will receive the vested tokens
/// 4. `[]` system_program: [AccountInfo] System program for account creation
///
/// Data:
/// - start_time: [i64] The start time of the vesting schedule (unix timestamp)
/// - end_time: [i64] The end time of the vesting schedule (unix timestamp)
/// - total_amount: [i64] The total amount of tokens to be vested
	pub fn create_employee_vesting(
		ctx: Context<CreateEmployeeVesting>,
		start_time: i64,
		end_time: i64,
		total_amount: i64,
	) -> Result<()> {
		create_employee_vesting::handler(ctx, start_time, end_time, total_amount)
	}

/// Claims vested tokens for a beneficiary
///
/// Accounts:
/// 0. `[signer, writable]` fee_payer: [AccountInfo] The fee payer for the transaction
/// 1. `[writable]` employee_vesting: [EmployeeVesting] The employee vesting account
/// 2. `[]` vesting_account: [VestingAccount] The vesting account that manages the employee vesting
/// 3. `[writable]` treasury_token_account: [TokenAccount] The token account that holds the tokens to be vested
/// 4. `[signer]` beneficiary: [AccountInfo] The beneficiary who will receive the vested tokens
/// 5. `[writable]` beneficiary_token_account: [TokenAccount] The token account that will receive the vested tokens
/// 6. `[]` mint_token: [Mint] The token mint address
/// 7. `[]` system_program: [AccountInfo] System program for account creation
/// 8. `[]` token_program: [AccountInfo] Token program for token transfers
/// 9. `[]` associated_token_program: [AccountInfo] Associated token program for token account creation
/// 10. `[]` rent: [AccountInfo] Rent sysvar
	pub fn claim_token(ctx: Context<ClaimToken>) -> Result<()> {
		claim_token::handler(ctx)
	}
}