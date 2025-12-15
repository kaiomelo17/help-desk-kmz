import { supabase } from '../supabase'
const apiUrl = (import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:3001'
const useRest = !supabase

export type Chamado = {
  id: string
  titulo: string
  descricao: string
  prioridade: 'baixa' | 'media' | 'alta'
  status: 'Aberto' | 'Em Andamento' | 'Concluído'
  usuario: string
  solicitante: string
  setor: string
  tipo_servico: string
  is_vip?: boolean
  data?: string
  created_at?: string
}

export async function listChamados(): Promise<Chamado[]> {
  if (useRest) {
    const r = await fetch(`${apiUrl}/chamados`)
    if (!r.ok) throw new Error('API local indisponível')
    return await r.json()
  }
  const { data, error } = await supabase
    .from('chamados')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function createChamado(input: Omit<Chamado, 'id' | 'created_at' | 'prioridade' | 'status'> & { prioridade?: Chamado['prioridade']; status?: Chamado['status'] }): Promise<Chamado> {
  if (useRest) {
    const payload = { ...input }
    const r = await fetch(`${apiUrl}/chamados`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    if (!r.ok) throw new Error('Falha ao abrir chamado')
    return await r.json()
  }
  const { data, error } = await supabase
    .from('chamados')
    .insert({ ...input })
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return data as Chamado
}

export async function updateChamado(id: string, input: Partial<Omit<Chamado, 'id' | 'created_at'>>): Promise<Chamado> {
  if (useRest) {
    const r = await fetch(`${apiUrl}/chamados/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) })
    if (!r.ok) throw new Error('Falha ao atualizar chamado')
    return await r.json()
  }
  const { data, error } = await supabase
    .from('chamados')
    .update(input)
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return data as Chamado
}

export async function deleteChamado(id: string): Promise<void> {
  if (useRest) {
    const r = await fetch(`${apiUrl}/chamados/${id}`, { method: 'DELETE' })
    if (!r.ok && r.status !== 204) throw new Error('Falha ao excluir chamado')
    return
  }
  const { error } = await supabase
    .from('chamados')
    .delete()
    .eq('id', id)
  if (error) throw new Error(error.message)
}
