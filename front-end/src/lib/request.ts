import axios, { AxiosRequestConfig } from 'axios';

export const request = (config: AxiosRequestConfig) => {
  const instance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
  });

  return instance(config);
};
