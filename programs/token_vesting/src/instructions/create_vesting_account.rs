use crate::*;
use anchor_lang::prelude::*;

use anchor_spl::{
    token::{Mint, Token, TokenAccount},
    associated_token::AssociatedToken,
};

#[derive(Accounts)]
#[instruction(
    company_name: String,
)]
pub struct CreateVestingAccount<'info> {
    #[account(mut)]
    pub fee_payer: Signer<'info>,

    #[account(
        init,
        space = 8 + // discriminator
               32 + // owner: Pubkey
               32 + // mint_token: Pubkey
               4 + company_name.len() + // company_name: String
               32 + // treasury_token_account: Pubkey
               1 + // treasury_bump: u8
               1, // bump: u8
        payer = fee_payer,
        seeds = [
            company_name.as_bytes().as_ref(),
        ],
        bump,
    )]
    pub vesting_account: Account<'info, VestingAccount>,

    pub mint_token: Account<'info, Mint>,

    #[account(
        init,
        payer = fee_payer,
        seeds = [
            b"treasury",
            company_name.as_bytes().as_ref(),
        ],
        bump,
        token::mint = mint_token,
        token::authority = vesting_account,
    )]
    pub treasury_token_account: Account<'info, TokenAccount>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

/// Creates a new vesting account for a company
///
/// Accounts:
/// 0. `[signer, writable]` fee_payer: [AccountInfo] The fee payer and owner of the vesting account
/// 1. `[writable]` vesting_account: [VestingAccount] The vesting account to be created
/// 2. `[]` mint_token: [Mint] The token mint address
/// 3. `[writable]` treasury_token_account: [TokenAccount] The token account that will hold the tokens to be vested
/// 4. `[]` system_program: [AccountInfo] System program for account creation
/// 5. `[]` token_program: [AccountInfo] Token program for token account creation
/// 6. `[]` rent: [AccountInfo] Rent sysvar
///
/// Data:
/// - company_name: [String] The name of the company
pub fn handler(
    ctx: Context<CreateVestingAccount>,
    company_name: String,
) -> Result<()> {
    let vesting_account = &mut ctx.accounts.vesting_account;
    let treasury_token_account = &ctx.accounts.treasury_token_account;
    let fee_payer = &ctx.accounts.fee_payer;
    let mint_token = &ctx.accounts.mint_token;
    
    // Get the bump for the vesting account
    let bump = ctx.bumps.vesting_account;
    
    // Get the treasury bump
    let treasury_bump = ctx.bumps.treasury_token_account;
    
    // Initialize the vesting account
    vesting_account.owner = fee_payer.key();
    vesting_account.mint_token = mint_token.key();
    vesting_account.company_name = company_name.clone();
    vesting_account.treasury_token_account = treasury_token_account.key();
    vesting_account.treasury_bump = treasury_bump;
    vesting_account.bump = bump;
    
    msg!("Vesting account created for company: {}", company_name);
    msg!("Treasury token account created with bump: {}", treasury_bump);
    
    Ok(())
}