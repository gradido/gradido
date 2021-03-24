<template>
  <!--Notice modal-->
  <modal
    :show.sync="$store.state.modals"
    modal-classes="modal-danger"
    modal-content-classes="bg-gradient-danger"
  >
    <h6 slot="header" class="modal-title">Your attention is required</h6>

    <div class="py-3 text-center">
      <form ref="form" @submit.stop.prevent="handleSubmit">
        <b-form-group
          label="Name"
          label-for="name-input"
          invalid-feedback="Name is required"
          :state="nameState"
        >
          <b-form-input
            id="name-input"
            v-model="name"
            :state="nameState"
            required
          ></b-form-input>
        </b-form-group>
      </form>
    </div>

    <template slot="footer">
      <base-button type="white">Ok</base-button>
      <base-button
        type="link"
        class="ml-auto"
        @click="$store.state.modals = false"
      >
        abbrechen
      </base-button>
    </template>
  </modal>
</template>

<script>
export default {
  name: "modal",
  data() {
    return {
      name: "",
      nameState: null,
      submittedNames: []
    };
  },
  /*Modal*/
  checkFormValidity() {
    const valid = this.$refs.form.checkValidity();
    this.nameState = valid;
    return valid;
  },
  resetModal() {
    this.name = "";
    this.nameState = null;
  },
  handleOk(bvModalEvt) {
    // Prevent modal from closing
    bvModalEvt.preventDefault();
    // Trigger submit handler
    this.handleSubmit();
  },
  handleSubmit() {
    // Exit when the form isn't valid
    if (!this.checkFormValidity()) {
      return;
    }
    // Push the name to submitted names
    this.submittedNames.push(this.name);
    this.$store.state.modals = false;
    this.$store.commit("loginAsAdmin");
    this.$router.push("/AdminOverview");

    // Hide the modal manually
    this.$nextTick(() => {
      this.$bvModal.hide("modal-prevent-closing");
    });
  }
};
</script>
<style>
.modal-backdrop {
  background-color: rgba(0, 0, 0, 0.6) !important;
}
</style>
