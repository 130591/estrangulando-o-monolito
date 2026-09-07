import { Transform } from 'class-transformer'
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator'

// Conversao explicita para nao depender de como o enableImplicitConversion
// trata '1' e 'false'.
const toBool = ({ value }: { value: unknown }) => value === true || value === '1' || value === 'true'
const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value)

export class ListNotesQuery {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(80)
  q?: string

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(40)
  tag?: string

  @IsOptional()
  @Transform(toBool)
  @IsBoolean()
  archived?: boolean
}
