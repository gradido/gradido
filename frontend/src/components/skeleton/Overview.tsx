// AI-GENERATED — not an architecture reference
import { BCol, BRow } from 'bootstrap-vue-next'
import { defineComponent } from 'vue'
import { SkeletonLoaderElement } from '@/components/SkeletonLoaderElement'

export const SkeletonOverview = defineComponent({
  name: 'SkeletonOverview',
  setup() {
    const contactRow = () => (
      <BRow>
        <BCol style='max-width: min-content'>
          <SkeletonLoaderElement fullRadius width={61} height={61} />
        </BCol>
        <BCol>
          <SkeletonLoaderElement />
          <SkeletonLoaderElement />
        </BCol>
      </BRow>
    )

    // `lg=""`, as the template wrote it: BCol's types do not list the empty string, and what it
    // makes of one stays BCol's.
    const lgEmpty = '' as 'auto'

    return () => (
      <div class='skeleton-overview h-100'>
        <BRow class='text-center'>
          <BCol>
            <SkeletonLoaderElement height={118} />
          </BCol>
          <BCol cols='6' />
          <BCol>
            <div class='b-right m-4'>
              <BRow>
                <BCol>
                  <SkeletonLoaderElement fullRadius width={61} height={61} />
                </BCol>
                <BCol>
                  <SkeletonLoaderElement />
                  <SkeletonLoaderElement />
                </BCol>
              </BRow>
            </div>
          </BCol>
        </BRow>
        <BRow class='text-center mt-5 pt-5'>
          <BCol cols='12' lg={lgEmpty}>
            <SkeletonLoaderElement width='85%' height={466} useGradidoRadius />
          </BCol>
          <BCol cols='12' lg='6'>
            <BRow class='d-flex justify-content-between'>
              <SkeletonLoaderElement width='45%' height={105} useGradidoRadius />
              <SkeletonLoaderElement width='45%' height={105} useGradidoRadius />
            </BRow>
            <SkeletonLoaderElement height={450} useGradidoRadius />
          </BCol>
          <BCol cols='12' lg={lgEmpty}>
            <SkeletonLoaderElement width='85%' />
            {contactRow()}
            {contactRow()}
            {contactRow()}
          </BCol>
        </BRow>
      </div>
    )
  },
})
