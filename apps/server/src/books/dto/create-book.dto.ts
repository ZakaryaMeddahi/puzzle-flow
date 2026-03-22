import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Difficulty, TrimSize, UniquenessLevel } from '@kdp/shared';

export class CreateBookDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsEnum(TrimSize)
  trimSize!: TrimSize;

  @IsEnum(Difficulty)
  difficulty!: Difficulty;

  /** Number of puzzles (= number of interior pages). Min 10, max 200. */
  @IsInt()
  @Min(10)
  @Max(200)
  pageCount!: number;

  @IsEnum(UniquenessLevel)
  uniquenessLevel!: UniquenessLevel;
}
