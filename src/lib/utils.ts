import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function handleApiError(error: any, context: string): never {
  console.error(`Erro em ${context}:`, error);
  if (error instanceof TypeError && error.message === 'Failed to fetch') {
    throw new Error('Falha de conexão. Verifique sua internet ou se o serviço está disponível.');
  }
  if (error?.code === '23505') {
    throw new Error('Registro duplicado encontrado.');
  }
  throw error;
}
