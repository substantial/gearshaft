const { follow } = require('../follow')
const { Metadata } = require('../metadata')
const {
  exampleMessage,
  exampleRandomValue
} = require('../examples')

class SomeMessage {}
class SomeClassWithCreate {}
SomeClassWithCreate.create = (fields) => {
  const instance = new SomeClassWithCreate()
  instance.fields = fields
  return instance
}

describe('follow', () => {
  describe('metadata', () => {
    const previous = exampleMessage()
    const next = follow(previous, SomeMessage)

    it('next message metadata follows previous', () => {
      const expected = new Metadata()
      expected.follow(previous.metadata)
      expect(next.metadata).toEqual(expected)
    })
  })

  describe('message with simple top-level field', () => {
    const previous = exampleMessage()
    const next = follow(previous, SomeMessage)

    it('field is copied', () => {
      expect(next.someAttribute).toBe(previous.someAttribute)
    })

    it('id is not copied', () => {
      expect(next.id).toBe(null)
    })

    it('creates instance of desired type', () => {
      expect(next).toBeInstanceOf(SomeMessage)
    })
  })

  describe('message with nested field', () => {
    const previous = exampleMessage.nestedField()
    const next = follow(previous, SomeMessage)

    it('includes nested field', () => {
      expect(next.nested.netedField).toBe(previous.nested.netedField)
    })

    it('creates new parent object', () => {
      expect(next.nested).not.toBe(previous.nested)
    })
  })

  describe('message with array field', () => {
    const value = exampleRandomValue()
    const previous = exampleMessage()
    previous.some = {
      array: [{ value }],
      numArray: [1, 6, 12]
    }

    const next = follow(previous, SomeMessage)

    it('includes array field', () => {
      expect(next.some.array).toHaveLength(1)
      expect(next.some.array[0].value).toEqual(value)
    })

    it('creates new array object', () => {
      expect(next.some.array).not.toBe(previous.some.array)
    })

    it('includes number fields', () => {
      expect(next.some.numArray).toEqual(previous.some.numArray)
    })
  })

  describe('message class with create method', () => {
    const previous = exampleMessage()
    const next = follow(previous, SomeClassWithCreate)

    it('no fields are copied', () => {
      expect(next.someAttribute).toBeUndefined()
    })

    it('fields are supplied to create method', () => {
      expect(next.fields).toEqual(previous)
    })

    it('returns the created message instance', () => {
      expect(next).toBeInstanceOf(SomeClassWithCreate)
    })
  })

  describe('additional fields', () => {
    describe('message class has no create method', () => {
      it('includes additional field', () => {
        const previous = exampleMessage()
        const additional = exampleRandomValue()
        const next = follow(previous, SomeMessage, { additional })

        expect(next.additional).toEqual(additional)
      })
    })

    describe('message class has create method', () => {
      it('includes additional field', () => {
        const previous = exampleMessage()
        const additional = exampleRandomValue()
        const next = follow(previous, SomeClassWithCreate, { additional })

        expect(next.fields.additional).toEqual(additional)
      })
    })
  })

  describe('message with no metadata', () => {
    it('followed messages has new metadata ', () => {
      const previous = exampleMessage()
      delete previous.metadata
      const next = follow(previous, SomeMessage)

      expect(next.metadata).toBeDefined()
    })
  })
})
