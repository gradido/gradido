<template>
  <b-card class="bg-transparent">
    <div class="w-100 text-center">
      <vue-qrcode :value="$store.state.email" type="image/png"></vue-qrcode>
    </div>

    <b-row>
      <b-col>
        <div class="card-profile-stats d-flex justify-content-center mt-md-5">
          <div>
            <span class="heading">
              {{ $n(balance) }}
            </span>
            <span class="description">GDD</span>
          </div>
          <div>
            <span class="heading">{{ $n(transactionCount) }}</span>
            <span class="description">Transactions</span>
          </div>
          <div>
            <span class="heading">--</span>
            <span class="description">Community</span>
          </div>
        </div>
      </b-col>
    </b-row>
    <b-container>
      <b-row class="mb-4 text-right">
        <b-col class="text-right" @click="edit = !edit">
          <span v-if="edit">bearbeiten</span>
          <div v-else>
            <span>
              bearbeiten
              <b>abbrechen</b>
            </span>
            <span class="ml-4 text-success display-4">speichern</span>
          </div>
        </b-col>
      </b-row>
    </b-container>
    <div>
      <b-row class="mb-3">
        <b-col class="col-lg-3 col-md-10 col-sm-10 text-md-left text-lg-right">
          <small>Vorname</small>
        </b-col>
        <b-col v-if="edit" class="col-md-9 col-sm-10">{{ UserProfileTestData.name }}</b-col>
        <b-col v-else class="col-md-9 col-sm-10">
          <b-input type="text" v-model="UserProfileTestData.name"></b-input>
        </b-col>
      </b-row>
      <b-row class="mb-3">
        <b-col class="col-lg-3 col-md-10 col-sm-10 text-md-left text-lg-right">
          <small>Nachname</small>
        </b-col>
        <b-col v-if="edit" class="col-md-9 col-sm-10">{{ UserProfileTestData.lastname }}</b-col>
        <b-col v-else class="col-md-9 col-sm-10">
          <b-input type="text" v-model="UserProfileTestData.lastname"></b-input>
        </b-col>
      </b-row>
      <b-row class="mb-3">
        <b-col class="col-lg-3 col-md-10 col-sm-10 text-md-left text-lg-right">
          <small>Beschreibung</small>
        </b-col>
        <b-col v-if="edit" class="col-md-9 col-sm-10">{{ UserProfileTestData.desc }}</b-col>
        <b-col v-else class="col-md-9 col-sm-10">
          <b-textarea
            v-value="UserProfileTestData.dec"
            placeholder="Enter something..."
            rows="3"
            max-rows="6"
          ></b-textarea>
        </b-col>
      </b-row>
      <b-row class="mb-3">
        <b-col class="col-lg-3 col-md-10 col-sm-10 text-md-left text-lg-right">
          <small>UserBild</small>
        </b-col>
        <b-col v-if="edit" class="col-md-9 col-sm-10">{{ UserProfileTestData.img }}</b-col>
        <b-col v-else class="col-md-9 col-sm-10">
         <vue-qrcode :value="$store.state.email" type="image/png"></vue-qrcode>
 
          <b-form-file accept="image/jpeg, image/png, image/gif" v-model="UserProfileTestData.img"></b-form-file>
        </b-col>
      </b-row>

      <b-row class="mb-3">
        <b-col class="col-lg-3 col-md-10 col-sm-10 text-md-left text-lg-right">
          <small>E-Mail</small>
        </b-col>
        <b-col v-if="edit" class="col-md-9 col-sm-10">{{ $store.state.email }}</b-col>
        <b-col v-else class="col-md-9 col-sm-10">
          <b-input type="text" v-model="$store.state.email"></b-input>
        </b-col>
      </b-row>
    </div>
    <hr />
    <b-container>
      <b-row class="mb-4 text-right">
        <b-col class="text-right" @click="editpwd = !editpwd">
          <span v-if="editpwd">Passwort ändern</span>
          <div v-else>
            <span>
              Passwort ändern
              <b>abbrechen</b>
            </span>
            <span class="ml-4 text-success display-4">speichern</span>
          </div>
        </b-col>
      </b-row>

      <div v-if="!editpwd">
       <b-row class="mb-3">
        <b-col class="col-lg-3 col-md-10 col-sm-10 text-md-left text-lg-right">
          <small>altes Passwort</small>
        </b-col>       
          <b-col class="col-md-9 col-sm-10">
          <b-input type="text" placeholder="altes Passwort"></b-input>

        </b-col>
      </b-row>
       <b-row class="mb-3">
        <b-col class="col-lg-3 col-md-10 col-sm-10 text-md-left text-lg-right">
          <small>neues Passwort</small>
        </b-col>       
          <b-col class="col-md-9 col-sm-10">

          <b-input type="text" placeholder="neues Passwort"></b-input>

        </b-col>
      </b-row>
       <b-row class="mb-3">
        <b-col class="col-lg-3 col-md-10 col-sm-10 text-md-left text-lg-right">
          <small>neues Passwort wiederholen</small>
        </b-col>       
          <b-col class="col-md-9 col-sm-10">
          <b-input type="text" placeholder="neues Passwort wiederholen"></b-input>
        </b-col>
      </b-row>
    </div>
    </b-container>
  </b-card>
</template>
<script>
import VueQrcode from 'vue-qrcode'

export default {
  name: 'profilecard',
  components: {
    VueQrcode,
  },
  data() {
    return {
      edit: true,
      editpwd: true,
      edit_button_text: 'edit',
    }
  },
  props: {
    balance: { type: Number, default: 0 },
    transactionCount: { type: Number, default: 0 },
    UserProfileTestData: { type: Object },
  },
}
</script>
<style></style>
