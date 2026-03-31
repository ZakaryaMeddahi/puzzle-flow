import { IsEmail } from 'class-validator';

export class MagicLinkDto {
  @IsEmail()
  email!: string;
}
