<template>
    <v-card>
        <v-card-title class="d-flex align-center pe-2">
            <v-icon icon="mdi-door" class="me-2"></v-icon>
            <span class="text-h6">Daftar Ruangan</span>
            <v-spacer></v-spacer>
            <v-btn color="primary" prepend-icon="mdi-plus" @click="openDialogAdd">
                Tambah Ruangan
            </v-btn>
        </v-card-title>

        <v-divider></v-divider>

        <v-card-text>
            <v-row dense class="mb-4">
                <v-col cols="12" md="6">
                    <v-text-field v-model="search" density="comfortable" variant="outlined" label="Cari Ruangan"
                        prepend-inner-icon="mdi-magnify" clearable hide-details></v-text-field>
                </v-col>

                <v-col cols="12" md="6">
                    <v-text-field v-model="filterById" density="comfortable" variant="outlined" label="Filter by ID"
                        type="number" prepend-inner-icon="mdi-filter" clearable hide-details></v-text-field>
                </v-col>
            </v-row>

            <v-data-table :headers="headers" :items="filteredRuanganList" :search="search" :loading="loading"
                items-per-page="10" class="elevation-1">
                <template #loading>
                    <v-skeleton-loader type="table-row@5"></v-skeleton-loader>
                </template>

                <template #no-data>
                    <div class="text-center py-8">
                        <v-icon size="64" color="grey-lighten-1">mdi-folder-open</v-icon>
                        <p class="text-h6 text-grey mt-4">Tidak ada data ruangan</p>
                    </div>
                </template>

                <template #item.id="{ item }">
                    <v-chip color="primary" size="small" variant="tonal">
                        {{ item.id }}
                    </v-chip>
                </template>

                <template #item.nama_ruangan="{ item }">
                    <div class="d-flex align-center">
                        <v-icon icon="mdi-door" size="small" class="me-2"></v-icon>
                        <span class="font-weight-medium">{{ item.nama_ruangan }}</span>
                    </div>
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

    <v-dialog v-model="dialog" max-width="500" persistent>
        <v-card>
            <v-card-title class="text-white" style="background: linear-gradient(135deg, #34e89e 0%, #0f3443 100%)">
                <v-icon start>mdi-door</v-icon>
                {{ editMode ? 'Edit Ruangan' : 'Tambah Ruangan Baru' }}
            </v-card-title>

            <v-card-text class="pt-4">
                <v-text-field v-model="formData.nama_ruangan" label="Nama Ruangan" placeholder="Contoh: Ruang Server"
                    prepend-inner-icon="mdi-home" variant="outlined" :rules="[v => !!v || 'Nama ruangan wajib diisi']"
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
                Apakah Anda yakin ingin menghapus ruangan <strong>{{ itemToDelete?.nama_ruangan }}</strong>?
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
const itemToDelete = ref(null)

const headers = [
    { title: 'ID', key: 'id', width: '100px' },
    { title: 'Nama Ruangan', key: 'nama_ruangan' },
    { title: 'Dibuat', key: 'created_at' },
    { title: 'Diupdate', key: 'updated_at' },
    { title: 'Aksi', key: 'actions', sortable: false, width: '120px' }
]

const ruanganList = ref([])
const loading = ref(false)

const formData = ref({
    id: null,
    nama_ruangan: ''
})

const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')

const filteredRuanganList = computed(() => {
    if (!filterById.value) {
        return ruanganList.value
    }
    return ruanganList.value.filter(ruangan => ruangan.id === parseInt(filterById.value))
})

// Get Ruangan 
const getRuangan = async () => {
    loading.value = true

    try {
        console.log('Fetching ruangan from API...')

        const response = await deviceAPI.getAllRuangan()

        if (response.data.success) {
            ruanganList.value = response.data.data.map(ruangan => ({
                ...ruangan,
                created_at: new Date(ruangan.created_at).toLocaleString('id-ID'),
                updated_at: new Date(ruangan.updated_at).toLocaleString('id-ID')
            }))

            console.log('Ruangan loaded:', ruanganList.value.length)
        } else {
            console.error('API returned success: false')
        }
    } catch (error) {
        console.error('Error fetching ruangan:', error)
        showError('Gagal memuat data ruangan')
    } finally {
        loading.value = false
    }
}

const openDialogAdd = () => {
    editMode.value = false
    formData.value = { id: null, nama_ruangan: '' }
    dialog.value = true
}

const openDialogEdit = (item) => {
    editMode.value = true
    formData.value = {
        id: item.id,
        nama_ruangan: item.nama_ruangan
    }
    dialog.value = true
}

const openDialogDelete = (item) => {
    itemToDelete.value = item
    dialogDelete.value = true
}

const closeDialog = () => {
    dialog.value = false
    formData.value = { id: null, nama_ruangan: '' }
}

const submitForm = async () => {
    if (!formData.value.nama_ruangan) {
        showError('Nama ruangan wajib diisi!')
        return
    }

    loadingSubmit.value = true
    try {
        let response

        if (editMode.value) {
            response = await deviceAPI.updateRuangan(formData.value.id, {
                nama_ruangan: formData.value.nama_ruangan
            })
        } else {
            response = await deviceAPI.createRuangan({
                nama_ruangan: formData.value.nama_ruangan
            })
        }

        if (response.data.success) {
            showSuccess(editMode.value ? 'Ruangan berhasil diupdate!' : 'Ruangan berhasil ditambahkan!')
            closeDialog()
            await getRuangan()
        } else {
            showError(response.data.message || 'Gagal menyimpan ruangan')
        }
    } catch (error) {
        console.error('Error submitting ruangan:', error)
        showError(error.response?.data?.message || 'Terjadi kesalahan saat menyimpan')
    } finally {
        loadingSubmit.value = false
    }
}

const confirmDelete = async () => {
    if (!itemToDelete.value) return

    loadingSubmit.value = true
    try {
        const response = await deviceAPI.deleteRuangan(itemToDelete.value.id)

        if (response.data.success) {
            showSuccess('Ruangan berhasil dihapus!')
            dialogDelete.value = false
            await getRuangan()
        } else {
            showError(response.data.message || 'Gagal menghapus ruangan')
        }
    } catch (error) {
        console.error('Error deleting ruangan:', error)
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
    await getRuangan()
})
</script>

<style scoped>
.v-data-table :deep(.v-data-table__th) {
    font-weight: 600;
    background-color: rgb(var(--v-theme-surface));
}
</style>