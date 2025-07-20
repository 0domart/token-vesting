import {
  AnchorProvider,
  BN,
  IdlAccounts,
  Program,
  web3,
} from "@coral-xyz/anchor";
import { MethodsBuilder } from "@coral-xyz/anchor/dist/cjs/program/namespace/methods";
import { TokenVesting } from "../../target/types/token_vesting";
import idl from "../../target/idl/token_vesting.json";
import * as pda from "./pda";

import { CslSplToken } from "../../target/types/csl_spl_token";
import idlCslSplToken from "../../target/idl/csl_spl_token.json";



let _program: Program<TokenVesting>;
let _programCslSplToken: Program<CslSplToken>;


export const initializeClient = (
    programId: web3.PublicKey,
    anchorProvider = AnchorProvider.env(),
) => {
    _program = new Program<TokenVesting>(
        idl as never,
        programId,
        anchorProvider,
    );

    _programCslSplToken = new Program<CslSplToken>(
        idlCslSplToken as never,
        new web3.PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
        anchorProvider,
    );

};

export type CreateVestingAccountArgs = {
  feePayer: web3.PublicKey;
  owner: web3.PublicKey;
  mintToken: web3.PublicKey;
  treasuryTokenAccount: web3.PublicKey;
  companyName: string;
};

/**
 * ### Returns a {@link MethodsBuilder}
 * Creates a new vesting account for a company
 *
 * Accounts:
 * 0. `[signer]` fee_payer: {@link PublicKey} 
 * 1. `[writable]` vesting_account: {@link VestingAccount} The vesting account to be created
 * 2. `[signer]` owner: {@link PublicKey} The owner of the vesting account
 * 3. `[]` mint_token: {@link Mint} The token mint address
 * 4. `[writable, signer]` treasury_token_account: {@link PublicKey} The token account that will hold the tokens to be vested
 * 5. `[]` system_program: {@link PublicKey} Auto-generated, for account initialization
 *
 * Data:
 * - company_name: {@link string} The name of the company
 */
export const createVestingAccountBuilder = (
	args: CreateVestingAccountArgs,
	remainingAccounts: Array<web3.AccountMeta> = [],
): MethodsBuilder<TokenVesting, never> => {
    const [vestingAccountPubkey] = pda.deriveVestingAccountSeedsPDA({
        companyName: args.companyName,
    }, _program.programId);

  return _program
    .methods
    .createVestingAccount(
      args.companyName,
    )
    .accountsStrict({
      feePayer: args.feePayer,
      vestingAccount: vestingAccountPubkey,
      owner: args.owner,
      mintToken: args.mintToken,
      treasuryTokenAccount: args.treasuryTokenAccount,
      systemProgram: new web3.PublicKey("11111111111111111111111111111111"),
    })
    .remainingAccounts(remainingAccounts);
};

/**
 * ### Returns a {@link web3.TransactionInstruction}
 * Creates a new vesting account for a company
 *
 * Accounts:
 * 0. `[signer]` fee_payer: {@link PublicKey} 
 * 1. `[writable]` vesting_account: {@link VestingAccount} The vesting account to be created
 * 2. `[signer]` owner: {@link PublicKey} The owner of the vesting account
 * 3. `[]` mint_token: {@link Mint} The token mint address
 * 4. `[writable, signer]` treasury_token_account: {@link PublicKey} The token account that will hold the tokens to be vested
 * 5. `[]` system_program: {@link PublicKey} Auto-generated, for account initialization
 *
 * Data:
 * - company_name: {@link string} The name of the company
 */
export const createVestingAccount = (
	args: CreateVestingAccountArgs,
	remainingAccounts: Array<web3.AccountMeta> = [],
): Promise<web3.TransactionInstruction> =>
    createVestingAccountBuilder(args, remainingAccounts).instruction();

/**
 * ### Returns a {@link web3.TransactionSignature}
 * Creates a new vesting account for a company
 *
 * Accounts:
 * 0. `[signer]` fee_payer: {@link PublicKey} 
 * 1. `[writable]` vesting_account: {@link VestingAccount} The vesting account to be created
 * 2. `[signer]` owner: {@link PublicKey} The owner of the vesting account
 * 3. `[]` mint_token: {@link Mint} The token mint address
 * 4. `[writable, signer]` treasury_token_account: {@link PublicKey} The token account that will hold the tokens to be vested
 * 5. `[]` system_program: {@link PublicKey} Auto-generated, for account initialization
 *
 * Data:
 * - company_name: {@link string} The name of the company
 */
