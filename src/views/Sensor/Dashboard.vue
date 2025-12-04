<template>
    <v-card>
        <v-card-title class="d-flex align-center pe-2">
            <v-icon icon="mdi-chip" class="me-2"></v-icon>
            <span class="text-h6">Daftar Sensor</span>
            <v-spacer></v-spacer>
            <v-btn prepend-icon="mdi-plus" @click="openDialogAdd"
                style="background: linear-gradient(135deg, #34e89e 0%, #0f3443 100%); color: white;">
                Tambah Sensor
            </v-btn>
        </v-card-title>

        <v-divider></v-divider>

        <v-card-text>
            <v-row dense class="mb-4">
                <v-col cols="12" md="6">
                    <v-text-field v-model="search" density="comfortable" variant="outlined" label="Cari Sensor"
                        prepend-inner-icon="mdi-magnify" clearable hide-details></v-text-field>
                </v-col>

                <v-col cols="12" md="6">
                    <v-text-field v-model="filterById" density="comfortable" variant="outlined" label="Filter by ID"
                        type="number" prepend-inner-icon="mdi-filter" clearable hide-details></v-text-field>
                </v-col>
            </v-row>

            <v-data-table :headers="headers" :items="filteredSensorList" :search="search" :loading="loading"
                items-per-page="10" class="elevation-1">
                <template #loading>
                    <v-skeleton-loader type="table-row@5"></v-skeleton-loader>
                </template>

                <template #no-data>
                    <div class="text-center py-8">
                        <v-icon size="64" color="grey-lighten-1">mdi-folder-open</v-icon>
                        <p class="text-h6 text-grey mt-4">Tidak ada data sensor</p>
                    </div>
                </template>

                <template #item.id="{ item }">
                    <v-chip color="primary" size="small" variant="tonal">
                        {{ item.id }}
                    </v-chip>
                </template>

                <template #item.nama_sensor="{ item }">
                    <div class="d-flex align-center">
                        <span class="font-weight-medium">{{ item.nama_sensor }}</span>
                    </div>
                </template>

                <template #item.id_alat="{ item }">
                    <v-chip color="secondary" size="small" variant="outlined">
                        Alat {{ item.id_alat }}
                    </v-chip>
                </template>

                <template #item.created_at="{ item }">
                    <div class="text-caption">
                        <v-icon icon="mdi-calendar-plus" size="x-small" class="me-1"></v-icon>
                        {{ item.created_at }}
                    </div>
                </template>

                <template #item.updated_at="{ item }">
                    <div class="text-caption">
                        <v-icon icon="mdi-calendar-edit" size="x-small" class="me-1"></v-icon>
                        {{ item.updated_at }}
                    </div>
                </template>

                <template #item.actions="{ item }">
                    <v-btn icon="mdi-pencil" size="small" variant="text" color="primary" @click="openDialogEdit(item)">
                    </v-btn>
                    <v-btn icon="mdi-delete" size="small" variant="text" color="error" @click="openDialogDelete(item)">
                    </v-btn>
                </template>
            </v-data-table>
        </v-card-text>
    </v-card>

    <v-dialog v-model="dialog" max-width="600" persistent>
        <v-card>
            <v-card-title class="text-white" style="background: linear-gradient(135deg, #34e89e 0%, #0f3443 100%)">
                <v-icon start>mdi-chip</v-icon>
                {{ editMode ? 'Edit Sensor' : 'Tambah Sensor Baru' }}
            </v-card-title>

            <v-card-text class="pt-4">
                <v-select v-model="formData.id_alat" :items="devicesList" item-title="nama_alat" item-value="id"
                    label="Pilih Alat" prepend-inner-icon="mdi-devices" variant="outlined"
                    :rules="[v => !!v || 'Alat wajib dipilih']" required :loading="loadingDevices"
                    class="mb-3"></v-select>

                <v-text-field v-model="formData.nama_sensor" label="Nama Sensor" placeholder="Contoh: DHT22 Sensor 1"
                    prepend-inner-icon="mdi-memory" variant="outlined" :rules="[v => !!v || 'Nama sensor wajib diisi']"
                    required></v-text-field>
            </v-card-text>

            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn @click="closeDialog" :disabled="loadingSubmit">
                    Batal
                </v-btn>
                <v-btn color="primary" @click="submitForm" :loading="loadingSubmit">
                    <v-icon start>mdi-content-save</v-icon>
                    Simpan
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>

    <v-dialog v-model="dialogDelete" max-width="400">
        <v-card>
            <v-card-title class="text-h6">
                Konfirmasi Hapus
            </v-card-title>
            <v-card-text>
                Apakah Anda yakin ingin menghapus sensor <strong>{{ itemToDelete?.nama_sensor }}</strong>?
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn @click="dialogDelete = false" :disabled="loadingSubmit">
                    Batal
                </v-btn>
                <v-btn color="error" @click="confirmDelete" :loading="loadingSubmit">
                    Hapus
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar" :color="snackbarColor" timeout="3000">
        {{ snackbarText }}
        <template v-slot:actions>
            <v-btn variant="text" @click="snackbar = false">Tutup</v-btn>
        </template>
    </v-snackbar>
