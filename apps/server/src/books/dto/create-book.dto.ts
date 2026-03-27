import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Difficulty, TrimSize, UniquenessLevel } from '@kdp/shared';

export class FrontMatterPageDto {
  @IsBoolean()
  enabled!: boolean;

  /** User-supplied element values: elementId → text content or upload key. */
  @IsOptional()
  @IsObject()
  values?: Record<string, string>;
}

export class FrontMatterDto {
  @ValidateNested()
  @Type(() => FrontMatterPageDto)
  titlePage!: FrontMatterPageDto;

  @ValidateNested()
  @Type(() => FrontMatterPageDto)
  copyrightPage!: FrontMatterPageDto;

  @ValidateNested()
  @Type(() => FrontMatterPageDto)
  howToPlay!: FrontMatterPageDto;

  @ValidateNested()
  @Type(() => FrontMatterPageDto)
  introduction!: FrontMatterPageDto;

  @IsBoolean()
  answerPages!: boolean;
}

export class CreateBookDto {
  @IsString()
  @MaxLength(120)
  title!: string;

  @IsEnum(TrimSize)
  trimSize!: TrimSize;

  @IsEnum(Difficulty)
  difficulty!: Difficulty;

  /** Number of puzzles. Min 10, max 300. */
  @IsInt()
  @Min(10)
  @Max(300)
  pageCount!: number;

  /** Puzzles per page: 1 (Large Print), 2 (Standard), or 4 (Compact). */
  @IsInt()
  @Min(1)
  @Max(4)
  layout!: number;

  @IsEnum(UniquenessLevel)
  uniquenessLevel!: UniquenessLevel;

  @ValidateNested()
  @Type(() => FrontMatterDto)
  frontMatter!: FrontMatterDto;
}
