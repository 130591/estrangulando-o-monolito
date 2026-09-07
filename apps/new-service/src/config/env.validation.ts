import { plainToInstance, Type } from 'class-transformer'
import { IsEnum, IsInt, IsString, Max, Min, MinLength, validateSync } from 'class-validator'

export enum NodeEnv {
  Development = 'development',
  Test = 'test',
  Production = 'production',
}

export enum LogLevel {
  Trace = 'trace',
  Debug = 'debug',
  Info = 'info',
  Warn = 'warn',
  Error = 'error',
}

export class EnvironmentVariables {
  @IsEnum(NodeEnv)
  NODE_ENV!: NodeEnv

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65535)
  PORT!: number

  @IsString()
  ROUTE_PREFIX!: string

  @IsString()
  SERVICE_NAME!: string

  @IsEnum(LogLevel)
  LOG_LEVEL!: LogLevel

  @IsString()
  DB_HOST!: string

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65535)
  DB_PORT!: number

  @IsString()
  DB_NAME!: string

  @IsString()
  DB_USER!: string

  @IsString()
  DB_PASSWORD!: string

  // Sem default: segredo com valor de fabrica e pior que nenhum. E o mesmo do
  // legacy-api de proposito.
  @IsString()
  @MinLength(16)
  JWT_SECRET!: string

  @IsString()
  JWT_EXPIRES_IN!: string
}

// Defaults antes do plainToInstance: nao depender de como o class-transformer
// trata property initializers. JWT_SECRET fica de fora - sem ele o boot cai.
const DEFAULTS: Partial<Record<keyof EnvironmentVariables, string>> = {
  NODE_ENV: NodeEnv.Development,
  PORT: '8080',
  ROUTE_PREFIX: 'api',
  SERVICE_NAME: 'new-service',
  LOG_LEVEL: LogLevel.Info,
  DB_HOST: 'mysql',
  DB_PORT: '3306',
  DB_NAME: 'app',
  DB_USER: 'app',
  DB_PASSWORD: 'app',
  JWT_EXPIRES_IN: '7d',
}

export function validateEnv(raw: Record<string, unknown>): EnvironmentVariables {
  const merged: Record<string, unknown> = { ...DEFAULTS }
  for (const [key, value] of Object.entries(raw)) {
    if (value !== undefined && value !== '') merged[key] = value
  }

  const config = plainToInstance(EnvironmentVariables, merged, {
    enableImplicitConversion: true,
  })

  const errors = validateSync(config, { skipMissingProperties: false })

  if (errors.length > 0) {
    const details = errors
      .map((e) => `${e.property}: ${Object.values(e.constraints ?? {}).join(', ')}`)
      .join('; ')
    throw new Error(`Configuracao invalida -> ${details}`)
  }

  return config
}
