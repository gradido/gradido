<template>
  <div>
    <b-row class="text-center">
      <b-col>
        <b-skeleton-img no-aspect animation="wave" height="118px"></b-skeleton-img>
      </b-col>
      <b-col cols="6">
        <b-skeleton animation="wave" class="mt-4 pt-5"></b-skeleton>
      </b-col>
      <b-col>
        <div class="b-right m-4">
          <b-row>
            <b-col><b-skeleton type="avatar"></b-skeleton></b-col>
            <b-col>
              <b-skeleton></b-skeleton>
              <b-skeleton></b-skeleton>
            </b-col>
          </b-row>
        </div>
      </b-col>
    </b-row>
    <b-row class="text-center mt-5">
      <b-col>
        <b-skeleton animation="wave" width="85%"></b-skeleton>
        <b-skeleton animation="wave" width="55%"></b-skeleton>
        <b-skeleton animation="wave" width="70%"></b-skeleton>
      </b-col>
      <b-col cols="6">
        <b-skeleton animation="wave" width="85%"></b-skeleton>
        <b-skeleton animation="wave" width="55%"></b-skeleton>
        <b-skeleton animation="wave" width="70%"></b-skeleton>
        <b-skeleton animation="wave" width="85%"></b-skeleton>
        <b-skeleton animation="wave" width="55%"></b-skeleton>
        <b-skeleton animation="wave" width="70%"></b-skeleton>
      </b-col>
      <b-col>
        <b-skeleton animation="wave" width="85%"></b-skeleton>
        <b-skeleton animation="wave" width="55%"></b-skeleton>
        <b-skeleton animation="wave" width="70%"></b-skeleton>
      </b-col>
    </b-row>
  </div>
</template>
