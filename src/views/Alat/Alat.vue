<template>
    <v-card>
        <v-card-title class="d-flex align-center pe-2">
            <v-icon icon="mdi-devices" class="me-2"></v-icon>
            <span class="text-h6">Daftar Alat</span>
            <v-spacer></v-spacer>
            <v-btn prepend-icon="mdi-plus" @click="openDialogAdd"
                style="background: linear-gradient(135deg, #34e89e 0%, #0f3443 100%); color: white;">
                Tambah Alat
            </v-btn>
        </v-card-title>

        <v-divider></v-divider>

        <v-card-text>
            <v-row dense class="mb-4">
                <v-col cols="12" md="6">
                    <v-text-field v-model="search" density="comfortable" variant="outlined" label="Cari Alat"
                        prepend-inner-icon="mdi-magnify" clearable hide-details></v-text-field>
                </v-col>

                <v-col cols="12" md="6">
                    <v-text-field v-model="filterById" density="comfortable" variant="outlined" label="Filter by ID"
                        type="number" prepend-inner-icon="mdi-filter" clearable hide-details></v-text-field>
                </v-col>
            </v-row>

            <v-data-table :headers="headers" :items="filteredAlatList" :search="search" :loading="loading"
                items-per-page="10" class="elevation-1">
                <template #loading>
                    <v-skeleton-loader type="table-row@5"></v-skeleton-loader>
                </template>

                <template #no-data>
                    <div class="text-center py-8">
                        <v-icon size="64" color="grey-lighten-1">mdi-folder-open</v-icon>
                        <p class="text-h6 text-grey mt-4">Tidak ada data alat</p>
                    </div>
                </template>

                <template #item.id="{ item }">
                    <v-chip color="primary" size="small" variant="tonal">
                        {{ item.id }}
                    </v-chip>
                </template>

                <template #item.nama_alat="{ item }">
                    <div class="d-flex align-center">
                        <span class="font-weight-medium">{{ item.nama_alat }}</span>
                    </div>
                </template>

                <template #item.id_ruangan="{ item }">
                    <v-chip color="secondary" size="small" variant="outlined">
                        Ruangan {{ item.id_ruangan }}
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
                <v-icon start>mdi-devices</v-icon>
                {{ editMode ? 'Edit Alat' : 'Tambah Alat Baru' }}
            </v-card-title>

            <v-card-text class="pt-4">
                <v-text-field v-model="formData.nama_alat" label="Nama Alat" placeholder="Contoh: ESP32 Board 1"
                    prepend-inner-icon="mdi-chip" variant="outlined" :rules="[v => !!v || 'Nama alat wajib diisi']"
                    required class="mb-3"></v-text-field>

                <v-select v-model="formData.id_ruangan" :items="ruanganList" item-title="nama_ruangan" item-value="id"
                    label="Pilih Ruangan" prepend-inner-icon="mdi-home-group" variant="outlined"
                    :rules="[v => !!v || 'Ruangan wajib dipilih']" required :loading="loadingRuangan"></v-select>
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
                Apakah Anda yakin ingin menghapus alat <strong>{{ itemToDelete?.nama_alat }}</strong>?
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
import { onMounted, ref, computed } from 'vue'
import { deviceAPI } from '@/services/api'

const search = ref('')
const filterById = ref(null)
const dialog = ref(false)
const dialogDelete = ref(false)
const editMode = ref(false)
const loadingSubmit = ref(false)
const loadingRuangan = ref(false)
const itemToDelete = ref(null)

// Variabel untuk header
const headers = [
    { title: 'ID', key: 'id', width: '100px' },
    { title: 'Nama Alat', key: 'nama_alat' },
    { title: 'ID Ruangan', key: 'id_ruangan', width: '150px' },
    { title: 'Dibuat', key: 'created_at' },
    { title: 'Diupdate', key: 'updated_at' },
    { title: 'Aksi', key: 'actions', sortable: false, width: '120px' }
]

const alatList = ref([])
const ruanganList = ref([])
const loading = ref(false)

