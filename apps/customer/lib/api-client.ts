import axios, { AxiosInstance } from 'axios'
import config from './config'

const API_BASE_URL = typeof window !== 'undefined' ? '/api' : config.apiUrl

class ApiClient {
	private instance: AxiosInstance

	constructor() {
		this.instance = axios.create({
			baseURL: API_BASE_URL,
			headers: {
				'Content-Type': 'application/json',
			},
		})

		// Interceptor to add token to requests
		this.instance.interceptors.request.use((config) => {
			const token =
				typeof window !== 'undefined' ? localStorage.getItem('token') : null
			if (token) {
				config.headers.Authorization = `Bearer ${token}`
			}
			return config
		})
	}

	get<T = unknown>(...args: Parameters<AxiosInstance['get']>) {
		return this.instance.get<T>(...args)
	}

	post<T = unknown>(...args: Parameters<AxiosInstance['post']>) {
		return this.instance.post<T>(...args)
	}

	put<T = unknown>(...args: Parameters<AxiosInstance['put']>) {
		return this.instance.put<T>(...args)
	}

	delete<T = unknown>(...args: Parameters<AxiosInstance['delete']>) {
		return this.instance.delete<T>(...args)
	}

	patch<T = unknown>(...args: Parameters<AxiosInstance['patch']>) {
		return this.instance.patch<T>(...args)
	}
}

export const apiClient = new ApiClient()
