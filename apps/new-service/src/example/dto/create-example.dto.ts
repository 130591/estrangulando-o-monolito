import { IsOptional, IsString, Length } from 'class-validator'

export class CreateExampleDto {
  @IsString()
  @Length(1, 80)
  name!: string

  @IsOptional()
  @IsString()
  @Length(0, 280)
  description?: string
}
