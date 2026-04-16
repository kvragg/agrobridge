// Tipos gerados pelo Supabase CLI: `supabase gen types typescript --local > types/database.ts`
// Este arquivo é um stub — substitua pelo gerado após rodar a migration no Supabase.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      processos: {
        Row: {
          id: string
          user_id: string
          status: 'entrevista' | 'checklist' | 'documentos' | 'concluido'
          perfil_json: Json | null
          banco: string | null
          valor: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          status?: 'entrevista' | 'checklist' | 'documentos' | 'concluido'
          perfil_json?: Json | null
          banco?: string | null
          valor?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          status?: 'entrevista' | 'checklist' | 'documentos' | 'concluido'
          perfil_json?: Json | null
          banco?: string | null
          valor?: number | null
          updated_at?: string
        }
      }
      mensagens: {
        Row: {
          id: string
          processo_id: string
          role: 'user' | 'assistant'
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          processo_id: string
          role: 'user' | 'assistant'
          content: string
          created_at?: string
        }
        Update: {
          role?: 'user' | 'assistant'
          content?: string
        }
      }
      checklist_itens: {
        Row: {
          id: string
          processo_id: string
          bloco: string
          documento_id: string
          nome: string
          urgencia: 'BLOQUEADOR' | 'ALTA' | 'NORMAL' | 'NA_HORA'
          status: 'pendente' | 'em_andamento' | 'enviado' | 'aprovado'
          dados_json: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          processo_id: string
          bloco: string
          documento_id: string
          nome: string
          urgencia: 'BLOQUEADOR' | 'ALTA' | 'NORMAL' | 'NA_HORA'
          status?: 'pendente' | 'em_andamento' | 'enviado' | 'aprovado'
          dados_json?: Json | null
          created_at?: string
        }
        Update: {
          status?: 'pendente' | 'em_andamento' | 'enviado' | 'aprovado'
          dados_json?: Json | null
        }
      }
      uploads: {
        Row: {
          id: string
          checklist_item_id: string
          user_id: string
          storage_path: string
          nome_arquivo: string
          mime_type: string
          tamanho_bytes: number
          created_at: string
        }
        Insert: {
          id?: string
          checklist_item_id: string
          user_id: string
          storage_path: string
          nome_arquivo: string
          mime_type: string
          tamanho_bytes: number
          created_at?: string
        }
        Update: {
          storage_path?: string
          nome_arquivo?: string
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
