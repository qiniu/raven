import test from 'ava'
import { Storage, Store, CollectionStore } from './store'

test('storage', (t) => {
  const storage = new Storage()

  storage.setItem('foo', 'bar')

  t.is(storage.getItem('foo'), 'bar')
  
  storage.removeItem('foo')

  t.is(storage.getItem('foo'), undefined)
})
