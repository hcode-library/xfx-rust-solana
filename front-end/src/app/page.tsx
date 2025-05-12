'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { request } from '@/lib/request';
import { CampoCopiavel } from '@/components/campo-copiavel';

interface UploadResult {
  certificateHash?: string;
  publicKey?: string;
  message?: string;
}

const HomePage = () => {
  const [contractFile, setContractFile] = useState<File | null>(null);
  const [publicKeyToCheck, setPublicKeyToCheck] = useState('');
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string | null>(null);
  const [applySuggestions, setApplySuggestions] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setContractFile(acceptedFiles[0]);
      setAiSuggestions(null); // Clear previous suggestions on new upload
      setUploadResult(null); // Clear previous results
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const handleUpload = async () => {
    if (!contractFile) {
      toast.error('Por favor, selecione um arquivo de contrato.');
      return;
    }

    setIsSubmitting(true);
    setUploadResult(null);
    setAiSuggestions(null);

    try {

      const formData = new FormData();
      formData.append('file', contractFile);

      const {
        data: { text },
      } = await request({
        url: '/analyze',
        method: 'POST',
        data: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setAiSuggestions(text);

      toast.success('Contrato enviado para análise.');
    } catch (error: any) {
      console.error('Erro ao enviar contrato:', error);
      toast.error('Erro ao enviar o contrato.');
      setUploadResult({ message: 'Erro ao processar o contrato.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async () => {
    if (!contractFile) {
      toast.error('Por favor, selecione um arquivo de contrato.');
      return;
    }

    setIsSubmitting(true);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append('file', contractFile);


      const {
        data: { hash, account },
      } = await request({
        url: '/register',
        method: 'POST',
        data: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const registrationResult: UploadResult = {
        certificateHash: hash,
        publicKey: account,
        message: applySuggestions
          ? 'Contrato com sugestões registrado com sucesso!'
          : 'Contrato registrado com sucesso!',
      };
      setUploadResult(registrationResult);
      toast.success('Contrato registrado na blockchain Solana!');
    } catch (error: any) {
      console.error('Erro ao registrar contrato:', error);
      toast.error('Erro ao registrar o contrato.');
      setUploadResult({ message: 'Erro ao registrar o contrato.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckRegistration = async () => {
    if (!publicKeyToCheck) {
      toast.error('Por favor, insira a chave pública para verificar.');
      return;
    }

    if (!contractFile) {
      toast.error('Por favor, selecione um arquivo de contrato.');
      return;
    }

    setIsSubmitting(true);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append('file', contractFile);
      formData.append('account', publicKeyToCheck);

      const {
        data: { storedHash, isValid },
      } = await request({
        url: '/verify',
        method: 'POST',
        data: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (isValid) {
        setUploadResult({
          message: `A chave pública "${publicKeyToCheck}" está registrada.`,
        });
        toast.success('Chave pública encontrada.');
      } else {
        setUploadResult({
          message: `A chave pública "${publicKeyToCheck}" não está registrada.`,
        });
        toast.warning('Chave pública não encontrada.');
      }
    } catch (error: any) {
      console.error('Erro ao verificar registro:', error);
      toast.error('Erro ao verificar o registro.');
      setUploadResult({ message: 'Erro ao verificar o registro.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold mb-6 text-center">
        Registro de Contrato na Solana
      </h1>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Enviar e Analisar Contrato</CardTitle>
            <CardDescription>
              Envie seu contrato para análise e sugestões de melhoria com IA.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              {...getRootProps()}
              className={cn(
                'flex items-center justify-center w-full p-6 border-2 border-dashed rounded-md cursor-pointer',
                isDragActive ? 'bg-gray-100 border-primary' : 'border-gray-300'
              )}
            >
              <input {...getInputProps()} />
              {contractFile ? (
                <p className="text-sm text-gray-500">
                  Arquivo selecionado: {contractFile.name}
                </p>
              ) : (
                <p className="text-sm text-gray-500">
                  Arraste e solte seu arquivo aqui ou clique para selecionar.
                </p>
              )}
            </div>

            {contractFile && (
              <Button onClick={handleUpload} disabled={isSubmitting} variant={"outline"} className='mr-2'>
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Analisar Contrato
              </Button>
            )}

            {aiSuggestions && (
              <div className="mt-4">
                <Label>Sugestões de Melhoria (IA)</Label>
                <Textarea value={aiSuggestions} readOnly className="mt-2" />
                <div className="flex items-center space-x-2 mt-2">
                  <Checkbox
                    id="apply-suggestions"
                    checked={applySuggestions}
                    onCheckedChange={(checked) =>
                      setApplySuggestions(checked === true)
                    }
                  />
                  <Label htmlFor="apply-suggestions">
                    Aplicar sugestões na hora do registro
                  </Label>
                </div>
              </div>
            )}

            {contractFile && (
              <Button onClick={handleRegister} disabled={isSubmitting} variant={"outline"}>
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Registrar Contrato na Solana
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Verificar Registro</CardTitle>
            <CardDescription>
              Insira a chave pública do contrato para verificar se já está
              registrado na Solana.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="public-key">Chave Pública do Contrato</Label>
              <Input
                id="public-key"
                type="text"
                placeholder="Ex: Gh94HFjdhskj..."
                value={publicKeyToCheck}
                onChange={(e) => setPublicKeyToCheck(e.target.value)}
              />
            </div>
            <Button onClick={handleCheckRegistration} disabled={isSubmitting} variant={"outline"}>
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Verificar Registro
            </Button>
          </CardContent>
        </Card>
      </div>

      {uploadResult && (
        <div className="mt-8 p-4 rounded-md bg-gray-100 border border-gray-200">
          <h2 className="text-lg font-semibold mb-2">Resultado</h2>
          {uploadResult.certificateHash && (
            <CampoCopiavel label="Hash do Certificado:" valor={uploadResult.certificateHash} />
            
          )}
          {uploadResult.publicKey && ( 
            <CampoCopiavel label="Chave Pública do Contrato:" valor={uploadResult.publicKey} />
          )}
          {uploadResult.message && <p>{uploadResult.message}</p>}
        </div>
      )}
    </div>
  );
};

export default HomePage;
