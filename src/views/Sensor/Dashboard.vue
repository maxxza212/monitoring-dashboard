<template>
    <v-card>
        <v-card-title class="d-flex align-center pe-2">
            <v-icon icon="mdi-thermometer" class="me-2"></v-icon>
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
                    <v-text-field v-model="search" density="comfortable" variant="outlined" label="Cari"
                        prepend-inner-icon="mdi-magnify" clearable hide-details></v-text-field>
                </v-col>

                <v-col cols="12" md="6">
                    <v-select v-model="filterById" :items="devicesFilterList" item-title="text" item-value="value"
                        density="comfortable" variant="outlined" label="Filter Alat" prepend-inner-icon="mdi-filter"
                        clearable hide-details></v-select>
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
                        <v-icon icon="mdi-thermometer" size="small" color="primary" class="me-2 align-self-center" />
                        <span class="font-weight-medium">{{ item.nama_sensor }}</span>
                    </div>
                </template>

                <template #item.nama_alat="{ item }">
                    <v-chip color="secondary" size="small" variant="outlined">
                        {{ item.nama_alat }}
                    </v-chip>
                </template>

                <template #item.suhu_batasan="{ item }">
                    <div v-if="item.batasan" class="text-caption">
                        <v-chip size="small" color="info" variant="tonal">
                            {{ item.batasan.suhu_min }}°C - {{ item.batasan.suhu_max }}°C
                        </v-chip>
                    </div>
                    <div v-else class="text-grey text-caption">
                        <v-icon icon="mdi-alert-circle-outline" size="x-small" class="me-1"></v-icon>
                        Belum diatur
                    </div>
                </template>

                <template #item.kelembapan_batasan="{ item }">
                    <div v-if="item.batasan" class="text-caption">
                        <v-chip size="small" color="teal" variant="tonal">
                            {{ item.batasan.kelembapan_min }}% - {{ item.batasan.kelembapan_max }}%
                        </v-chip>
                    </div>
                    <div v-else class="text-grey text-caption">
                        <v-icon icon="mdi-alert-circle-outline" size="x-small" class="me-1"></v-icon>
                        Belum diatur
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

    <v-dialog v-model="dialog" max-width="700" persistent>
        <v-card>
            <v-card-title class="text-white" style="background: linear-gradient(135deg, #34e89e 0%, #0f3443 100%)">
                <v-icon start>mdi-thermometer</v-icon>
                {{ editMode ? "Edit Sensor" : "Tambah Sensor Baru" }}
            </v-card-title>

            <v-card-text class="pt-4">
                <div class="mb-4">
                    <div class="text-subtitle-2 text-grey mb-3">Informasi Sensor</div>

                    <v-select v-model="formData.id_alat" :items="devicesList" item-title="nama_alat" item-value="id"
                        label="Pilih Alat" prepend-inner-icon="mdi-devices" variant="outlined"
                        :rules="[(v) => !!v || 'Alat wajib dipilih']" required :loading="loadingDevices"
                        class="mb-3"></v-select>

                    <v-text-field v-model="formData.nama_sensor" label="Nama Sensor"
                        placeholder="Contoh: DHT22 Sensor 1" prepend-inner-icon="mdi-memory" variant="outlined"
                        :rules="[(v) => !!v || 'Nama sensor wajib diisi']" required></v-text-field>
                </div>

                <v-divider class="my-4"></v-divider>

                <div>
                    <div class="d-flex align-center justify-space-between mb-3">
                        <div class="text-subtitle-2 text-grey">Pengaturan Batasan</div>
                    </div>

                    <v-alert type="info" variant="tonal" density="compact" class="mb-3">
                        Atur batasan nilai normal untuk sensor ini. Jika tidak diisi, sistem akan menggunakan batasan
                        default.
                    </v-alert>

                    <v-row>
                        <v-col cols="12" md="6">
                            <div class="text-caption mb-2 font-weight-bold text-primary">
                                <v-icon icon="mdi-thermometer" size="small" class="me-1"></v-icon>
                                Batasan Suhu (°C)
                            </div>
                            <v-row dense>
                                <v-col cols="6">
                                    <v-text-field v-model.number="formData.suhu_min" label="Min" type="number"
                                        step="0.1" density="compact" variant="outlined"
                                        prepend-inner-icon="mdi-arrow-down-bold" suffix="°C"
                                        hide-details></v-text-field>
                                </v-col>
                                <v-col cols="6">
                                    <v-text-field v-model.number="formData.suhu_max" label="Max" type="number"
                                        step="0.1" density="compact" variant="outlined"
                                        prepend-inner-icon="mdi-arrow-up-bold" suffix="°C" hide-details></v-text-field>
                                </v-col>
                            </v-row>
                        </v-col>

                        <v-col cols="12" md="6">
                            <div class="text-caption mb-2 font-weight-bold text-teal">
                                <v-icon icon="mdi-water-percent" size="small" class="me-1"></v-icon>
                                Batasan Kelembapan (%)
                            </div>
                            <v-row dense>
                                <v-col cols="6">
                                    <v-text-field v-model.number="formData.kelembapan_min" label="Min" type="number"
                                        step="0.1" density="compact" variant="outlined"
                                        prepend-inner-icon="mdi-arrow-down-bold" suffix="%" hide-details></v-text-field>
                                </v-col>
                                <v-col cols="6">
                                    <v-text-field v-model.number="formData.kelembapan_max" label="Max" type="number"
                                        step="0.1" density="compact" variant="outlined"
                                        prepend-inner-icon="mdi-arrow-up-bold" suffix="%" hide-details></v-text-field>
                                </v-col>
                            </v-row>
                        </v-col>
                    </v-row>
                </div>
            </v-card-text>

            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn @click="closeDialog" :disabled="loadingSubmit">Batal</v-btn>
                <v-btn color="primary" @click="submitForm" :loading="loadingSubmit">
                    <v-icon start>mdi-content-save</v-icon>
                    Simpan
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>

    <v-dialog v-model="dialogDelete" max-width="400">
        <v-card>
            <v-card-title class="text-h6">Konfirmasi Hapus</v-card-title>
            <v-card-text>
                Apakah Anda yakin ingin menghapus sensor <strong>{{ itemToDelete?.nama_sensor }}</strong>?
                <v-alert type="warning" variant="tonal" density="compact" class="mt-3">
                    Data batasan sensor juga akan terhapus!
                </v-alert>
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn @click="dialogDelete = false" :disabled="loadingSubmit">Batal</v-btn>
                <v-btn color="error" @click="confirmDelete" :loading="loadingSubmit">Hapus</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>

    <!-- Snackbar -->
    <v-snackbar v-model="snackbar" :color="snackbarColor" timeout="3000">
        {{ snackbarText }}
        <template v-slot:actions>
            <v-btn variant="text" @click="snackbar = false">Tutup</v-btn>
        </template>
    </v-snackbar>
