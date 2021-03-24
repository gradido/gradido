<template>
  <div>
    <!-- Header -->
    <div class="header p-4">
      <b-container class="container">
        <div class="header-body text-center mb-7">
          <b-row class="justify-content-center">
            <b-col xl="5" lg="6" md="8" class="px-2">
              <h1>{{ $t("site.signup.title") }}</h1>
              <p class="text-lead">{{ $t("site.signup.subtitle") }}</p>
            </b-col>
          </b-row>
        </div>
      </b-container>
    </div>
    <!-- Page content -->
    <b-container class="mt--8 p-1">
      <!-- Table -->
      <b-row class="justify-content-center">
        <b-col lg="6" md="8">
          <b-card
            no-body
            class="border-0"
            style="background-color: #ebebeba3 !important;"
          >
            <b-card-body class="py-lg-4 px-sm-0 px-0 px-md-2 px-lg-4">
              <div class="text-center text-muted mb-4">
                <small>{{ $t("signup") }}</small>
              </div>
              <validation-observer
                v-slot="{ handleSubmit }"
                ref="formValidator"
              >
                <b-form role="form" @submit.prevent="handleSubmit(onSubmit)">
                  <base-input
                    alternative
                    class="mb-3"
                    prepend-icon="ni ni-hat-3"
                    :placeholder="$t('form.firstname')"
                    name="Vorname"
                    :rules="{ required: true }"
                    v-model="model.firstname"
                  ></base-input>
                  <base-input
                    alternative
                    class="mb-3"
                    prepend-icon="ni ni-hat-3"
                    :placeholder="$t('form.lastname')"
                    name="Nachname"
                    :rules="{ required: true }"
                    v-model="model.lastname"
                  ></base-input>

                  <base-input
                    alternative
                    class="mb-3"
                    prepend-icon="ni ni-email-83"
                    :placeholder="$t('form.email')"
                    name="Email"
                    :rules="{ required: true, email: true }"
                    v-model="model.email"
                  ></base-input>

                  <base-input
                    alternative
                    class="mb-3"
                    prepend-icon="ni ni-lock-circle-open"
                    :placeholder="$t('form.password')"
                    type="password"
                    name="Password"
                    :rules="{ required: true, min: 6 }"
                    v-model="model.password"
                  ></base-input>
                  <div class="text-muted font-italic">
                    <small>
                      {{ $t("site.signup.strength") }}
                      <span class="text-success font-weight-700">
                        {{ $t("site.signup.strong") }}
                      </span>
                    </small>
                  </div>
                  <b-row class=" my-4">
                    <b-col cols="12">
                      <base-input
                        :rules="{ required: { allowFalse: false } }"
                        name="Privacy Policy"
                      >
                        <b-form-checkbox v-model="model.agree">
                          <span class="text-muted">
                            <a
                              href="https://gradido.net/de/datenschutz/"
                              target="_blank"
                            >
                              {{ $t("privacy_policy") }}
                            </a>
                            - {{ $t("site.signup.agree") }}
                          </span>
                        </b-form-checkbox>
                      </base-input>
                    </b-col>
                  </b-row>
                  <div class="text-center">
                    <b-button type="submit" variant="secondary" class="mt-4">
                      {{ $t("signup") }}
                    </b-button>
                  </div>
                </b-form>
              </validation-observer>
            </b-card-body>
          </b-card>
        </b-col>
      </b-row>
      <div class="text-center py-lg-4">
        <router-link to="/Login" class="mt-3">{{ $t("back") }}</router-link>
      </div>
    </b-container>
  </div>
</template>
<script>
export default {
  name: "register",
  data() {
    return {
      model: {
        firstname: "",
        lastname: "",
        email: "",
        password: "",
        password2: "",
        agree: false
      }
    };
  },
  methods: {
    onSubmit() {
      // console.log("this.modals =>", this.modals)
      this.$store.dispatch("createUser", {
        email: this.model.email,
        first_name: this.model.firstname,
        last_name: this.model.lastname,
        emailType: 2,
        password: this.model.password
      });
      this.model.email = "";
      this.model.firstname = "";
      this.model.lastname = "";
      this.model.password = "";
      this.$router.push("/thx");
    }
  }
};
</script>
<style></style>
