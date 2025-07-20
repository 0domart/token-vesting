// This file is auto-generated from the CIDL source.
// Editing this file directly is not recommended as it may be overwritten.
//
// Docs: https://docs.codigo.ai/c%C3%B3digo-interface-description-language/specification#errors

use anchor_lang::prelude::*;

#[error_code]
pub enum TokenVestingError {
	#[msg("Only the owner can perform this action")]
	NotOwner,
	#[msg("End time must be after start time")]
	InvalidTimeRange,
	#[msg("Vesting period has not started yet")]
	VestingNotStarted,
	#[msg("Insufficient vested amount available to claim")]
	InsufficientVestedAmount,
	#[msg("Beneficiary does not match the employee vesting account")]
	BeneficiaryMismatch,
	#[msg("Not authorized to perform this action")]
	NotAuthorized,
	#[msg("Invalid vesting schedule parameters")]
	InvalidVestingSchedule,
	#[msg("Invalid amount for vesting")]
	InvalidAmount,
}