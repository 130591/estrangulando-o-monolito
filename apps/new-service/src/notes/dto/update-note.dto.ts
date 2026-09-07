import { Transform } from 'class-transformer'
import { IsBoolean, IsIn, IsOptional, IsString, MaxLength } from 'class-validator'

import type { Visibility } from '../../common/types'

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value)

// Campo ausente e diferente de campo vazio: o service so toca no que veio.
export class UpdateNoteDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(2048)
  url?: string

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(200)
  title?: string

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(500)
  note?: string

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(40)
  tag?: string

  @IsOptional()
  @IsIn(['public', 'private'])
  visibility?: Visibility

  @IsOptional()
  @IsBoolean()
  archived?: boolean
}
