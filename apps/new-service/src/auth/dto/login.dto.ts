import { Transform } from 'class-transformer'
import { IsEmail, IsString, MaxLength } from 'class-validator'

export class LoginDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail({}, { message: 'e-mail invalido' })
  @MaxLength(255)
  email!: string

  // Sem regra de tamanho no login: senha antiga nao pode virar 400.
  @IsString()
  @MaxLength(200)
  password!: string
}
