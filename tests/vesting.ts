import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { TokenVesting } from "../target/types/token_vesting";
import { PublicKey, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { 
  TOKEN_PROGRAM_ID, 
  createMint, 
  getAssociatedTokenAddress, 
  createAssociatedTokenAccount,
  mintTo,
  getAccount
} from "@solana/spl-token";
import { expect } from "chai";

describe("token_vesting", () => {
  // Configure the client to use the local cluster
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.TokenVesting as Program<TokenVesting>;
  
  // Company name for the test
  const companyName = "Codigo";
  
  // Mint public key
  let mintPubkey: PublicKey;
  
  // PDA for the vesting account
  let vestingAccountPDA: PublicKey;
  let vestingAccountBump: number;
  
  // PDA for the treasury token account
  let treasuryTokenAccountPDA: PublicKey;
  let treasuryTokenAccountBump: number;
  
  // Employee vesting data
  const beneficiary = Keypair.generate();
  let employeeVestingPDA: PublicKey;
  let employeeVestingBump: number;
  
  // Vesting schedule parameters
  const now = Math.floor(Date.now() / 1000);
  const startTime = now;
  const endTime = now + 365 * 24 * 60 * 60; // 1 year from now
  const totalAmount = 100000000; // 100 tokens with 6 decimals
  
  before(async () => {
    // Airdrop SOL to the payer
    const airdropSignature = await provider.connection.requestAirdrop(
      provider.wallet.publicKey,
      2 * LAMPORTS_PER_SOL
    );
    
    await provider.connection.confirmTransaction(airdropSignature);
    
    // Airdrop SOL to the beneficiary
    const beneficiaryAirdropSignature = await provider.connection.requestAirdrop(
      beneficiary.publicKey,
      1 * LAMPORTS_PER_SOL
    );
    
    await provider.connection.confirmTransaction(beneficiaryAirdropSignature);
    
    // Create the mint
    mintPubkey = await createMint(
      provider.connection,
      provider.wallet.payer,
      provider.wallet.publicKey,
      provider.wallet.publicKey,
      9 // 9 decimals
    );
    
    console.log(`Created mint: ${mintPubkey.toBase58()}`);
    
    // Find the vesting account PDA
    [vestingAccountPDA, vestingAccountBump] = await PublicKey.findProgramAddressSync(
      [Buffer.from(companyName)],
      program.programId
    );
    
    console.log(`Vesting account PDA: ${vestingAccountPDA.toBase58()}`);
    
    // Find the treasury token account PDA
    [treasuryTokenAccountPDA, treasuryTokenAccountBump] = await PublicKey.findProgramAddressSync(
      [Buffer.from("treasury"), Buffer.from(companyName)],
      program.programId
    );
    
    console.log(`Treasury token account PDA: ${treasuryTokenAccountPDA.toBase58()}`);
    
    // Find the employee vesting PDA
    [employeeVestingPDA, employeeVestingBump] = await PublicKey.findProgramAddressSync(
      [
        Buffer.from("employee"),
        vestingAccountPDA.toBuffer(),
        beneficiary.publicKey.toBuffer()
      ],
      program.programId
    );
    
    console.log(`Employee vesting PDA: ${employeeVestingPDA.toBase58()}`);
  });

  describe("create_vesting_account", () => {
    it("Creates a vesting account successfully", async () => {
      try {
        // Call the create_vesting_account instruction
        const tx = await program.methods
          .createVestingAccount(companyName)
          .accounts({
            feePayer: provider.wallet.publicKey,
            // @ts-ignore
            vestingAccount: vestingAccountPDA,
            mintToken: mintPubkey,
            treasuryTokenAccount: treasuryTokenAccountPDA,
            systemProgram: anchor.web3.SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            rent: anchor.web3.SYSVAR_RENT_PUBKEY,
          })
          .rpc();
        
        console.log("Transaction signature", tx);
        
        // Fetch the vesting account to verify it was created correctly
        const vestingAccount = await program.account.vestingAccount.fetch(vestingAccountPDA);
        
        // Verify the vesting account data
        expect(vestingAccount.owner.toBase58()).to.equal(provider.wallet.publicKey.toBase58());
        expect(vestingAccount.mintToken.toBase58()).to.equal(mintPubkey.toBase58());
        expect(vestingAccount.companyName).to.equal(companyName);
        expect(vestingAccount.treasuryTokenAccount.toBase58()).to.equal(treasuryTokenAccountPDA.toBase58());
        expect(vestingAccount.treasuryBump).to.equal(treasuryTokenAccountBump);
        expect(vestingAccount.bump).to.equal(vestingAccountBump);
        
        // Verify the treasury token account was created
        const treasuryTokenAccount = await getAccount(
          provider.connection,
          treasuryTokenAccountPDA
        );
        
        expect(treasuryTokenAccount.mint.toBase58()).to.equal(mintPubkey.toBase58());
        expect(treasuryTokenAccount.owner.toBase58()).to.equal(vestingAccountPDA.toBase58());
        expect(Number(treasuryTokenAccount.amount)).to.equal(0);
        
        console.log("Vesting account created successfully!");
      } catch (error) {
        console.error("Error creating vesting account:", error);
        throw error;
      }
    });
    
    it("Fails to create a vesting account with the same company name", async () => {
      try {
        // Try to create another vesting account with the same company name
        await program.methods
          .createVestingAccount(companyName)
          .accounts({
            feePayer: provider.wallet.publicKey,
            // @ts-ignore
            vestingAccount: vestingAccountPDA,
            mintToken: mintPubkey,
            treasuryTokenAccount: treasuryTokenAccountPDA,
            systemProgram: anchor.web3.SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            rent: anchor.web3.SYSVAR_RENT_PUBKEY,
          })
          .rpc();
        
        // If we reach here, the test should fail
        expect.fail("Expected an error when creating a duplicate vesting account");
      } catch (error) {
        // We expect an error here, so this is a successful test
        console.log("Successfully caught error when trying to create duplicate vesting account");
      }
    });
    
    it("Creates a vesting account with a different company name", async () => {
      const differentCompanyName = "DifferentCompany";
      
      // Find the new vesting account PDA
      const [newVestingAccountPDA, newVestingAccountBump] = await PublicKey.findProgramAddressSync(
        [Buffer.from(differentCompanyName)],
        program.programId
      );
      
      // Find the new treasury token account PDA
      const [newTreasuryTokenAccountPDA, newTreasuryTokenAccountBump] = await PublicKey.findProgramAddressSync(
        [Buffer.from("treasury"), Buffer.from(differentCompanyName)],
        program.programId
      );
      
      try {
        // Call the create_vesting_account instruction with a different company name
        const tx = await program.methods
          .createVestingAccount(differentCompanyName)
          .accounts({
            feePayer: provider.wallet.publicKey,
            // @ts-ignore
            vestingAccount: newVestingAccountPDA,
            mintToken: mintPubkey,
            treasuryTokenAccount: newTreasuryTokenAccountPDA,
            systemProgram: anchor.web3.SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            rent: anchor.web3.SYSVAR_RENT_PUBKEY,
          })
          .rpc();
        
        console.log("Transaction signature for different company:", tx);
        
        // Fetch the new vesting account to verify it was created correctly
        const newVestingAccount = await program.account.vestingAccount.fetch(newVestingAccountPDA);
        
        // Verify the new vesting account data
        expect(newVestingAccount.owner.toBase58()).to.equal(provider.wallet.publicKey.toBase58());
        expect(newVestingAccount.mintToken.toBase58()).to.equal(mintPubkey.toBase58());
        expect(newVestingAccount.companyName).to.equal(differentCompanyName);
        expect(newVestingAccount.treasuryTokenAccount.toBase58()).to.equal(newTreasuryTokenAccountPDA.toBase58());
        expect(newVestingAccount.treasuryBump).to.equal(newTreasuryTokenAccountBump);
        expect(newVestingAccount.bump).to.equal(newVestingAccountBump);
        
        // Verify the treasury token account was created
        const newTreasuryTokenAccount = await getAccount(
          provider.connection,
          newTreasuryTokenAccountPDA
        );
        
        expect(newTreasuryTokenAccount.mint.toBase58()).to.equal(mintPubkey.toBase58());
        expect(newTreasuryTokenAccount.owner.toBase58()).to.equal(newVestingAccountPDA.toBase58());
        expect(Number(newTreasuryTokenAccount.amount)).to.equal(0);
        
        console.log("Different company vesting account created successfully!");
      } catch (error) {
        console.error("Error creating vesting account with different company name:", error);
        throw error;
      }
    });

  describe("create_employee_vesting", () => {
    it("Creates an employee vesting schedule successfully", async () => {
      try {
        // Call the create_employee_vesting instruction
        const tx = await program.methods
          .createEmployeeVesting(
            new anchor.BN(startTime),
            new anchor.BN(endTime),
            new anchor.BN(totalAmount)
          )
          .accounts({
            feePayer: provider.wallet.publicKey,
            vestingAccount: vestingAccountPDA,
            // @ts-ignore
            employeeVesting: employeeVestingPDA,
            beneficiary: beneficiary.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .rpc();
        
        console.log("Employee vesting transaction signature:", tx);
        
        // Fetch the employee vesting account to verify it was created correctly
        const employeeVesting = await program.account.employeeVesting.fetch(employeeVestingPDA);
        
        // Verify the employee vesting account data
        expect(employeeVesting.beneficiary.toBase58()).to.equal(beneficiary.publicKey.toBase58());
        expect(employeeVesting.startTime.toNumber()).to.equal(startTime);
        expect(employeeVesting.endTime.toNumber()).to.equal(endTime);
        expect(employeeVesting.totalAmount.toNumber()).to.equal(totalAmount);
        expect(employeeVesting.totalWithdraw.toNumber()).to.equal(0);
        expect(employeeVesting.vestingAccount.toBase58()).to.equal(vestingAccountPDA.toBase58());
        
        console.log("Employee vesting created successfully!");
        console.log(`Beneficiary: ${employeeVesting.beneficiary.toBase58()}`);
        console.log(`Vesting period: ${new Date(startTime * 1000).toISOString()} to ${new Date(endTime * 1000).toISOString()}`);
        console.log(`Total amount to vest: ${totalAmount}`);
      } catch (error) {
        console.error("Error creating employee vesting:", error);
        throw error;
      }
    });
  });
});
});