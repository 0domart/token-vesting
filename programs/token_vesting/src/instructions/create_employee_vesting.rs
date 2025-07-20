use crate::*;
use anchor_lang::prelude::*;
use crate::error::TokenVestingError;

use anchor_spl::{
    token::{Mint, Token, TokenAccount},
    associated_token::AssociatedToken,
};

#[derive(Accounts)]
#[instruction(
    start_time: i64,
    end_time: i64,
    total_amount: i64,
)]
pub struct CreateEmployeeVesting<'info> {
    #[account(mut)]
    pub fee_payer: Signer<'info>,

    #[account(
        mut,
        constraint = vesting_account.owner == fee_payer.key() @ TokenVestingError::NotAuthorized
    )]
    pub vesting_account: Account<'info, VestingAccount>,

    #[account(
        init,
        space = 8 + // discriminator
               32 + // beneficiary: Pubkey
               8 + // start_time: i64
               8 + // end_time: i64
               8 + // total_amount: i64
               8 + // total_withdraw: i64
               32, // vesting_account: Pubkey
        payer = fee_payer,
        seeds = [
            b"employee",
            vesting_account.key().as_ref(),
            beneficiary.key().as_ref(),
        ],
        bump,
    )]
    pub employee_vesting: Account<'info, EmployeeVesting>,

    /// CHECK: The beneficiary who will receive the vested tokens
    pub beneficiary: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
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
pub fn handler(
    ctx: Context<CreateEmployeeVesting>,
    start_time: i64,
    end_time: i64,
    total_amount: i64,
) -> Result<()> {
    let employee_vesting = &mut ctx.accounts.employee_vesting;
    let vesting_account = &ctx.accounts.vesting_account;
    let beneficiary = &ctx.accounts.beneficiary;
    
    // Validate inputs
    if start_time >= end_time {
        return Err(TokenVestingError::InvalidVestingSchedule.into());
    }
    
    if total_amount <= 0 {
        return Err(TokenVestingError::InvalidAmount.into());
    }
    
    // Initialize the employee vesting account
    employee_vesting.beneficiary = beneficiary.key();
    employee_vesting.start_time = start_time;
    employee_vesting.end_time = end_time;
    employee_vesting.total_amount = total_amount;
    employee_vesting.total_withdraw = 0;
    employee_vesting.vesting_account = vesting_account.key();
    
    msg!("Employee vesting created for beneficiary: {}", beneficiary.key());
    msg!("Vesting period: {} to {}", start_time, end_time);
    msg!("Total amount to vest: {}", total_amount);
    
    Ok(())
}