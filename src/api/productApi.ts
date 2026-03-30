export interface Product {
  id: string
  name?: string
  description?: string
  price?: number
  [key: string]: unknown
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`API ${response.status}: ${errorBody || response.statusText}`)
  }

  return (await response.json()) as T
}

export async function getAllProducts(): Promise<Product[]> {
  const response = await fetch(`${API_BASE_URL}/api/products`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  })

  return parseResponse<Product[]>(response)
}

export async function getProductById(id: string): Promise<Product> {
  const response = await fetch(`${API_BASE_URL}/api/products/${id}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  })

  return parseResponse<Product>(response)
}
