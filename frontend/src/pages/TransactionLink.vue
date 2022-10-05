<template>
  <div class="show-transaction-link-informations">
    <b-container class="mt-4">
      <transaction-link-item :type="itemType">
        <template #LOGGED_OUT>
          <redeem-logged-out :linkData="linkData" :isContributionLink="isContributionLink" />
        </template>

        <template #SELF_CREATOR>
          <redeem-self-creator :linkData="linkData" />
        </template>

        <template #VALID>
          <redeem-valid
            :linkData="linkData"
            :isContributionLink="isContributionLink"
            @mutation-link="mutationLink"
          />
        </template>

        <template #TEXT>
          <redeemed-text-box :text="redeemedBoxText" />
        </template>
      </transaction-link-item>
    </b-container>
  </div>
</template>
<script>
import TransactionLinkItem from '@/components/TransactionLinkItem'
import RedeemLoggedOut from '@/components/LinkInformations/RedeemLoggedOut'
import RedeemSelfCreator from '@/components/LinkInformations/RedeemSelfCreator'
import RedeemValid from '@/components/LinkInformations/RedeemValid'
import RedeemedTextBox from '@/components/LinkInformations/RedeemedTextBox'
import { queryTransactionLink } from '@/graphql/queries'
import { redeemTransactionLink } from '@/graphql/mutations'

export default {
  name: 'TransactionLink',
  components: {
    TransactionLinkItem,
    RedeemLoggedOut,
    RedeemSelfCreator,
    RedeemValid,
    RedeemedTextBox,
  },
  data() {
    return {
      img: '/img/brand/green.png',
      linkData: {
        __typename: 'TransactionLink',
        amount: '123.45',
        memo: 'memo',
        user: {
          firstName: 'Bibi',
        },
        deletedAt: null,
      },
    }
  },
  methods: {
    setTransactionLinkInformation() {
      this.$apollo
        .query({
          fetchPolicy: 'no-cache',
          query: queryTransactionLink,
          variables: {
            code: this.$route.params.code,
          },
        })
        .then((result) => {
          this.linkData = result.data.queryTransactionLink
          if (this.linkData.__typename === 'ContributionLink' && this.$store.state.token) {
            this.mutationLink(this.linkData.amount)
          }
        })
        .catch((err) => {
          this.toastError(err.message)
        })
    },
    mutationLink(amount) {
      this.$apollo
        .mutate({
          mutation: redeemTransactionLink,
          variables: {
            code: this.$route.params.code,
          },
        })
        .then(() => {
          this.toastSuccess(
            this.$t('gdd_per_link.redeemed', {
              n: amount,
            }),
          )
          this.$router.push('/overview')
        })
        .catch((err) => {
          this.toastError(err.message)
          this.$router.push('/overview')
        })
    },
  },
  computed: {
    isContributionLink() {
      return this.$route.params.code.search(/^CL-/) === 0
    },
    itemType() {
      // link is deleted: at, from
      if (this.linkData.deletedAt) {
        // eslint-disable-next-line vue/no-side-effects-in-computed-properties
        this.redeemedBoxText = this.$t('gdd_per_link.link-deleted', {
          date: this.$d(new Date(this.linkData.deletedAt), 'long'),
        })
        return `TEXT`
      }
      // link ist abgelaufen, nicht gelöscht
      if (new Date(this.linkData.validUntil) < new Date()) {
        // eslint-disable-next-line vue/no-side-effects-in-computed-properties
        this.redeemedBoxText = this.$t('gdd_per_link.link-expired', {
          date: this.$d(new Date(this.linkData.validUntil), 'long'),
        })
        return `TEXT`
      }

      // der link wurde eingelöst, nicht gelöscht
      if (this.linkData.redeemedAt) {
        // eslint-disable-next-line vue/no-side-effects-in-computed-properties
        this.redeemedBoxText = this.$t('gdd_per_link.redeemed-at', {
          date: this.$d(new Date(this.linkData.redeemedAt), 'long'),
        })
        return `TEXT`
      }

      if (this.$store.state.token) {
        // logged in, nicht berechtigt einzulösen, eigener link
        if (this.linkData.user && this.$store.state.email === this.linkData.user.email) {
          return `SELF_CREATOR`
        }

        // logged in und berechtigt einzulösen
        if (!this.linkData.redeemedAt && !this.linkData.deletedAt) {
          return `VALID`
        }
      }

      return `LOGGED_OUT`
    },
  },
  created() {
    this.setTransactionLinkInformation()
    this.$emit('set-mobile-start', false)
  },
}
</script>