export const createVestingAccountSendAndConfirm = async (
  args: Omit<CreateVestingAccountArgs, "feePayer" | "owner" | "treasuryTokenAccount"> & {
    signers: {
      feePayer: web3.Signer,
      owner: web3.Signer,
      treasuryTokenAccount: web3.Signer,
    },
  },
  remainingAccounts: Array<web3.AccountMeta> = [],
): Promise<web3.TransactionSignature> => {
  const preInstructions: Array<web3.TransactionInstruction> = [];


  return createVestingAccountBuilder({
      ...args,
      feePayer: args.signers.feePayer.publicKey,
      owner: args.signers.owner.publicKey,
      treasuryTokenAccount: args.signers.treasuryTokenAccount.publicKey,
    }, remainingAccounts)
    .preInstructions(preInstructions)
    .signers([args.signers.feePayer, args.signers.owner, args.signers.treasuryTokenAccount])
    .rpc();
}

export type CreateEmployeeVestingArgs = {
  feePayer: web3.PublicKey;
  owner: web3.PublicKey;
  treasuryTokenAccount: web3.PublicKey;
  ownerTokenAccount: web3.PublicKey;
  beneficiary: web3.PublicKey;
  companyName: string;
  startTime: bigint;
  endTime: bigint;
  totalAmount: bigint;
};

/**
 * ### Returns a {@link MethodsBuilder}
 * Creates a new vesting schedule for an employee
 *
 * Accounts:
 * 0. `[signer]` fee_payer: {@link PublicKey} 
 * 1. `[]` vesting_account: {@link VestingAccount} The vesting account
 * 2. `[writable]` employee_vesting: {@link EmployeeVesting} The employee vesting account to be created
 * 3. `[signer]` owner: {@link PublicKey} The owner of the vesting account
 * 4. `[writable]` treasury_token_account: {@link PublicKey} The token account that holds the tokens to be vested
 * 5. `[]` owner_token_account: {@link PublicKey} The token account of the owner
 * 6. `[]` system_program: {@link PublicKey} Auto-generated, for account initialization
 *
 * Data:
 * - beneficiary: {@link PublicKey} The employee who will receive the tokens
 * - company_name: {@link string} The name of the company
 * - start_time: {@link BigInt} The timestamp when vesting begins
 * - end_time: {@link BigInt} The timestamp when vesting ends
 * - total_amount: {@link BigInt} The total amount of tokens to be vested
 */
export const createEmployeeVestingBuilder = (
	args: CreateEmployeeVestingArgs,
	remainingAccounts: Array<web3.AccountMeta> = [],
): MethodsBuilder<TokenVesting, never> => {
    const [vestingAccountPubkey] = pda.deriveVestingAccountSeedsPDA({
        companyName: args.companyName,
    }, _program.programId);
    const [employeeVestingPubkey] = pda.deriveEmployeeVestingSeedsPDA({
        beneficiary: args.beneficiary,
        vestingAccount: args.vestingAccount,
    }, _program.programId);

  return _program
    .methods
    .createEmployeeVesting(
      args.beneficiary,
      args.companyName,
      new BN(args.startTime.toString()),
      new BN(args.endTime.toString()),
      new BN(args.totalAmount.toString()),
    )
    .accountsStrict({
      feePayer: args.feePayer,
      vestingAccount: vestingAccountPubkey,
      employeeVesting: employeeVestingPubkey,
      owner: args.owner,
      treasuryTokenAccount: args.treasuryTokenAccount,
      ownerTokenAccount: args.ownerTokenAccount,
      systemProgram: new web3.PublicKey("11111111111111111111111111111111"),
    })
    .remainingAccounts(remainingAccounts);
};

