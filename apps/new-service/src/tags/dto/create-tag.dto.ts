import { IsString, Length } from 'class-validator'
import { Transform } from 'class-transformer'

export class CreateTagDto {
  @Transform(({ value }: { value: unknown }) => String(value ?? '').trim())
  @IsString()
  @Length(1, 40)
  name!: string
}
