import axios, { AxiosInstance } from 'axios'
import config from './config'

const API_BASE_URL = typeof window !== 'undefined' ? '/api' : config.apiUrl

class ApiClient {
	private instance: AxiosInstance

	constructor() {
		this.instance = axios.create({
			baseURL: API_BASE_URL,
			timeout: 15000,
			headers: {
				'Content-Type': 'application/json',
			},
		})

		this.instance.interceptors.request.use((config) => {
			const token =
				typeof window !== 'undefined'
					? localStorage.getItem('adminToken')
					: null
			if (token) {
				config.headers.Authorization = `Bearer ${token}`
			}
			return config
		})

		this.instance.interceptors.response.use(
			(response) => response,
			(error) => {
				if (typeof window === 'undefined') return Promise.reject(error)

				if (error.response?.status === 401) {
					localStorage.removeItem('adminToken')
					window.location.href = '/auth/login'
					return Promise.reject(error)
				}

				const data = error.response?.data
				const message =
					data?.message ||
					error.message ||
					'An unexpected error occurred'
				const errorCode = data?.errorCode || null

				return Promise.reject({ ...error, message, errorCode })
			}
		)
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