/**
 * ### Returns a {@link web3.TransactionInstruction}
 * Creates a new vesting schedule for an employee
 *
 * Accounts:
 * 0. `[signer]` fee_payer: {@link PublicKey} 
 * 1. `[]` vesting_account: {@link VestingAccount} The vesting account
 * 2. `[writable]` employee_vesting: {@link EmployeeVesting} The employee vesting account to be created
 * 3. `[signer]` owner: {@link PublicKey} The owner of the vesting account
 * 4. `[writable]` treasury_token_account: {@link PublicKey} The token account that holds the tokens to be vested
 * 5. `[]` owner_token_account: {@link PublicKey} The token account of the owner
 * 6. `[]` system_program: {@link PublicKey} Auto-generated, for account initialization
 *
 * Data:
 * - beneficiary: {@link PublicKey} The employee who will receive the tokens
 * - company_name: {@link string} The name of the company
 * - start_time: {@link BigInt} The timestamp when vesting begins
 * - end_time: {@link BigInt} The timestamp when vesting ends
 * - total_amount: {@link BigInt} The total amount of tokens to be vested
 */
export const createEmployeeVesting = (
	args: CreateEmployeeVestingArgs,
	remainingAccounts: Array<web3.AccountMeta> = [],
): Promise<web3.TransactionInstruction> =>
    createEmployeeVestingBuilder(args, remainingAccounts).instruction();

/**
 * ### Returns a {@link web3.TransactionSignature}
 * Creates a new vesting schedule for an employee
 *
 * Accounts:
 * 0. `[signer]` fee_payer: {@link PublicKey} 
 * 1. `[]` vesting_account: {@link VestingAccount} The vesting account
 * 2. `[writable]` employee_vesting: {@link EmployeeVesting} The employee vesting account to be created
 * 3. `[signer]` owner: {@link PublicKey} The owner of the vesting account
 * 4. `[writable]` treasury_token_account: {@link PublicKey} The token account that holds the tokens to be vested
 * 5. `[]` owner_token_account: {@link PublicKey} The token account of the owner
 * 6. `[]` system_program: {@link PublicKey} Auto-generated, for account initialization
 *
 * Data:
 * - beneficiary: {@link PublicKey} The employee who will receive the tokens
 * - company_name: {@link string} The name of the company
 * - start_time: {@link BigInt} The timestamp when vesting begins
 * - end_time: {@link BigInt} The timestamp when vesting ends
 * - total_amount: {@link BigInt} The total amount of tokens to be vested
 */
export const createEmployeeVestingSendAndConfirm = async (
  args: Omit<CreateEmployeeVestingArgs, "feePayer" | "owner"> & {
    signers: {
      feePayer: web3.Signer,
      owner: web3.Signer,
    },
  },
  remainingAccounts: Array<web3.AccountMeta> = [],
): Promise<web3.TransactionSignature> => {
  const preInstructions: Array<web3.TransactionInstruction> = [];


  return createEmployeeVestingBuilder({
      ...args,
      feePayer: args.signers.feePayer.publicKey,
      owner: args.signers.owner.publicKey,
    }, remainingAccounts)
    .preInstructions(preInstructions)
    .signers([args.signers.feePayer, args.signers.owner])
    .rpc();
}

export type ClaimTokensArgs = {
  feePayer: web3.PublicKey;
  beneficiary: web3.PublicKey;
  treasuryTokenAccount: web3.PublicKey;
  beneficiaryTokenAccount: web3.PublicKey;
  mintToken: web3.PublicKey;
  companyName: string;
};

/**
 * ### Returns a {@link MethodsBuilder}
 * Allows an employee to claim vested tokens
 *
 * Accounts:
 * 0. `[signer]` fee_payer: {@link PublicKey} 
 * 1. `[]` vesting_account: {@link VestingAccount} The vesting account
 * 2. `[writable]` employee_vesting: {@link EmployeeVesting} The employee vesting account
 * 3. `[signer]` beneficiary: {@link PublicKey} The employee who will receive the tokens
 * 4. `[writable]` treasury_token_account: {@link PublicKey} The token account that holds the tokens to be vested
 * 5. `[writable]` beneficiary_token_account: {@link PublicKey} The token account of the beneficiary
 * 6. `[]` mint_token: {@link Mint} The token mint address
 *
 * Data:
 * - company_name: {@link string} The name of the company
 */
