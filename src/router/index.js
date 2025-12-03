// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import DeviceDetail from '@/views/DeviceDetail.vue'
import { components } from 'vuetify/dist/vuetify.js'
import Dashboard from '@/views/Sensor/Dashboard.vue'

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
        components: Dashboard,
    }
]

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes,
})

export default router // Pastikan ini ada