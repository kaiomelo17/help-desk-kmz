import { supabase } from '../supabase'
const apiUrl = (import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:3001'
const useRest = !supabase

export type Usuario = {
  id: string
  name: string
  username: string
  setor?: string
  cargo?: string
  tier: 'padrao' | 'vip' | 'admin'
  is_admin?: boolean
  password_hash?: string
  created_at?: string
}

export async function listUsuarios(): Promise<Usuario[]> {
  if (useRest) {
    const r = await fetch(`${apiUrl}/usuarios`)
    if (!r.ok) throw new Error('API local indisponível')
    return await r.json()
  }
  try {
    const { data, error } = await supabase
      .from('app_users')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data ?? []) as Usuario[]
  } catch (error) {
    console.error('Erro ao listar usuários:', error)
    throw error
  }
}

export async function createUsuario(input: { nome: string; username: string; setor?: string; cargo?: string; password: string; tipo: 'padrao' | 'vip' | 'admin' }): Promise<Usuario> {
  const payload = { name: (input.nome || '').toUpperCase(), username: input.username, setor: (input.setor || '').toUpperCase(), cargo: input.cargo, tier: input.tipo, password_hash: input.password }
  if (useRest) {
    const r = await fetch(`${apiUrl}/usuarios`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    if (!r.ok) throw new Error('Falha ao criar usuário')
    return await r.json()
  }
  try {
    const { data, error } = await supabase
      .from('app_users')
      .insert(payload)
      .select('*')
      .single()
    if (error) throw error
    return data as Usuario
  } catch (error) {
    console.error('Erro ao criar usuário:', error)
    throw error
  }
}

export async function updateUsuario(id: string, input: Partial<{ nome: string; username: string; setor?: string; cargo?: string; password?: string; tipo?: 'padrao' | 'vip' | 'admin' }>): Promise<Usuario> {
  const payload: Partial<Usuario> = {}
  if (input.nome !== undefined) payload.name = (input.nome || '').toUpperCase()
  if (input.username !== undefined) payload.username = input.username
  if (input.setor !== undefined) payload.setor = (input.setor || '').toUpperCase()
  if (input.cargo !== undefined) payload.cargo = input.cargo
  if (input.password !== undefined) payload.password_hash = input.password
  if (input.tipo !== undefined) payload.tier = input.tipo
  if (useRest) {
    const r = await fetch(`${apiUrl}/usuarios/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    if (!r.ok) throw new Error('Falha ao atualizar usuário')
    return await r.json()
  }
  try {
    const { data, error } = await supabase
      .from('app_users')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single()
    if (error) throw error
    return data as Usuario
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error)
    throw error
  }
}

export async function deleteUsuario(id: string): Promise<void> {
  if (useRest) {
    const r = await fetch(`${apiUrl}/usuarios/${id}`, { method: 'DELETE' })
    if (!r.ok && r.status !== 204) throw new Error('Falha ao excluir usuário')
    return
  }
  try {
    const { error } = await supabase
      .from('app_users')
      .delete()
      .eq('id', id)
    if (error) throw error
  } catch (error) {
    console.error('Erro ao excluir usuário:', error)
    throw error
  }
}
