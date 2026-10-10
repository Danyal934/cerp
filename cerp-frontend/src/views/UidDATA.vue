<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';



const route = useRoute();
const uid = route.params.uid;
const profileData = ref(null);

const fetchProfileData = async () => {
  try {
    const querySnapshot = await firebase.firestore()
      .collection('Profile')
      .where('uid', '==', uid)
      .get();

    if (!querySnapshot.empty) {
      profileData.value = querySnapshot.docs[0].data();
    }
  } catch (error) {
    console.error('Error fetching profile data:', error);
  }
};

onMounted(fetchProfileData);
</script>

<template>
  <div class="profile-detail-container p-5">
    <div class="pageHeading pt-2 mb-md-4 mb-3">
      <p>Profiles Detail</p>
    </div>
  </div>
</template>

<style scoped>
h2 {
  color: #007bff;
}

p {
  font-size: 18px;
  line-height: 1.6;
}
</style>
