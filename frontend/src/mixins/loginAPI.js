// TODO move this
const LOGIN_API_URL = 'http://localhost/login_api/'

// define a mixin object
const loginAPI = {
  mutations: {
    login: async () => {
      return axios.post(LOGIN_API_URL + 'unsecureLogin', data);
    },
    creatUser : async () => {
      return axios.post(LOGIN_API_URL + 'createUser', data);
    },     
    logout: async () => {
      return axios.post(LOGIN_API_URL + 'logout', data);
    },
  }
}

export default loginAPI