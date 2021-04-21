<template>
  <base-nav
    container-classes="container-fluid"
    class="navbar-top navbar-expand"
    :class="{ 'navbar-dark': type === 'default' }"
  >
    <!-- Navbar links -->
    <b-navbar-nav class="align-items-center ml-md-auto">
      <!-- This item dont have <b-nav-item> because item have data-action/data-target on tag <a>, wich we cant add -->
      <li class="nav-item d-sm-none"></li>
    </b-navbar-nav>
    <b-navbar-nav class="align-items-center ml-auto ml-md-0">
      <a class="pr-1" slot="title-container">
        <b-media no-body class="align-items-center">
          <span class="pb-2 text-lg font-weight-bold">
            {{ $store.state.email }}
          </span>
          <b-media-body class="ml-2 d-none d-lg-block">
            <span class="avatar">
              <vue-qrcode :value="$store.state.email" type="image/png"></vue-qrcode>
            </span>
          </b-media-body>
        </b-media>
      </a>
    </b-navbar-nav>
  </base-nav>
</template>
<script>
import { BaseNav } from '@/components'
import VueQrcode from 'vue-qrcode'
import loginAPI from '../../apis/loginAPI'

export default {
  components: {
    BaseNav,
    VueQrcode,
  },
  props: {
    type: {
      type: String,
    },
  },
}
</script>
