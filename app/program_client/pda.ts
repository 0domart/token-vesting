import {PublicKey} from "@solana/web3.js";
import {BN} from "@coral-xyz/anchor";

export type VestingAccountSeedsSeeds = {
    companyName: string, 
};

export const deriveVestingAccountSeedsPDA = (
    seeds: VestingAccountSeedsSeeds,
    programId: PublicKey
): [PublicKey, number] => {
    return PublicKey.findProgramAddressSync(
        [
            Buffer.from(seeds.companyName, "utf8"),
        ],
        programId,
    )
};

export type EmployeeVestingSeedsSeeds = {
    beneficiary: PublicKey, 
    vestingAccount: PublicKey, 
};

export const deriveEmployeeVestingSeedsPDA = (
    seeds: EmployeeVestingSeedsSeeds,
    programId: PublicKey
): [PublicKey, number] => {
    return PublicKey.findProgramAddressSync(
        [
            Buffer.from("employee"),
            seeds.beneficiary.toBuffer(),
            seeds.vestingAccount.toBuffer(),
        ],
        programId,
    )
};

export module CslSplTokenPDAs {
    export type AccountSeeds = {
        wallet: PublicKey, 
        tokenProgram: PublicKey, 
        mint: PublicKey, 
    };
    
    export const deriveAccountPDA = (
        seeds: AccountSeeds,
        programId: PublicKey
    ): [PublicKey, number] => {
        return PublicKey.findProgramAddressSync(
            [
                seeds.wallet.toBuffer(),
                seeds.tokenProgram.toBuffer(),
                seeds.mint.toBuffer(),
            ],
            programId,
        )
    };
    
}

