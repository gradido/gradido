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
            <span class="description">{{ $t('transactions') }}</span>
          </div>
          <div>
            <span class="heading">--</span>
            <span class="description">{{ $t('community') }}</span>
          </div>
        </div>
      </b-col>
    </b-row>
    <b-container>
      <b-row class="mb-4 text-right">
        <b-col class="text-right" @click="edit_userdata = !edit_userdata">
          <span v-if="edit_userdata">{{ $t('form.edit') }}</span>
          <div v-else>
            <span>
              {{ $t('form.edit') }}
              <b>{{ $t('form.cancel') }}</b>
            </span>
            <span class="ml-4 text-success display-4">{{ $t('form.save') }}</span>
          </div>
        </b-col>
      </b-row>
    </b-container>
    <div>
      <b-row class="mb-3">
        <b-col class="col-lg-3 col-md-10 col-sm-10 text-md-left text-lg-right">
          <small>{{ $t('form.firstname') }}</small>
        </b-col>
        <b-col v-if="edit_userdata" class="col-md-9 col-sm-10">
          {{ UserProfileTestData.name }}
        </b-col>
        <b-col v-else class="col-md-9 col-sm-10">
          <b-input type="text" v-model="UserProfileTestData.name"></b-input>
        </b-col>
      </b-row>
      <b-row class="mb-3">
        <b-col class="col-lg-3 col-md-10 col-sm-10 text-md-left text-lg-right">
          <small>{{ $t('form.lastname') }}</small>
        </b-col>
        <b-col v-if="edit_userdata" class="col-md-9 col-sm-10">
          {{ UserProfileTestData.lastname }}
        </b-col>
        <b-col v-else class="col-md-9 col-sm-10">
          <b-input type="text" v-model="UserProfileTestData.lastname"></b-input>
        </b-col>
      </b-row>
      <b-row class="mb-3">
        <b-col class="col-lg-3 col-md-10 col-sm-10 text-md-left text-lg-right">
          <small>{{ $t('form.description') }}</small>
        </b-col>
        <b-col v-if="edit_userdata" class="col-md-9 col-sm-10">
          {{ UserProfileTestData.desc }}
        </b-col>
        <b-col v-else class="col-md-9 col-sm-10">
          <b-textarea
            v-value="UserProfileTestData.dec"
            placeholder="Enter something..."
            rows="3"
            max-rows="6"
          ></b-textarea>
        </b-col>
      </b-row>
    </div>

    <hr />

    <b-container>
      <b-row class="mb-4 text-right">
        <b-col class="text-right" @click="edit_email = !edit_email">
          <span v-if="edit_email">E-Mail {{ $t('form.change') }}</span>
          <div v-else>
            <span>
              E-Mail {{ $t('form.change') }}
              <b>{{ $t('form.cancel') }}</b>
            </span>
            <span class="ml-4 text-success display-4">{{ $t('form.save') }}</span>
          </div>
        </b-col>
      </b-row>
    </b-container>
    <b-row class="mb-3">
      <b-col class="col-lg-3 col-md-10 col-sm-10 text-md-left text-lg-right">
        <small>E-Mail</small>
      </b-col>
      <b-col v-if="edit_email" class="col-md-9 col-sm-10">{{ $store.state.email }}</b-col>
      <b-col v-else class="col-md-9 col-sm-10">
        <b-input type="text" v-model="$store.state.email"></b-input>
      </b-col>
    </b-row>

    <hr />

    <b-container>
      <b-row class="mb-4 text-right">
        <b-col class="text-right" @click="edit_username = !edit_username">
          <span v-if="edit_username">{{ $t('form.username') }} {{ $t('form.change') }}</span>
          <div v-else>
            <span>
              {{ $t('form.username') }} {{ $t('form.change') }}
              <b>{{ $t('form.cancel') }}</b>
            </span>
            <span class="ml-4 text-success display-4">{{ $t('form.save') }}</span>
          </div>
        </b-col>
      </b-row>
    </b-container>
    <b-row class="mb-3">
      <b-col class="col-lg-3 col-md-10 col-sm-10 text-md-left text-lg-right">
        <small>{{ $t('form.username') }}</small>
      </b-col>
      <b-col v-if="edit_username" class="col-md-9 col-sm-10">
        @{{ UserProfileTestData.username }}
      </b-col>
      <b-col v-else class="col-md-9 col-sm-10">
        <b-input type="text" v-model="UserProfileTestData.username"></b-input>
        <div>
          {{ $t('form.change_username_info') }}
        </div>
      </b-col>
    </b-row>

    <hr />

    <b-container>
      <b-row class="mb-4 text-right">
        <b-col class="text-right" @click="edit_pwd = !edit_pwd">
          <span v-if="edit_pwd">{{ $t('form.password') }} {{ $t('form.change') }}</span>
          <div v-else>
            <span>
              {{ $t('form.password') }} {{ $t('form.change') }}
              <b>{{ $t('form.cancel') }}</b>
            </span>
            <span class="ml-4 text-success display-4">{{ $t('form.save') }}</span>
          </div>
        </b-col>
      </b-row>

      <div v-if="!edit_pwd">
        <b-row class="mb-3">
          <b-col class="col-lg-3 col-md-10 col-sm-10 text-md-left text-lg-right">
            <small>{{ $t('form.password_old') }}</small>
          </b-col>
          <b-col class="col-md-9 col-sm-10">
            <b-input type="text" :placeholder="$t('form.password_old')"></b-input>
          </b-col>
        </b-row>
        <b-row class="mb-3">
          <b-col class="col-lg-3 col-md-10 col-sm-10 text-md-left text-lg-right">
            <small>{{ $t('form.password_new') }}</small>
          </b-col>
          <b-col class="col-md-9 col-sm-10">
            <b-input type="text" :placeholder="$t('form.password_new')"></b-input>
          </b-col>
        </b-row>
        <b-row class="mb-3">
          <b-col class="col-lg-3 col-md-10 col-sm-10 text-md-left text-lg-right">
            <small>{{ $t('form.password_new_repeat') }}</small>
          </b-col>
          <b-col class="col-md-9 col-sm-10">
            <b-input type="text" :placeholder="$t('form.password_new_repeat')"></b-input>
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
      edit_userdata: true,
      edit_pwd: true,
      edit_email: true,
      edit_username: true,
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