</template>

<script setup>
import { onMounted, ref, computed } from 'vue';
import { deviceAPI } from '@/services/api'

const search = ref('')
const filterById = ref(null)
const dialog = ref(false)
const dialogDelete = ref(false)
const editMode = ref(false)
const loadingSubmit = ref(false)
const loadingDevices = ref(false)
const itemToDelete = ref(null)

const headers = [
    { title: 'ID', key: 'id', width: '100px' },
    { title: 'Nama Sensor', key: 'nama_sensor' },
    { title: 'ID Alat', key: 'id_alat', width: '120px' },
    { title: 'Dibuat', key: 'created_at' },
    { title: 'Diupdate', key: 'updated_at' },
    { title: 'Aksi', key: 'actions', sortable: false, width: '120px' }
]

const sensorList = ref([])
const devicesList = ref([])
const loading = ref(false)

const formData = ref({
    id: null,
    id_alat: null,
    nama_sensor: ''
})

const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')

const filteredSensorList = computed(() => {
    if (!filterById.value) {
        return sensorList.value
    }
    return sensorList.value.filter(sensor => sensor.id === parseInt(filterById.value))
})

const getSensors = async () => {
    loading.value = true

    try {
        console.log('Fetching sensors from API...')

        const response = await deviceAPI.getAllSensors()

        if (response.data.success) {
            sensorList.value = response.data.data.map(sensor => ({
                ...sensor,
                created_at: new Date(sensor.created_at).toLocaleString('id-ID'),
                updated_at: new Date(sensor.updated_at).toLocaleString('id-ID')
            }))

            console.log('Sensors loaded:', sensorList.value.length)
        } else {
            console.error('API returned success: false')
        }
    } catch (error) {
        console.error('Error fetching sensors:', error)
        showError('Gagal memuat data sensor')
    } finally {
        loading.value = false
    }
}

const loadDevicesList = async () => {
    loadingDevices.value = true
    try {
        const response = await deviceAPI.getAllDevices()
        if (response.data.success) {
            devicesList.value = response.data.data
        }
    } catch (error) {
        console.error('Error loading devices:', error)
        showError('Gagal memuat daftar alat')
    } finally {
        loadingDevices.value = false
    }
}

const openDialogAdd = async () => {
    editMode.value = false
    formData.value = { id: null, id_alat: null, nama_sensor: '' }
    await loadDevicesList()
    dialog.value = true
}

const openDialogEdit = async (item) => {
    editMode.value = true
    formData.value = {
        id: item.id,
        id_alat: item.id_alat,
        nama_sensor: item.nama_sensor
    }
    await loadDevicesList()
    dialog.value = true
}

const openDialogDelete = (item) => {
    itemToDelete.value = item
    dialogDelete.value = true
}

const closeDialog = () => {
    dialog.value = false
    formData.value = { id: null, id_alat: null, nama_sensor: '' }
}

const submitForm = async () => {
    if (!formData.value.id_alat) {
        showError('Alat wajib dipilih!')
        return
    }
    if (!formData.value.nama_sensor) {
        showError('Nama sensor wajib diisi!')
        return
    }

    loadingSubmit.value = true
    try {
        let response

        if (editMode.value) {
            response = await deviceAPI.updateSensor(formData.value.id, {
                id_alat: formData.value.id_alat,
                nama_sensor: formData.value.nama_sensor
            })
        } else {
            response = await deviceAPI.createSensor({
                id_alat: formData.value.id_alat,
                nama_sensor: formData.value.nama_sensor
            })
        }

        if (response.data.success) {
            showSuccess(editMode.value ? 'Sensor berhasil diupdate!' : 'Sensor berhasil ditambahkan!')
            closeDialog()
            await getSensors()
        } else {
            showError(response.data.message || 'Gagal menyimpan sensor')
        }
    } catch (error) {
        console.error('Error submitting sensor:', error)
        showError(error.response?.data?.message || 'Terjadi kesalahan saat menyimpan')
    } finally {
        loadingSubmit.value = false
    }
}

const confirmDelete = async () => {
    if (!itemToDelete.value) return

    loadingSubmit.value = true
    try {
        const response = await deviceAPI.deleteSensor(itemToDelete.value.id)

        if (response.data.success) {
            showSuccess('Sensor berhasil dihapus!')
            dialogDelete.value = false
            await getSensors()
        } else {
            showError(response.data.message || 'Gagal menghapus sensor')
        }
    } catch (error) {
        console.error('Error deleting sensor:', error)
        showError(error.response?.data?.message || 'Terjadi kesalahan saat menghapus')
    } finally {
        loadingSubmit.value = false
        itemToDelete.value = null
    }
}

const showSuccess = (message) => {
    snackbarText.value = message
    snackbarColor.value = 'success'
    snackbar.value = true
}

const showError = (message) => {
    snackbarText.value = message
    snackbarColor.value = 'error'
    snackbar.value = true
}

onMounted(async () => {
    console.log('Component mounted')
    await getSensors()
})
</script>

<style scoped>
.v-data-table :deep(.v-data-table__th) {
    font-weight: 600;
    background-color: rgb(var(--v-theme-surface));
}
</style>