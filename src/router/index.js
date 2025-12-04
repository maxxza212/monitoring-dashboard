// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import DeviceDetail from '@/views/DeviceDetail.vue'
import Dashboard from '@/views/Sensor/Dashboard.vue'
import Ruangan from '@/views/Ruangan/Ruangan.vue'
import Alat from '@/views/Alat/Alat.vue'

const routes = [
    {
        path: '/',
        name: 'Home',
        component: HomeView,
    },
    {
        path: '/device/:id',
        name: 'DeviceDetail',
        component: DeviceDetail,
    },
    {
        path: '/sensor',
        name: 'DashboardSensor',
        component: Dashboard,
    },
    {
        path: '/ruangan',
        name: 'RuanganRuangan',
        component: Ruangan,
    },
    {
        path: '/alat',
        name: 'AlatAlat',
        component: Alat,
    }
]

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes,
})

export default router 