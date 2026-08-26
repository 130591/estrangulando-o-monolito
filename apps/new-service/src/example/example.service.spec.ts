import { NotFoundException } from '@nestjs/common'

import { ExampleService } from './example.service'

describe('ExampleService', () => {
  let service: ExampleService

  beforeEach(() => {
    service = new ExampleService()
  })

  it('lista os items de exemplo', () => {
    expect(service.findAll()).toHaveLength(2)
  })

  it('encontra um item por id', () => {
    expect(service.findOne('1').name).toBe('example-one')
  })

  it('lanca 404 para id inexistente', () => {
    expect(() => service.findOne('999')).toThrow(NotFoundException)
  })

  it('cria um item novo', () => {
    const created = service.create({ name: 'example-three' })
    expect(created.id).toEqual(expect.any(String))
    expect(service.findAll()).toHaveLength(3)
  })
})
