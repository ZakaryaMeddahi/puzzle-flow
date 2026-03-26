import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Difficulty, TrimSize, UniquenessLevel } from '@kdp/shared';

export class FrontMatterDto {
  @IsBoolean()
  titlePage!: boolean;

  @IsBoolean()
  copyrightPage!: boolean;

  @IsBoolean()
  howToPlay!: boolean;

  @IsBoolean()
  introduction!: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(3000)
  introText?: string;

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
