<template>
  <div>
    <div class="header pb-8 pt-5 pt-lg-8 d-flex align-items-center profile-header">
      <b-container fluid>
        <!-- Mask -->
        <span class="mask bg-gradient-success opacity-8"></span>
        <!-- Header container -->
        <b-container fluid class="d-flex align-items-center">
          <b-row >            
          <base-button><router-link to="/profileedit"  > Edit Profil</router-link> </base-button>
          </b-row>
        </b-container>
      </b-container>
    </div>

    <b-container fluid class="mt--6">
      <b-row>
        <b-col xl="12" class="order-xl-2 mb-5">
          <user-card></user-card>
        </b-col>
        
      </b-row>
    </b-container>
  </div>
</template>
<script>
import BaseButton from '../../components/BaseButton.vue';
  import UserCard from './UserProfile/UserCard.vue';

  export default {
    components: {
      UserCard,
        BaseButton
    }
  };
</script>
<style>
</style>
