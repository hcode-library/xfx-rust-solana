import { BadRequestException, Injectable, OnModuleInit } from '@nestjs/common';
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import * as fs from 'fs';
import * as crypto from 'crypto';
import { readFile, writeFile } from 'fs/promises';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService implements OnModuleInit {
  private connection = new Connection('http://localhost:8899', 'confirmed');
  private payer = Keypair.fromSecretKey(
    Uint8Array.from(
      JSON.parse(
        fs.readFileSync('../meu_solana_programa/my-keypair.json', 'utf-8'),
      ),
    ),
  );
  private programId = new PublicKey(
    '** SEU PROGRAM ID **',
  );

  private genAI: GoogleGenerativeAI;

  constructor(private config: ConfigService) {}

  async onModuleInit() {
    await this.initSolana();
    await this.initGoogleGenerativeAI();
  }

  async initSolana() {
    try {
      await this.connection.getVersion();
      console.log('Conexão com o Solana estabelecida com sucesso!');
      // Verifica o saldo da conta do pagador
      const balance = await this.connection.getBalance(this.payer.publicKey);
      console.log(`Saldo da conta do pagador: ${balance} lamports`);
    } catch (error) {
      console.error('Erro ao conectar ao Solana:', error);
    }
  }

  async initGoogleGenerativeAI() {
    this.genAI = new GoogleGenerativeAI(
      await this.config.get<string>('GOOGLE_API_KEY', ''),
    );
  }

  hashString(file: Express.Multer.File): Buffer {
    return crypto
      .createHash('sha256')
      .update(file.buffer.toString('utf-8'))
      .digest();
  }

  async registerHash(file: Express.Multer.File) {
    await this.isFileValid(file);
    const hash = this.hashString(file); // 32 bytes

    // Cria uma nova conta para armazenar o hash
    const hashAccount = Keypair.generate();
    const space = 32; // apenas o hash (sem overhead Borsh extra aqui)
    const lamports =
      await this.connection.getMinimumBalanceForRentExemption(space);

    const createIx = SystemProgram.createAccount({
      fromPubkey: this.payer.publicKey,
      newAccountPubkey: hashAccount.publicKey,
      space,
      lamports,
      programId: this.programId,
    });

    // Cria a instrução para registrar o hash na conta [PRINCIPAL]
    const registerIx = new TransactionInstruction({
      keys: [
        { pubkey: hashAccount.publicKey, isSigner: false, isWritable: true },
      ],
      programId: this.programId,
      data: hash,
    });

    const tx = new Transaction().add(createIx, registerIx);
    const signature = await sendAndConfirmTransaction(this.connection, tx, [
      this.payer,
      hashAccount,
    ]);

    return {
      signature,
      account: hashAccount.publicKey.toBase58(),
      hash: hash.toString('hex'),
    };
  }

  async analyzeWithAI(file: Express.Multer.File) {
    await this.isFileValid(file);
    const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `Você é um advogado assistente virtual com 25 anos de experiência em análise e revisão contratual, especializado nas melhores práticas do mercado. Ao analisar cada contrato fornecido, sua tarefa é:\n\nIdentificar cláusulas essenciais que estejam ausentes e que deveriam constar no documento;\n\nAvaliar a redação das cláusulas existentes, sugerindo melhorias para garantir clareza, segurança jurídica e conformidade com padrões atualizados;\n\nRealizar todos os ajustes diretamente no texto do contrato, aplicando as melhorias e correções necessárias;\n\nRetornar o texto completo do contrato já revisado;\n\nSeja criterioso, objetivo e fundamente suas sugestões com base em boas práticas jurídicas.`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: file.mimetype,
          data: file.buffer.toString('base64'),
        },
      },
    ]);

    const response = await result.response;
    const text = response.text();

    return {
      text,
    };
  }

  async isFileValid(file: Express.Multer.File) {
    if (file.mimetype !== 'application/pdf') {
      throw new BadRequestException('O arquivo enviado não é um PDF válido.');
    }
  }

  async verifyHash(accountBase58: string, file: Express.Multer.File) {
    await this.isFileValid(file);

    const hash = this.hashString(file); // 32 bytes
    // Converte a chave pública de Base58 para o formato PublicKey
    const accountPublicKey = new PublicKey(accountBase58);

    // Obtém as informações da conta na blockchain
    const accountInfo = await this.connection.getAccountInfo(accountPublicKey);

    if (accountInfo) {
      // Extrai os dados armazenados na conta
      const storedHash = accountInfo.data.toString('hex'); // Converte os dados para hexadecimal
      return {
        isValid: storedHash === hash.toString('hex'),
        storedHash,
      };
    } else {
      throw new BadRequestException('Conta não encontrada');
    }
  }
}