</template>

<script setup>
import { onMounted, ref, computed } from "vue";
import { deviceAPI } from "@/services/api";
import { useBatasan } from "@/composables/useBatasan";

const { loadAllBatasan, getBatasanBySensorId, createBatasan, updateBatasan } = useBatasan();

const search = ref("");
const filterById = ref(null);
const dialog = ref(false);
const dialogDelete = ref(false);
const editMode = ref(false);
const loadingSubmit = ref(false);
const loadingDevices = ref(false);
const itemToDelete = ref(null);

const headers = [
    { title: "ID", key: "id" },
    { title: "Nama Sensor", key: "nama_sensor" },
    { title: "Alat", key: "nama_alat" },
    { title: "SB", key: "suhu_batasan" },
    { title: "KB", key: "kelembapan_batasan" },
    { title: "Dibuat", key: "created_at" },
    { title: "Diupdate", key: "updated_at" },
    { title: "Aksi", key: "actions", sortable: false },
];

const sensorList = ref([]);
const devicesList = ref([]);
const devicesMap = ref(new Map()); 
const loading = ref(false);

const formData = ref({
    id: null,
    id_alat: null,
    nama_sensor: "",
    suhu_min: null,
    suhu_max: null,
    kelembapan_min: null,
    kelembapan_max: null,
    batasan_id: null
});

const snackbar = ref(false);
const snackbarText = ref("");
const snackbarColor = ref("success");

const devicesFilterList = computed(() => {
    return devicesList.value.map(device => ({
        text: device.nama_alat,
        value: device.id
    }));
});

const filteredSensorList = computed(() => {
    const q = filterById.value;
    if (q === null || q === undefined) {
        return sensorList.value;
    }

    const numeric = Number(q);
    return sensorList.value.filter((sensor) => Number(sensor.id_alat) === numeric);
});

