import { Transform } from 'class-transformer'
import { IsEmail, IsNotIn, IsOptional, IsString, Length, Matches, MaxLength } from 'class-validator'

import { RESERVED_USERNAMES, USERNAME_PATTERN } from '../reserved-usernames'

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value)
const lower = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toLowerCase() : value

export class RegisterDto {
  @Transform(lower)
  @IsEmail({}, { message: 'e-mail invalido' })
  @MaxLength(255)
  email!: string

  // 72 e o teto do bcrypt: acima disso os bytes extras sao ignorados em
  // silencio, e uma senha "mais longa" nao seria mais forte.
  @IsString()
  @Length(8, 72, { message: 'a senha precisa de 8 a 72 caracteres' })
  password!: string

  @Transform(trim)
  @IsString()
  @Length(2, 80)
  name!: string

  @Transform(lower)
  @Matches(USERNAME_PATTERN, {
    message: 'use 3 a 40 caracteres: letras, numeros, hifen ou _',
  })
  @IsNotIn(RESERVED_USERNAMES, { message: 'esse username e reservado' })
  username!: string

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(280)
  bio?: string
}
