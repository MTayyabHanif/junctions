const assert = require('assert')

const { routesEqual, createJunction } = require('../lib')
const Serializers = require('./fixtures/Serializers')


describe('routesEqual', function() {
  it("returns false when types don't match", function() {
    const a = createJunction({ details: true }).createRoute('details')
    const b = { details: a }

    assert(!routesEqual(a, b))
  })

  it("returns false when branches don't match", function() {
    const junction = createJunction({ x: true, y: true })

    const a = junction.createRoute('x')
    const b = junction.createRoute('y')

    assert(!routesEqual(a, b))
  })

  it("returns false when params don't match", function() {
    const junction = createJunction({
      x: {
        paramTypes: {
          hasTax: { serializer: Serializers.flag },
        }
      }
    })

    const a = junction.createRoute('x', { hasTax: true })
    const b = junction.createRoute('x', { hasTax: false })
      
    assert(!routesEqual(a, b))
  })

  it("returns false when children don't match", function() {
    const childJunction = createJunction({
      details: {
        paramTypes: {
          slug: {}
        }
      }
    })
    const topJunction = createJunction({
      x: {
        children: {
          y: childJunction,
        }
      }
    })

    const a = topJunction.createRoute('x', {}, {
      y: childJunction.createRoute('details', { slug: 'a' })
    })
    const b = topJunction.createRoute('x', {}, {
      y: childJunction.createRoute('details', { slug: 'b' })
    })

    assert(!routesEqual(a, b))
  })

  it('returns true for when branch, params and children match', function() {
    const inner1 = createJunction({
      test1: {
        paramTypes: {
          slug: {}
        }
      }
    })
    const inner2 = createJunction({
      test2: {
        paramTypes: {
          amount: {
            serializer: Serializers.number,
          },
          hasTax: {
            serializer: Serializers.flag
          },
        },
        children: {
          inner1: inner1,
        }
      }
    })
    const outer = createJunction({
      test3: {
        paramTypes: {
          test: {}
        },
        children: {
          inner1: inner1,
          inner2: inner2,
        }
      }
    })

    const createTestRoute = () =>
      outer.createRoute('test3', { test: 'test' }, {
        inner1: inner1.createRoute('test1', { slug: 'abcd' }),
        inner2: inner2.createRoute('test2', { amount: 5, hasTax: true }, {
          inner1: inner1.createRoute('test1', { slug: 'efgh' }),
        })
      })

    assert(routesEqual(createTestRoute(), createTestRoute()))
  })
})