const formatDate = (dateString) => {
    try {
        const date = new Date(dateString);

        if (isNaN(date.getTime())) {
            return 'Invalid Date';
        }

        return date.toLocaleDateString("id-ID", {
            weekday: "short",
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    } catch (error) {
        console.error('Error formatting date:', error, dateString);
        return 'Invalid Date';
    }
};

const getSensors = async () => {
    loading.value = true;

    try {
        console.log("Fetching sensors from API...");

        await loadAllBatasan();

        await loadDevicesList();

        const response = await deviceAPI.getAllSensors();

        if (response.data.success) {
            sensorList.value = response.data.data.map((sensor) => {
                const batasan = getBatasanBySensorId(sensor.id);

                const namaAlat = devicesMap.value.get(sensor.id_alat) || `Alat ${sensor.id_alat}`;

                return {
                    ...sensor,
                    nama_alat: namaAlat,
                    created_at: formatDate(sensor.created_at),
                    updated_at: formatDate(sensor.updated_at),
                    batasan: batasan ? {
                        id: batasan.id,
                        suhu_min: batasan.suhu_min,
                        suhu_max: batasan.suhu_max,
                        kelembapan_min: batasan.kelembapan_min,
                        kelembapan_max: batasan.kelembapan_max
                    } : null
                };
            });

            console.log("Sensors loaded:", sensorList.value.length);
        } else {
            console.error("API returned success: false");
        }
    } catch (error) {
        console.error("Error fetching sensors:", error);
        showError("Gagal memuat data sensor");
    } finally {
        loading.value = false;
    }
};

const loadDevicesList = async () => {
    loadingDevices.value = true;
    try {
        const response = await deviceAPI.getAllDevices();
        if (response.data.success) {
            devicesList.value = response.data.data;

            devicesMap.value.clear();
            response.data.data.forEach(device => {
                devicesMap.value.set(device.id, device.nama_alat);
            });

            console.log('Devices loaded:', devicesList.value.length);
        }
    } catch (error) {
        console.error("Error loading devices:", error);
        showError("Gagal memuat daftar alat");
    } finally {
        loadingDevices.value = false;
    }
};

const openDialogAdd = async () => {
    editMode.value = false;
    formData.value = {
        id: null,
        id_alat: null,
        nama_sensor: "",
        suhu_min: null,
        suhu_max: null,
        kelembapan_min: null,
        kelembapan_max: null,
        batasan_id: null
    };
    await loadDevicesList();
    dialog.value = true;
};

const openDialogEdit = async (item) => {
    editMode.value = true;

    formData.value = {
        id: item.id,
        id_alat: item.id_alat,
        nama_sensor: item.nama_sensor,
        suhu_min: item.batasan?.suhu_min || null,
        suhu_max: item.batasan?.suhu_max || null,
        kelembapan_min: item.batasan?.kelembapan_min || null,
        kelembapan_max: item.batasan?.kelembapan_max || null,
        batasan_id: item.batasan?.id || null
    };

    await loadDevicesList();
    dialog.value = true;
};

const openDialogDelete = (item) => {
    itemToDelete.value = item;
    dialogDelete.value = true;
};

const closeDialog = () => {
    dialog.value = false;
    formData.value = {
        id: null,
        id_alat: null,
        nama_sensor: "",
        suhu_min: null,
        suhu_max: null,
        kelembapan_min: null,
        kelembapan_max: null,
        batasan_id: null
    };
};

const submitForm = async () => {
    if (!formData.value.id_alat) {
        showError("Alat wajib dipilih!");
        return;
    }
    if (!formData.value.nama_sensor) {
        showError("Nama sensor wajib diisi!");
        return;
    }

    loadingSubmit.value = true;
    try {
        let response;

        if (editMode.value) {
            response = await deviceAPI.updateSensor(formData.value.id, {
                id_alat: formData.value.id_alat,
                nama_sensor: formData.value.nama_sensor,
            });
        } else {
            response = await deviceAPI.createSensor({
                id_alat: formData.value.id_alat,
                nama_sensor: formData.value.nama_sensor,
            });
        }

        if (!response.data.success) {
            showError(response.data.message || "Gagal menyimpan sensor");
            return;
        }

        const sensorId = editMode.value ? formData.value.id : response.data.data.id;

        const hasBatasanData = formData.value.suhu_min !== null &&
            formData.value.suhu_max !== null &&
            formData.value.kelembapan_min !== null &&
            formData.value.kelembapan_max !== null;

        if (hasBatasanData) {
            const batasanData = {
                id_sensor: sensorId,
                suhu_min: formData.value.suhu_min,
                suhu_max: formData.value.suhu_max,
                kelembapan_min: formData.value.kelembapan_min,
                kelembapan_max: formData.value.kelembapan_max,
            };

            try {
                if (formData.value.batasan_id) {
                    await updateBatasan(formData.value.id, batasanData);
                } else {
                    await createBatasan(batasanData);
                }
            } catch (err) {
                console.warn("Failed to save batasan:", err);
                showError("Sensor berhasil disimpan, tapi batasan gagal disimpan");
            }
        }

        showSuccess(
            editMode.value
                ? "Sensor berhasil diupdate!"
                : "Sensor berhasil ditambahkan!"
        );
        closeDialog();
        await getSensors();

    } catch (error) {
        console.error("Error submitting sensor:", error);
        showError(error.response?.data?.message || "Terjadi kesalahan saat menyimpan");
    } finally {
        loadingSubmit.value = false;
    }
};

const confirmDelete = async () => {
    if (!itemToDelete.value) return;

    loadingSubmit.value = true;
    try {
        const response = await deviceAPI.deleteSensor(itemToDelete.value.id);

        if (response.data.success) {
            showSuccess("Sensor berhasil dihapus!");
            dialogDelete.value = false;
            await getSensors();
        } else {
            showError(response.data.message || "Gagal menghapus sensor");
        }
    } catch (error) {
        console.error("Error deleting sensor:", error);
        showError(error.response?.data?.message || "Terjadi kesalahan saat menghapus");
    } finally {
        loadingSubmit.value = false;
        itemToDelete.value = null;
    }
};

const showSuccess = (message) => {
    snackbarText.value = message;
    snackbarColor.value = "success";
    snackbar.value = true;
};

const showError = (message) => {
    snackbarText.value = message;
    snackbarColor.value = "error";
    snackbar.value = true;
};

onMounted(async () => {
    console.log("Component mounted");
    await getSensors();
});
</script>

<style scoped>
.v-data-table :deep(.v-data-table__th) {
    font-weight: 600;
    background-color: rgb(var(--v-theme-surface));
}
</style>