// AI-GENERATED — not an architecture reference
import {
  BButton,
  BCard,
  BCardBody,
  BCardTitle,
  BCol,
  BRow,
  type ButtonVariant,
} from 'bootstrap-vue-next'
import { defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'
import News from '@/assets/News/news.json'
import classes from './CommunityNews.module.css'

// What an entry of news.json may hold; only `locale` and `text` are in every one.
interface NewsItem {
  locale: string
  text: string
  date?: string
  extra?: string
  extra2?: string
  email?: string
  button?: string
  url?: string
  internUrl?: string
}

export const CommunityNews = defineComponent({
  name: 'CommunityNews',
  setup() {
    const { locale } = useI18n()

    return () => (
      <div class={['community-news', classes['community-news']]}>
        {(News as NewsItem[]).map((item) => (
          <div key={item.locale}>
            {item.locale === locale.value ? (
              <BCard class='bg-white app-box-shadow gradido-border-radius'>
                <BCardBody>
                  <BCardTitle class='h2'>{item.text}</BCardTitle>

                  <div class='h3'>{item.date}</div>

                  <BRow class='my-5'>
                    <BCol>
                      {item.extra}
                      <br />
                      <br />
                      {item.extra2 ? <span>{item.extra2}</span> : null}
                      {item.email ? (
                        <span>
                          <a href={`mailto:${item.email}`}>{item.email}</a>
                        </span>
                      ) : null}
                    </BCol>
                  </BRow>

                  <BRow class='my-5'>
                    <BCol cols='12' class='d-flex'>
                      <div class='ms-auto'>
                        {item.url ? (
                          <BButton
                            variant={'gradido' as ButtonVariant}
                            href={item.url}
                            target='_blank'
                          >
                            {item.button}
                          </BButton>
                        ) : item.internUrl ? (
                          <RouterLink to={item.internUrl}>
                            <BButton variant={'gradido' as ButtonVariant}>{item.button}</BButton>
                          </RouterLink>
                        ) : null}
                      </div>
                    </BCol>
                  </BRow>
                </BCardBody>
              </BCard>
            ) : null}
          </div>
        ))}
      </div>
    )
  },
})
