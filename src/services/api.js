// src/services/api.js
import axios from 'axios'

const API_BASE_URL = 'http://10.107.108.22:6003/api'

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    }
})

// Request interceptor
apiClient.interceptors.request.use(
    config => {
        console.log('API Request:', config.method.toUpperCase(), config.url)
        return config
    },
    error => {
        console.error('Request Error:', error)
        return Promise.reject(error)
    }
)

// Response interceptor
apiClient.interceptors.response.use(
    response => {
        console.log('API Response:', response.status, response.data)
        return response
    },
    error => {
        console.error('API Error:', {
            status: error.response?.status,
            message: error.response?.data?.message || error.message,
            data: error.response?.data
        })
        return Promise.reject(error)
    }
)

export const deviceAPI = {
    // SENSOR
    getAllSensors() {
        return apiClient.get('/sensor')
    },
    getSensorById(id) {
        return apiClient.get(`/sensor/${id}`)
    },
    createSensor(data) {
        return apiClient.post('/sensor', data)
    },
    updateSensor(id, data) {
        return apiClient.put(`/sensor/${id}`, data)
    },
    deleteSensor(id) {
        return apiClient.delete(`/sensor/${id}`)
    },

    // ALAT/DEVICE 
    getAllDevices() {
        return apiClient.get('/alat')
    },
    getDeviceById(id) {
        return apiClient.get(`/alat/${id}`)
    },
    createDevice(data) {
        return apiClient.post('/alat', data)
    },
    updateDevice(id, data) {
        return apiClient.put(`/alat/${id}`, data)
    },
    deleteDevice(id) {
        return apiClient.delete(`/alat/${id}`)
    },

    // RUANGAN 
    getAllRuangan() {
        return apiClient.get('/ruangan')
    },
    getRuanganById(id) {
        return apiClient.get(`/ruangan/${id}`)
    },
    createRuangan(data) {
        return apiClient.post('/ruangan', data)
    },
    updateRuangan(id, data) {
        return apiClient.put(`/ruangan/${id}`, data)
    },
    deleteRuangan(id) {
        return apiClient.delete(`/ruangan/${id}`)
    },

    // SUHU
    getAllSuhu() {
        return apiClient.get('/suhu')
    },
    getSuhu(page = 1, perPage = 50) {
        return apiClient.get('/suhu', {
            params: { page, per_page: perPage }
        })
    },

    // KELEMBAPAN
    getAllKelembapan() {
        return apiClient.get('/kelembapan')
    },
    getKelembapan(page = 1, perPage = 50) {
        return apiClient.get('/kelembapan', {
            params: { page, per_page: perPage }
        })
    },
}

export default apiClient