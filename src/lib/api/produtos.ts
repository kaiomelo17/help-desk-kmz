import { supabase } from '../supabase'
const apiUrl = (import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:3001'
const useRest = !supabase

export type Produto = {
  id: string
  nome: string
  categoria: string
  descricao?: string
  estoque: number
  created_at?: string
}

export type ProdutoSaida = {
  id: string
  produto_id: string
  quantidade: number
  destinatario?: string
  data?: string
  created_at?: string
}

export async function listProdutos(): Promise<Produto[]> {
  if (useRest) {
    const r = await fetch(`${apiUrl}/produtos`)
    if (!r.ok) throw new Error('API local indisponível')
    return await r.json()
  }
  try {
    const { data: rows, error } = await supabase
      .from('produtos')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return (rows ?? []) as Produto[]
  } catch (error) {
    console.error('Erro ao listar produtos:', error)
    throw error
  }
}

export async function createProduto(input: Omit<Produto, 'id' | 'created_at'>): Promise<Produto> {
  if (useRest) {
    const r = await fetch(`${apiUrl}/produtos`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) })
    if (!r.ok) throw new Error('Falha ao criar produto')
    return await r.json()
  }
  try {
    const { data, error } = await supabase
      .from('produtos')
      .insert(input)
      .select('*')
      .single()
    if (error) throw error
    return data as Produto
  } catch (error) {
    console.error('Erro ao criar produto:', error)
    throw error
  }
}

export async function updateProduto(id: string, input: Partial<Omit<Produto, 'id' | 'created_at'>>): Promise<Produto> {
  if (useRest) {
    const r = await fetch(`${apiUrl}/produtos/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) })
    if (!r.ok) throw new Error('Falha ao atualizar produto')
    return await r.json()
  }
  try {
    const { data, error } = await supabase
      .from('produtos')
      .update(input)
      .eq('id', id)
      .select('*')
      .single()
    if (error) throw error
    return data as Produto
  } catch (error) {
    console.error('Erro ao atualizar produto:', error)
    throw error
  }
}

export async function deleteProduto(id: string): Promise<void> {
  if (useRest) {
    const r = await fetch(`${apiUrl}/produtos/${id}`, { method: 'DELETE' })
    if (!r.ok && r.status !== 204) throw new Error('Falha ao excluir produto')
    return
  }
  try {
    const { error } = await supabase
      .from('produtos')
      .delete()
      .eq('id', id)
    if (error) throw error
  } catch (error) {
    console.error('Erro ao excluir produto:', error)
    throw error
  }
}

export async function registrarSaida(produto_id: string, quantidade: number, destinatario?: string, data?: string): Promise<ProdutoSaida> {
  if (useRest) {
    const payload = { produto_id, quantidade, destinatario, data }
    const r = await fetch(`${apiUrl}/produto_saidas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!r.ok) throw new Error('Falha ao registrar saída')
    return await r.json()
  }
  try {
    const payload: { produto_id: string; quantidade: number; destinatario?: string; data?: string } = {
      produto_id,
      quantidade,
      destinatario,
      data,
    }
    const { data: row, error } = await supabase
      .from('produto_saidas')
      .insert(payload)
      .select('*')
      .single()
    if (error) throw error
    return row as ProdutoSaida
  } catch {
    const payload = { produto_id, quantidade, destinatario, data }
    const r = await fetch(`${apiUrl}/produto_saidas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!r.ok) throw new Error('Falha ao registrar saída')
    return await r.json()
  }
}

export async function listSaidas(): Promise<ProdutoSaida[]> {
  if (useRest) {
    try {
      const r = await fetch(`${apiUrl}/produto_saidas`)
      if (!r.ok) return []
      return await r.json()
    } catch {
      return []
    }
  }
  try {
    const { data: rows, error } = await supabase
      .from('produto_saidas')
      .select('*')
      .order('data', { ascending: false })
    if (error) throw error
    return (rows ?? []) as ProdutoSaida[]
  } catch {
    return []
  }
}

export async function updateSaida(id: string, input: Partial<Omit<ProdutoSaida, 'id' | 'created_at' | 'produto_id'>>): Promise<ProdutoSaida> {
  if (useRest) {
    const r = await fetch(`${apiUrl}/produto_saidas/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    if (!r.ok) throw new Error('Falha ao atualizar saída')
    return await r.json()
  }
  try {
    const { data, error } = await supabase
      .from('produto_saidas')
      .update(input)
      .eq('id', id)
      .select('*')
      .single()
    if (error) throw error
    return data as ProdutoSaida
  } catch {
    const r = await fetch(`${apiUrl}/produto_saidas/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    if (!r.ok) throw new Error('Falha ao atualizar saída')
    return await r.json()
  }
}

export async function deleteSaida(id: string): Promise<void> {
  if (useRest) {
    const r = await fetch(`${apiUrl}/produto_saidas/${id}`, { method: 'DELETE' })
    if (!r.ok && r.status !== 204) throw new Error('Falha ao excluir saída')
    return
  }
  try {
    const { error } = await supabase
      .from('produto_saidas')
      .delete()
      .eq('id', id)
    if (error) throw error
  } catch {
    const r = await fetch(`${apiUrl}/produto_saidas/${id}`, { method: 'DELETE' })
    if (!r.ok && r.status !== 204) throw new Error('Falha ao excluir saída')
  }
}
