import { supabase } from '../supabase'
const apiUrl = (import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:3001'
const useRest = !supabase

export type Equipamento = {
  id: string
  nome: string
  tipo: string
  patrimonio: string
  marca?: string
  modelo?: string
  status: 'Disponível' | 'Em Uso' | 'Manutenção' | 'Inativo'
  usuario?: string
  setor?: string
  ram?: string
  armazenamento?: string
  processador?: string
  polegadas?: string
  ghz?: string
  created_at?: string
}

export async function listEquipamentos(): Promise<Equipamento[]> {
  if (useRest) {
    const r = await fetch(`${apiUrl}/equipamentos`)
    if (!r.ok) throw new Error('API local indisponível')
    return await r.json()
  }
  try {
    const { data, error } = await supabase
      .from('equipamentos')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data ?? []) as Equipamento[]
  } catch (error) {
    console.error('Erro ao listar equipamentos:', error)
    throw error
  }
}

export async function createEquipamento(input: Omit<Equipamento, 'id' | 'created_at'>): Promise<Equipamento> {
  if (useRest) {
    const r = await fetch(`${apiUrl}/equipamentos`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) })
    if (!r.ok) throw new Error('Falha ao criar equipamento')
    return await r.json()
  }
  try {
    const { data, error } = await supabase
      .from('equipamentos')
      .insert(input)
      .select('*')
      .single()
    if (error) throw error
    return data as Equipamento
  } catch (error: any) {
    console.error('Erro ao criar equipamento:', error)
    if (error?.code === '23505') {
      throw new Error('Já existe um equipamento cadastrado com este número de patrimônio.')
    }
    throw error
  }
}

export async function updateEquipamento(id: string, input: Partial<Omit<Equipamento, 'id' | 'created_at'>>): Promise<Equipamento> {
  if (useRest) {
    const r = await fetch(`${apiUrl}/equipamentos/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) })
    if (!r.ok) throw new Error('Falha ao atualizar equipamento')
    return await r.json()
  }
  try {
    const { data, error } = await supabase
      .from('equipamentos')
      .update(input)
      .eq('id', id)
      .select('*')
      .single()
    if (error) throw error
    return data as Equipamento
  } catch (error: any) {
    console.error('Erro ao atualizar equipamento:', error)
    if (error?.code === '23505') {
      throw new Error('Já existe um equipamento cadastrado com este número de patrimônio.')
    }
    throw error
  }
}

export async function deleteEquipamento(id: string): Promise<void> {
  if (useRest) {
    const r = await fetch(`${apiUrl}/equipamentos/${id}`, { method: 'DELETE' })
    if (!r.ok && r.status !== 204) throw new Error('Falha ao excluir equipamento')
    return
  }
  try {
    const { error } = await supabase
      .from('equipamentos')
      .delete()
      .eq('id', id)
    if (error) throw error
  } catch (error) {
    console.error('Erro ao excluir equipamento:', error)
    throw error
  }
}
