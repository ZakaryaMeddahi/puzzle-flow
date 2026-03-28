import { IsOptional, IsString } from 'class-validator';

export class PreviewPageDto {
  @IsString()
  pageType!: string;

  @IsOptional()
  values?: Record<string, string>;

  @IsOptional()
  styles?: Record<string, { alignment: string }>;

  @IsOptional()
  @IsString()
  font?: string;

  @IsOptional()
  @IsString()
  trimSize?: string;
}
