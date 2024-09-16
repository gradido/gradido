<template>
  <div class="skeleton-overview h-100">
    <BRow class="text-center">
      <BCol>
        <b-skeleton-img no-aspect animation="wave" height="118px"></b-skeleton-img>
      </BCol>
      <BCol cols="6">
        <b-skeleton animation="wave" class="mt-4 pt-5"></b-skeleton>
      </BCol>
      <BCol>
        <div class="b-right m-4">
          <BRow>
            <BCol><b-skeleton type="avatar"></b-skeleton></BCol>
            <BCol>
              <b-skeleton></b-skeleton>
              <b-skeleton></b-skeleton>
            </BCol>
          </BRow>
        </div>
      </BCol>
    </BRow>
    <BRow class="text-center mt-5 pt-5">
      <BCol cols="12" lg="">
        <b-skeleton animation="wave" width="85%"></b-skeleton>
        <b-skeleton animation="wave" width="55%"></b-skeleton>
        <b-skeleton animation="wave" width="70%"></b-skeleton>
      </BCol>
      <BCol cols="12" lg="6">
        <b-skeleton animation="wave" width="85%"></b-skeleton>
        <b-skeleton animation="wave" width="55%"></b-skeleton>
        <b-skeleton animation="wave" width="70%"></b-skeleton>
        <b-skeleton animation="wave" width="85%"></b-skeleton>
        <b-skeleton animation="wave" width="55%"></b-skeleton>
        <b-skeleton animation="wave" width="70%"></b-skeleton>
      </BCol>
      <BCol cols="12" lg="">
        <b-skeleton animation="wave" width="85%"></b-skeleton>
        <b-skeleton animation="wave" width="55%"></b-skeleton>
        <b-skeleton animation="wave" width="70%"></b-skeleton>
      </BCol>
    </BRow>
  </div>
</template>
<script>
export default {
  name: 'SkeletonOverview',
}
</script>
