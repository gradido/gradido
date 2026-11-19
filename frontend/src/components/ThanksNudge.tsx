// AI-GENERATED — not an architecture reference
import { defineComponent, nextTick, type PropType, ref, useId, watch } from 'vue'
import { AppAvatar } from '@/components/AppAvatar'
import classes from './ThanksNudge.module.scss'

/** One to choose: the label a name, `avatar` what AppAvatar draws (memberAvatarProps), or none. */
type ThanksNudgeChoice = {
  key: string
  label: string
  avatar?: InstanceType<typeof AppAvatar>['$props'] | null
}

/** A face beside a name in a choice: a little smaller than the chat's small faces (28 px). */
const CHOICE_FACE_SIZE = 22

export const ThanksNudge = defineComponent({
  name: 'ThanksNudge',
  props: {
    /** "Möchtest Du Dich bei … für das Gespräch bedanken?", "Dank weitergeben?", "Wem …?" */
    question: { type: String, required: true },
    /** The way there: "Danke sagen", "Jemandem danken". */
    yes: { type: String, required: true },
    /** "Nicht jetzt". */
    no: { type: String, required: true },
    /**
     * Whom to choose, where the way there opened a choice: `{ key, label, avatar }` each -- the
     * label a name, `avatar` what AppAvatar draws (memberAvatarProps), or none. Null otherwise.
     */
    choices: { type: Array as PropType<ThanksNudgeChoice[] | null>, default: null },
  },
  /**
   * `yes`: the way there was pressed. `choose`: the key of the one chosen. `no`: "Nicht jetzt" --
   * the line is not to come back.
   */
  emits: ['yes', 'choose', 'no'],
  setup(props, { emit }) {
    const questionId = `${useId()}-question`

    /**
     * Where the choice opens from the way there, the keyboard goes to the first one to choose: the
     * button it stood on is gone. Read before the page changes, while the button still holds it --
     * a keyboard that stood somewhere else stays there.
     */
    const root = ref<HTMLElement | null>(null)
    watch(
      () => props.choices,
      async (choices, before) => {
        if (!choices?.length || before) {
          return
        }
        const active = document.activeElement
        const here = !active || active === document.body || Boolean(root.value?.contains(active))
        if (!here) {
          return
        }
        await nextTick()
        root.value?.querySelector<HTMLElement>('[data-test="thanks-nudge-choice"]')?.focus()
      },
    )

    return () => (
      <div
        ref={root}
        class={['thanks-nudge', classes['thanks-nudge']]}
        role='group'
        aria-labelledby={questionId}
        data-test='thanks-nudge'
      >
        {/* A quiet suggestion to thank (W2, utils/thanksNudge): the question, the way there, and
            "Nicht jetzt" -- under one's own video invitation in a conversation of two, and in the
            opened row of a thank-you received. One line for both places, so that the two look and
            behave alike. (Inside the root, not above it: a comment beside the root makes two roots in
            development, and the parent's `$el` would be the comment.)

            A group named by its question: a keyboard that comes to the first button hears what it is
            about, and not only "Danke sagen". The parent decides what happens and what the words are;
            nothing here is stored or sent.

            In a group's thread (Bernd, 28.10.2026) the way there opens a choice: the members, each a
            button with face and name (`choices`), in place of the way there -- the parent asks whom
            with the question then. */}
        <p id={questionId} class='thanks-nudge-question' data-test='thanks-nudge-question'>
          {props.question}
        </p>
        {props.choices ? (
          <div class='thanks-nudge-choices' data-test='thanks-nudge-choices'>
            {props.choices.map((choice) => (
              <button
                key={choice.key}
                type='button'
                class='thanks-nudge-choice'
                data-test='thanks-nudge-choice'
                onClick={() => emit('choose', choice.key)}
              >
                {choice.avatar ? (
                  <span class='thanks-nudge-face' aria-hidden='true'>
                    <AppAvatar size={CHOICE_FACE_SIZE} color='#fff' {...choice.avatar} />
                  </span>
                ) : null}
                <span data-test='thanks-nudge-choice-name'>{choice.label}</span>
              </button>
            ))}
          </div>
        ) : null}
        <div class='thanks-nudge-actions'>
          {!props.choices ? (
            <button
              type='button'
              class='thanks-nudge-yes'
              data-test='thanks-nudge-yes'
              onClick={() => emit('yes')}
            >
              {props.yes}
            </button>
          ) : null}
          <button
            type='button'
            class='thanks-nudge-no'
            data-test='thanks-nudge-no'
            onClick={() => emit('no')}
          >
            {props.no}
          </button>
        </div>
      </div>
    )
  },
})
