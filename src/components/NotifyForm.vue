<template>
  <div class="mt-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
    <h3 class="font-semibold text-gray-900 dark:text-gray-100 mb-2">
      🔔 Recevoir les alertes par email
    </h3>

    <form v-if="!subscribed" @submit.prevent="subscribe" class="flex gap-2">
      <input
        v-model="email"
        type="email"
        placeholder="votre@email.com"
        required
        class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
               bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
               focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
      />
      <button
        type="submit"
        :disabled="submitting"
        class="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400
               text-white text-sm font-medium rounded-lg transition-colors"
      >
        {{ submitting ? '...' : 'S\'abonner' }}
      </button>
    </form>

    <p v-if="subscribed" class="text-green-600 text-sm">
      ✅ Abonné ! Vous recevrez un email si les alertes changent.
    </p>
    <p v-if="errorMsg" class="text-red-500 text-sm mt-1">{{ errorMsg }}</p>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
  latitude: Number,
  longitude: Number,
  communeName: String,
});

const email = ref('');
const submitting = ref(false);
const subscribed = ref(false);
const errorMsg = ref('');

async function subscribe() {
  if (!props.latitude || !props.longitude) {
    errorMsg.value = 'Position non disponible. Activez le GPS ou saisissez une ville.';
    return;
  }

  submitting.value = true;
  errorMsg.value = '';

  try {
    const res = await fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email.value,
        latitude: props.latitude,
        longitude: props.longitude,
        communeName: props.communeName,
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erreur serveur');

    subscribed.value = true;
  } catch (e) {
    errorMsg.value = e.message;
  } finally {
    submitting.value = false;
  }
}
</script>
