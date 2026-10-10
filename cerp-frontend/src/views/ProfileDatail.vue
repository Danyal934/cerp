<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import Sidebar from '@/components/Sidebar.vue';
import Header from '@/components/Header.vue';

const router = useRouter();

const db = firebase.firestore();
const profiles = ref([]);

const fetchData = async () => {
  try {
    const querySnapshot = await db.collection('Profile').get();
    profiles.value = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching data:', error);
  }
};

onMounted(fetchData);

const itemsPerPage = 10;
const currentPage = ref(1);

const paginatedProfiles = computed(() => {
  const startIndex = (currentPage.value - 1) * itemsPerPage;
  return profiles.value.slice(startIndex, startIndex + itemsPerPage);
});

const totalPages = computed(() => Math.ceil(profiles.value.length / itemsPerPage));

const previousPage = () => {
  if (currentPage.value > 1) currentPage.value--;
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) currentPage.value++;
};

const setCurrentPage = (pageNumber) => {
  currentPage.value = pageNumber;
};

// Navigate to new view with UID
const viewProfile = (uid) => {
  router.push({ name: 'FileUpload', params: { uid } });
};

</script>

<template>
  <div class="d-flex">
    <Sidebar/>
    <div class="main-content p-5">
      <Header/>
      <div class="pageHeading pt-2 mb-md-4 mb-3">
        <p>Profiles</p>
      </div>
      <div>
        <table class="w-100 reportTable">
          <thead>
            <tr>
              <th>Email</th>
              <th>UID</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="profile in paginatedProfiles" :key="profile.id">
              <td>{{ profile.email }}</td>
              <td>{{ profile.uid }}</td>
              <td>
                <button @click="viewProfile(profile.uid)" class="btn btn-primary">NEXT</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <!-- Pagination controls -->
      <div class="d-flex justify-content-end">
        <div class="reportTablePagination">
          <i class='bx bx-chevron-left font-26' @click="previousPage" :class="{ 'disabled': currentPage === 1 }"></i>
          <div class="reportTablePaginationNumber d-flex gap-1">
            <span v-for="pageNumber in totalPages" :key="pageNumber" @click="setCurrentPage(pageNumber)"
              :class="{ 'active': currentPage === pageNumber }">{{ pageNumber }}</span>
          </div>
          <i class='bx bx-chevron-right font-26' @click="nextPage"
            :class="{ 'disabled': currentPage === totalPages }"></i>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
.btn-primary {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 5px 10px;
  border-radius: 5px;
  cursor: pointer;
}

.btn-primary:hover {
  background-color: #0056b3;
}
</style>
