<template>
    <div class="p-6 text-center">
        <h1 class="text-3xl font-bold mb-4">🌍 Alerte près de moi</h1>
        <p v-if="loading">📡 Recherche d’alertes proches...</p>
        <p v-else-if="error" class="text-red-500">{{ error }}</p>
        <div v-else>
            <div v-if="alertQuake" class="text-orange-600 font-semibold">
                <p>⚠️ 🌍 Séisme (USGS) : Vérifié, {{ alertQuake }}</p>
            </div>
            <div v-if="alertRadon" class="text-yellow-600 font-semibold">
                <p>⚠️ ☢️ Radon (Géorisques) : Vérifié, {{ alertRadon }}</p>
            </div>
            <div v-if="!alertQuake && !alertRadon" class="text-green-600">
                <p>✅ Aucune alerte détectée, les API suivantes ont été vérifiées :</p>
                <ul class="list-disc text-left ml-6">
                    <li>🌍 Séisme (USGS) : Vérifié, aucun séisme détecté près de vous.</li>
                    <li>☢️ Radon (Géorisques) : Vérifié, aucun risque radon détecté près de vous.</li>
                </ul>
            </div>

            <!-- Affichage de l'adresse vérifiée -->
            <div v-if="verifiedAddress" class="text-gray-700 mt-4">
                <p>📍 Adresse vérifiée : {{ verifiedAddress }}</p>
            </div>
        </div>
        <button @click="reload" class="mt-4 bg-blue-500 text-white py-2 px-4 rounded">
            🔄 Rechercher à nouveau
        </button>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const loading = ref(true);
const error = ref(null);
const alertQuake = ref(null);
const alertRadon = ref(null);
const verifiedAddress = ref(null); // Nouvelle variable pour l'adresse vérifiée

async function getUserLocation() {
    return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
            (pos) => resolve(pos.coords),
            () => reject("❌ Position GPS refusée ou indisponible")
        );
    });
}

async function getCodeInsee(lat, lon) {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`;
    const response = await fetch(url);
    const data = await response.json();
    return {
        codeInsee: data.address.postcode,
        address: data.display_name
    };
}

async function fetchAlerts() {
    const lat = await getUserLocation();
    if (lat) {
        loading.value = true;
        try {
            // Séisme - USGS
            const quakeRes = await fetch(`https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&latitude=${lat.latitude}&longitude=${lat.longitude}&maxradiuskm=100&minmagnitude=4&orderby=time&limit=1`);
            const quakeData = await quakeRes.json();
            if (quakeData.features.length > 0) {
                const quake = quakeData.features[0];
                const mag = quake.properties.mag;
                const place = quake.properties.place;
                alertQuake.value = `Séisme M${mag} détecté près de ${place}`;
            } else {
                alertQuake.value = null;
            }

            // Radon - API Géorisques
            const {
                codeInsee,
                address
            } = await getCodeInsee(lat.latitude, lat.longitude);
            if (codeInsee) {
                const radonRes = await fetch(`https://georisques.gouv.fr/api/v1/radon?code_insee=${codeInsee}`);
                const radonData = await radonRes.json();
                if (radonData && radonData.features && radonData.features.length > 0) {
                    const radon = radonData.features[0];
                    const category = radon.properties.categorie;
                    alertRadon.value = `Potentiel radon de catégorie ${category} détecté à proximité`;
                }
                verifiedAddress.value = address
            } else {
                alertRadon.value = "Aucune donnée radon disponible pour votre localisation.";
            }
        } catch (e) {
            error.value = "Erreur lors de la récupération des données";
        } finally {
            loading.value = false;
        }
    }
}

function reload() {
    alertQuake.value = null;
    alertRadon.value = null;
    error.value = null;
    verifiedAddress.value = null; // Réinitialisation de l'adresse
    fetchAlerts();
}

onMounted(() => {
    fetchAlerts();
});
</script>

<style>
ul {
    list-style-type: none;
}
</style>
