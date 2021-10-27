import Vuex from 'vuex'
import Vue from 'vue'

Vue.use(Vuex)

export const mutations = {
  token: (state, token) => {
    state.token = token
  },
}

const store = new Vuex.Store({
  mutations,
  state: {
    token: null,
  },
})

export default store
