export default defineAppConfig({
  ui: {
    primary: 'emerald',
    gray: 'neutral',
    button: {
      default: {
        size: 'md',
        color: 'primary',
        variant: 'solid'
      },
      rounded: 'rounded-xl',
      font: 'font-bold'
    },
    input: {
      default: {
        size: 'md'
      },
      rounded: 'rounded-xl',
      appearance: 'outline'
    },
    card: {
      rounded: 'rounded-3xl',
      shadow: 'shadow-sm',
      ring: 'ring-1 ring-neutral-200 dark:ring-neutral-800'
    }
  }
})
