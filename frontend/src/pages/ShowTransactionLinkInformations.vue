<template>
  <div class="show-transaction-link-informations">
    <div class="text-center"><b-img :src="img" fluid alt="logo"></b-img></div>
    {{ displaySetup }}
    <hr />
    <b-container>
      <transaction-link-information-item :type="itemType">
        <template #X1><redeem-logged-out v-bind="displaySetup" /></template>

        <template #X2><redeem-self-creator v-bind="displaySetup" /></template>

        <template #X3><redeem-valid v-bind="displaySetup" @redeem-link="redeemLink" /></template>

        <template #X4><redeemed-text-box :text="redeemedBoxText" /></template>
      </transaction-link-information-item>
    </b-container>
  </div>
</template>
<script>
import TransactionLinkInformationItem from '@/components/TransactionLinkInformationItem'
import RedeemLoggedOut from '@/components/LinkInformatins/RedeemLoggedOut'
import RedeemSelfCreator from '@/components/LinkInformatins/RedeemSelfCreator'
import RedeemValid from '@/components/LinkInformatins/RedeemValid'
import RedeemedTextBox from '@/components/LinkInformatins/RedeemedTextBox'

import { queryTransactionLink } from '@/graphql/queries'
import { redeemTransactionLink } from '@/graphql/mutations'

export default {
  name: 'ShowTransactionLinkInformations',
  components: {
    TransactionLinkInformationItem,
    RedeemLoggedOut,
    RedeemSelfCreator,
    RedeemValid,
    RedeemedTextBox,
  },
  data() {
    return {
      img: '/img/brand/green.png',
      displaySetup: {
        amount: '123.45',
        memo: '',
        user: {
          firstName: '',
        },
        deletedAt: null,
      },
    }
  },
  methods: {
    setTransactionLinkInformation() {
      this.$apollo
        .query({
          query: queryTransactionLink,
          variables: {
            code: this.$route.params.code,
          },
        })
        .then((result) => {
          this.displaySetup = result.data.queryTransactionLink
        })
        .catch(() => {
          this.itemType = 'X4'
          this.displaySetup.deletedAt = true
        })
    },
    redeemLink() {
      this.$bvModal.msgBoxConfirm(this.$t('gdd_per_link.redeem-text')).then(async (value) => {
        if (value)
          await this.$apollo
            .mutate({
              mutation: redeemTransactionLink,
              variables: {
                id: this.displaySetup.id,
              },
            })
            .then((result) => {
              this.toastSuccess(
                this.$t('gdd_per_link.redeemed', {
                  n: this.displaySetup.amount,
                }),
              )
              this.$router.push('/overview')
            })
            .catch((err) => {
              this.toastError(err.message)
              this.$router.push('/overview')
            })
      })
    },
  },
  computed: {
    itemType() {
      // logged out
      // link wurde gelöscht: am, von
      if (this.displaySetup.deletedAt) {
        // eslint-disable-next-line vue/no-side-effects-in-computed-properties
        this.redeemedBoxText = this.$t('gdd_per_link.link-deleted', {
          date: this.displaySetup.deletedAt,
          user: this.displaySetup.firstName,
        })
        return 'X4'
      } else {
        // link ist abgelaufen, nicht gelöscht
        if (new Date(this.displaySetup.validUntil) < new Date()) {
          // eslint-disable-next-line vue/no-side-effects-in-computed-properties
          this.redeemedBoxText = this.$t('gdd_per_link.link-expired', {
            date: this.displaySetup.validUntil,
          })
          return 'X4'
        }

        // der link wurde eingelöst, nicht gelöscht
        if (this.displaySetup.redeemedAt) {
          // eslint-disable-next-line vue/no-side-effects-in-computed-properties
          this.redeemedBoxText = this.$t('gdd_per_link.redeemed-at', {
            date: this.displaySetup.redeemedAt,
          })
          return 'X4'
        }
      }

      if (!this.$store.state.token) {
        return 'X1'
      } else {
        // logged in, nicht berechtigt einzulösen, eigener link
        if (this.$store.state.email === this.displaySetup.user.email) {
          return 'X2'
        }

        // logged in und berechtigt einzulösen
        if (
          this.$store.state.email !== this.displaySetup.user.email &&
          !this.displaySetup.redeemedAt &&
          !this.displaySetup.deletedAt
        ) {
          return 'X3'
        }
      }

      return ''
    },
  },
  created() {
    this.setTransactionLinkInformation()
  },
}
</script>
