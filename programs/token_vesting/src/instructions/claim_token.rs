use crate::*;
use anchor_lang::prelude::*;
use crate::error::TokenVestingError;

use anchor_spl::{
    token::{self, Mint, Token, TokenAccount, Transfer},
    associated_token::AssociatedToken,
};

#[derive(Accounts)]
pub struct ClaimToken<'info> {
    #[account(mut)]
    pub fee_payer: Signer<'info>,

    #[account(
        mut,
        constraint = employee_vesting.beneficiary == beneficiary.key() @ TokenVestingError::BeneficiaryMismatch
    )]
    pub employee_vesting: Account<'info, EmployeeVesting>,

    #[account(
        constraint = vesting_account.key() == employee_vesting.vesting_account @ TokenVestingError::NotAuthorized
    )]
    pub vesting_account: Account<'info, VestingAccount>,

    #[account(
        mut,
        seeds = [
            b"treasury",
            vesting_account.company_name.as_bytes().as_ref(),
        ],
        bump = vesting_account.treasury_bump,
    )]
    pub treasury_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = beneficiary.key() == employee_vesting.beneficiary @ TokenVestingError::BeneficiaryMismatch,
    )]
    /// The beneficiary who will receive the vested tokens
    pub beneficiary: Signer<'info>,

    #[account(
        init_if_needed,
        payer = fee_payer,
        associated_token::mint = mint_token,
        associated_token::authority = beneficiary,
    )]
    pub beneficiary_token_account: Account<'info, TokenAccount>,

    #[account(
        constraint = mint_token.key() == vesting_account.mint_token @ TokenVestingError::NotAuthorized
    )]
    pub mint_token: Account<'info, Mint>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
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
pub fn handler(
    ctx: Context<ClaimToken>,
) -> Result<()> {
    let employee_vesting = &mut ctx.accounts.employee_vesting;
    let vesting_account = &ctx.accounts.vesting_account;
    let treasury_token_account = &ctx.accounts.treasury_token_account;
    let beneficiary_token_account = &ctx.accounts.beneficiary_token_account;
    let token_program = &ctx.accounts.token_program;
    let clock = Clock::get()?;
    let current_time = clock.unix_timestamp;
    
    // Check if vesting has started
    if current_time < employee_vesting.start_time {
        return Err(TokenVestingError::VestingNotStarted.into());
    }
    
    // Calculate vested amount
    let total_vesting_time = employee_vesting.end_time - employee_vesting.start_time;
    let time_since_start = current_time - employee_vesting.start_time;
    
    // Cap the elapsed time to the total vesting time
    let elapsed_time = std::cmp::min(time_since_start, total_vesting_time);
    
    // Calculate the vested amount based on linear vesting
    let vested_amount = if total_vesting_time <= 0 {
        // If end_time <= start_time, all tokens are vested immediately
        employee_vesting.total_amount
    } else {
        // Linear vesting formula: (elapsed_time / total_vesting_time) * total_amount
        (elapsed_time as i128 * employee_vesting.total_amount as i128 / total_vesting_time as i128) as i64
    };
    
    // Calculate the amount available to claim (vested amount minus already withdrawn)
    let available_to_claim = vested_amount - employee_vesting.total_withdraw;
    
    // Check if there's anything to claim
    if available_to_claim <= 0 {
        return Err(TokenVestingError::InsufficientVestedAmount.into());
    }
    
    // Convert to u64 for token transfer
    let amount_to_transfer = available_to_claim as u64;
    
    // Create the seeds for signing
    let company_name_bytes = vesting_account.company_name.as_bytes();
    let seeds = &[
        b"treasury",
        company_name_bytes,
        &[vesting_account.treasury_bump],
    ];
    let signer_seeds = &[&seeds[..]];
    
    // Transfer tokens from treasury to beneficiary
    let transfer_instruction = Transfer {
        from: treasury_token_account.to_account_info(),
        to: beneficiary_token_account.to_account_info(),
        authority: treasury_token_account.to_account_info(),
    };
    
    token::transfer(
        CpiContext::new_with_signer(
            token_program.to_account_info(),
            transfer_instruction,
            signer_seeds,
        ),
        amount_to_transfer,
    )?;
    
    // Update the total withdrawn amount
    employee_vesting.total_withdraw += available_to_claim;
    
    msg!("Claimed {} tokens for beneficiary: {}", amount_to_transfer, employee_vesting.beneficiary);
    msg!("Total withdrawn so far: {}", employee_vesting.total_withdraw);
    
    Ok(())
}