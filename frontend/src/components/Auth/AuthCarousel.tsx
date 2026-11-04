// AI-GENERATED — not an architecture reference
import { BCarousel, BCarouselSlide } from 'bootstrap-vue-next'
import { defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import './AuthCarousel.css'

export const AuthCarousel = defineComponent({
  name: 'AuthCarousel',
  setup() {
    const { t } = useI18n()

    return () => (
      <div>
        <BCarousel interval={13000} ride='carousel'>
          <BCarouselSlide imgSrc='/img/template/Foto_01_2400_small.jpg'>
            <div class='caption-first-text'>{t('auth.left.gratitude')}</div>
            <div class='caption-second-text'>{t('auth.left.oneGratitude')}</div>
          </BCarouselSlide>
          <BCarouselSlide imgSrc='/img/template/Foto_05_2400_small.jpg'>
            <div class='caption-first-text'>{t('auth.left.dignity')}</div>
            <div class='caption-second-text'>{t('auth.left.oneDignity')}</div>
          </BCarouselSlide>
          <BCarouselSlide imgSrc='/img/template/Foto_04_2400_small.jpg'>
            <div class='caption-first-text'>{t('auth.left.donation')}</div>
            <div class='caption-second-text'>{t('auth.left.oneDonation')}</div>
          </BCarouselSlide>
        </BCarousel>
      </div>
    )
  },
})
