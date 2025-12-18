import { supabase } from '../supabase'
const apiUrl = (import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:3001'
const useRest = !supabase

export type Setor = {
  id: string
  nome: string
  responsavel?: string
  ramal?: string
  localizacao?: string
  created_at?: string
}

export async function listSetores(): Promise<Setor[]> {
  if (useRest) {
    const r = await fetch(`${apiUrl}/setores`)
    if (!r.ok) throw new Error('API local indisponível')
    return await r.json()
  }
  try {
    const { data, error } = await supabase
      .from('setores')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    const rows = data ?? []
    if (!rows.length) {
      const r = await fetch(`${apiUrl}/setores`)
      if (r.ok) return await r.json()
    }
    return rows as Setor[]
  } catch {
    const r = await fetch(`${apiUrl}/setores`)
    if (!r.ok) throw new Error('API local indisponível')
    return await r.json()
  }
}

export async function createSetor(input: Omit<Setor, 'id' | 'created_at'>): Promise<Setor> {
  if (useRest) {
    const r = await fetch(`${apiUrl}/setores`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...input, nome: (input.nome || '').toUpperCase() })
    })
    if (!r.ok) throw new Error('Falha ao criar setor')
    return await r.json()
  }
  try {
    const { data, error } = await supabase
      .from('setores')
      .insert({ ...input, nome: (input.nome || '').toUpperCase() })
      .select('*')
      .single()
    if (error) throw error
    return data as Setor
  } catch {
    const r = await fetch(`${apiUrl}/setores`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...input, nome: (input.nome || '').toUpperCase() })
    })
    if (!r.ok) throw new Error('Falha ao criar setor')
    return await r.json()
  }
}

export async function updateSetor(id: string, input: Partial<Omit<Setor, 'id' | 'created_at'>>): Promise<Setor> {
  if (useRest) {
    const patch = { ...input, ...(input.nome ? { nome: input.nome.toUpperCase() } : {}) }
    const r = await fetch(`${apiUrl}/setores/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch)
    })
    if (!r.ok) throw new Error('Falha ao atualizar setor')
    return await r.json()
  }
  try {
    const { data, error } = await supabase
      .from('setores')
      .update({ ...input, ...(input.nome ? { nome: input.nome.toUpperCase() } : {}) })
      .eq('id', id)
      .select('*')
      .single()
    if (error) throw error
    return data as Setor
  } catch {
    const patch = { ...input, ...(input.nome ? { nome: input.nome.toUpperCase() } : {}) }
    const r = await fetch(`${apiUrl}/setores/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch)
    })
    if (!r.ok) throw new Error('Falha ao atualizar setor')
    return await r.json()
  }
}

export async function deleteSetor(id: string): Promise<void> {
  if (useRest) {
    const r = await fetch(`${apiUrl}/setores/${id}`, { method: 'DELETE' })
    if (!r.ok && r.status !== 204) throw new Error('Falha ao excluir setor')
    return
  }
  try {
    const { error } = await supabase
      .from('setores')
      .delete()
      .eq('id', id)
    if (error) throw error
  } catch {
    const r = await fetch(`${apiUrl}/setores/${id}`, { method: 'DELETE' })
    if (!r.ok && r.status !== 204) throw new Error('Falha ao excluir setor')
  }
}
