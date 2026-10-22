import { expect, test } from 'vitest'
import { APP_NAME } from './app-name'

test('the app is called Fizzwick', () => {
  expect(APP_NAME).toBe('Fizzwick')
})
