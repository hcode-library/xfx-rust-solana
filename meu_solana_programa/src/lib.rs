use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint,
    entrypoint::ProgramResult,
    msg,
    pubkey::Pubkey,
    program_error::ProgramError,
};

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct HashRecord {
    pub hash: [u8; 32],
}

entrypoint!(process_instruction);

pub fn process_instruction(
    _program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    msg!("Processando registro de hash...");
    
    let accounts_iter = &mut accounts.iter();

    let target_account = next_account_info(accounts_iter)?;

    if instruction_data.len() != 32 {
        msg!("Erro: Dados de instrução inválidos");
        return Err(ProgramError::InvalidInstructionData);
    }

    let hash: [u8; 32] = instruction_data.try_into().unwrap();

    let record = HashRecord { hash };

    let mut data = target_account.try_borrow_mut_data()?;

    record.serialize(&mut &mut data[..])?;

    msg!("Hash registrado com sucesso.");

    Ok(())
        
        
}
