<template>
  <div class="skeleton-overview h-100">
    <BRow class="text-center">
      <BCol>
        <skeleton-loader-element :height="118" />
      </BCol>
      <BCol cols="6" />
      <BCol>
        <div class="b-right m-4">
          <BRow>
            <BCol>
              <skeleton-loader-element full-radius :width="61" :height="61" />
            </BCol>
            <BCol>
              <skeleton-loader-element />
              <skeleton-loader-element />
            </BCol>
          </BRow>
        </div>
      </BCol>
    </BRow>
    <BRow class="text-center mt-5 pt-5">
      <BCol cols="12" lg="">
        <skeleton-loader-element width="85%" :height="466" use-gradido-radius />
      </BCol>
      <BCol cols="12" lg="6">
        <BRow class="d-flex justify-content-between">
          <skeleton-loader-element width="45%" :height="105" use-gradido-radius />
          <skeleton-loader-element width="45%" :height="105" use-gradido-radius />
        </BRow>
        <skeleton-loader-element :height="450" use-gradido-radius />
      </BCol>
      <BCol cols="12" lg="">
        <skeleton-loader-element width="85%" />
        <BRow>
          <BCol style="max-width: min-content">
            <skeleton-loader-element full-radius :width="61" :height="61" />
          </BCol>
          <BCol>
            <skeleton-loader-element />
            <skeleton-loader-element />
          </BCol>
        </BRow>
        <BRow>
          <BCol style="max-width: min-content">
            <skeleton-loader-element full-radius :width="61" :height="61" />
          </BCol>
          <BCol>
            <skeleton-loader-element />
            <skeleton-loader-element />
          </BCol>
        </BRow>
        <BRow>
          <BCol style="max-width: min-content">
            <skeleton-loader-element full-radius :width="61" :height="61" />
          </BCol>
          <BCol>
            <skeleton-loader-element />
            <skeleton-loader-element />
          </BCol>
        </BRow>
      </BCol>
    </BRow>
  </div>
</template>
<script>
import SkeletonLoaderElement from '@/components/SkeletonLoaderElement.vue'

export default {
  name: 'SkeletonOverview',
  components: { SkeletonLoaderElement },
}
</script>