const formData = ref({
    id: null,
    nama_alat: '',
    id_ruangan: null
})

const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')

const filteredAlatList = computed(() => {
    const q = filterById.value
    if (q === null || q === undefined || String(q).trim() === '') {
        return alatList.value
    }

    const numeric = Number(q)
    return alatList.value.filter(alat => Number(alat.id) === numeric)
})

const getAlat = async () => {
    loading.value = true

    try {
        console.log('Fetching alat from API...')

        const response = await deviceAPI.getAllDevices()

        console.log('API Response:', response.data)

        if (response.data.success) {
            alatList.value = response.data.data.map(alat => ({
                ...alat,
                created_at: new Date(alat.created_at).toLocaleString('id-ID'),
                updated_at: new Date(alat.updated_at).toLocaleString('id-ID')
            }))

            console.log('Alat loaded:', alatList.value.length)
            console.log('Data:', alatList.value)
        } else {
            console.error('API returned success: false')
            console.error('Response:', response.data)
        }
    } catch (error) {
        console.error('Error fetching alat:', error)
        console.error('Error details:', error.response?.data)
        showError('Gagal memuat data alat')
    } finally {
        loading.value = false
    }
}

const loadRuanganList = async () => {
    loadingRuangan.value = true
    try {
        const response = await deviceAPI.getAllRuangan()
        if (response.data.success) {
            ruanganList.value = response.data.data
        }
    } catch (error) {
        console.error('Error loading ruangan:', error)
        showError('Gagal memuat daftar ruangan')
    } finally {
        loadingRuangan.value = false
    }
}

const openDialogAdd = async () => {
    editMode.value = false
    formData.value = { id: null, nama_alat: '', id_ruangan: null }
    await loadRuanganList()
    dialog.value = true
}

const openDialogEdit = async (item) => {
    editMode.value = true
    formData.value = {
        id: item.id,
        nama_alat: item.nama_alat,
        id_ruangan: item.id_ruangan
    }
    await loadRuanganList()
    dialog.value = true
}

const openDialogDelete = (item) => {
    itemToDelete.value = item
    dialogDelete.value = true
}

const closeDialog = () => {
    dialog.value = false
    formData.value = { id: null, nama_alat: '', id_ruangan: null }
}

const submitForm = async () => {
    if (!formData.value.nama_alat) {
        showError('Nama alat wajib diisi!')
        return
    }
    if (!formData.value.id_ruangan) {
        showError('Ruangan wajib dipilih!')
        return
    }

    loadingSubmit.value = true
    try {
        let response

        if (editMode.value) {
            response = await deviceAPI.updateDevice(formData.value.id, {
                nama_alat: formData.value.nama_alat,
                id_ruangan: formData.value.id_ruangan
            })
        } else {
            response = await deviceAPI.createDevice({
                nama_alat: formData.value.nama_alat,
                id_ruangan: formData.value.id_ruangan
            })
        }

        if (response.data.success) {
            showSuccess(editMode.value ? 'Alat berhasil diupdate!' : 'Alat berhasil ditambahkan!')
            closeDialog()
            await getAlat()
        } else {
            showError(response.data.message || 'Gagal menyimpan alat')
        }
    } catch (error) {
        console.error('Error submitting alat:', error)
        showError(error.response?.data?.message || 'Terjadi kesalahan saat menyimpan')
    } finally {
        loadingSubmit.value = false
    }
}

const confirmDelete = async () => {
    if (!itemToDelete.value) return

    loadingSubmit.value = true
    try {
        const response = await deviceAPI.deleteDevice(itemToDelete.value.id)

        if (response.data.success) {
            showSuccess('Alat berhasil dihapus!')
            dialogDelete.value = false
            await getAlat()
        } else {
            showError(response.data.message || 'Gagal menghapus alat')
        }
    } catch (error) {
        console.error('Error deleting alat:', error)
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
    await getAlat()
})
</script>

<style scoped>
.v-data-table :deep(.v-data-table__th) {
    font-weight: 600;
    background-color: rgb(var(--v-theme-surface));
}
</style>