export const claimTokensBuilder = (
	args: ClaimTokensArgs,
	remainingAccounts: Array<web3.AccountMeta> = [],
): MethodsBuilder<TokenVesting, never> => {
    const [vestingAccountPubkey] = pda.deriveVestingAccountSeedsPDA({
        companyName: args.companyName,
    }, _program.programId);
    const [employeeVestingPubkey] = pda.deriveEmployeeVestingSeedsPDA({
        beneficiary: args.beneficiary,
        vestingAccount: args.vestingAccount,
    }, _program.programId);

  return _program
    .methods
    .claimTokens(
      args.companyName,
    )
    .accountsStrict({
      feePayer: args.feePayer,
      vestingAccount: vestingAccountPubkey,
      employeeVesting: employeeVestingPubkey,
      beneficiary: args.beneficiary,
      treasuryTokenAccount: args.treasuryTokenAccount,
      beneficiaryTokenAccount: args.beneficiaryTokenAccount,
      mintToken: args.mintToken,
    })
    .remainingAccounts(remainingAccounts);
};

/**
 * ### Returns a {@link web3.TransactionInstruction}
 * Allows an employee to claim vested tokens
 *
 * Accounts:
 * 0. `[signer]` fee_payer: {@link PublicKey} 
 * 1. `[]` vesting_account: {@link VestingAccount} The vesting account
 * 2. `[writable]` employee_vesting: {@link EmployeeVesting} The employee vesting account
 * 3. `[signer]` beneficiary: {@link PublicKey} The employee who will receive the tokens
 * 4. `[writable]` treasury_token_account: {@link PublicKey} The token account that holds the tokens to be vested
 * 5. `[writable]` beneficiary_token_account: {@link PublicKey} The token account of the beneficiary
 * 6. `[]` mint_token: {@link Mint} The token mint address
 *
 * Data:
 * - company_name: {@link string} The name of the company
 */
export const claimTokens = (
	args: ClaimTokensArgs,
	remainingAccounts: Array<web3.AccountMeta> = [],
): Promise<web3.TransactionInstruction> =>
    claimTokensBuilder(args, remainingAccounts).instruction();

/**
 * ### Returns a {@link web3.TransactionSignature}
 * Allows an employee to claim vested tokens
 *
 * Accounts:
 * 0. `[signer]` fee_payer: {@link PublicKey} 
 * 1. `[]` vesting_account: {@link VestingAccount} The vesting account
 * 2. `[writable]` employee_vesting: {@link EmployeeVesting} The employee vesting account
 * 3. `[signer]` beneficiary: {@link PublicKey} The employee who will receive the tokens
 * 4. `[writable]` treasury_token_account: {@link PublicKey} The token account that holds the tokens to be vested
 * 5. `[writable]` beneficiary_token_account: {@link PublicKey} The token account of the beneficiary
 * 6. `[]` mint_token: {@link Mint} The token mint address
 *
 * Data:
 * - company_name: {@link string} The name of the company
 */
export const claimTokensSendAndConfirm = async (
  args: Omit<ClaimTokensArgs, "feePayer" | "beneficiary"> & {
    signers: {
      feePayer: web3.Signer,
      beneficiary: web3.Signer,
    },
  },
  remainingAccounts: Array<web3.AccountMeta> = [],
): Promise<web3.TransactionSignature> => {
  const preInstructions: Array<web3.TransactionInstruction> = [];


  return claimTokensBuilder({
      ...args,
      feePayer: args.signers.feePayer.publicKey,
      beneficiary: args.signers.beneficiary.publicKey,
    }, remainingAccounts)
    .preInstructions(preInstructions)
    .signers([args.signers.feePayer, args.signers.beneficiary])
    .rpc();
}

// Getters

export const getVestingAccount = (
    publicKey: web3.PublicKey,
    commitment?: web3.Commitment
): Promise<IdlAccounts<TokenVesting>["vestingAccount"]> => _program.account.vestingAccount.fetch(publicKey, commitment);

export const getEmployeeVesting = (
    publicKey: web3.PublicKey,
    commitment?: web3.Commitment
): Promise<IdlAccounts<TokenVesting>["employeeVesting"]> => _program.account.employeeVesting.fetch(publicKey, commitment);
export module CslSplTokenGetters {
    export const getMint = (
        publicKey: web3.PublicKey,
        commitment?: web3.Commitment
    ): Promise<IdlAccounts<CslSplToken>["mint"]> => _programCslSplToken.account.mint.fetch(publicKey, commitment);
    
    export const getAccount = (
        publicKey: web3.PublicKey,
        commitment?: web3.Commitment
    ): Promise<IdlAccounts<CslSplToken>["account"]> => _programCslSplToken.account.account.fetch(publicKey, commitment);
}

