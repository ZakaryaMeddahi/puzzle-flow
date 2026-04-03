import { IsEnum } from 'class-validator';
import { PlanType } from '@kdp/shared';

export class SubscribeDto {
  @IsEnum([PlanType.STARTER, PlanType.PRO], {
    message: 'plan must be starter or pro',
  })
  plan!: PlanType.STARTER | PlanType.PRO;
}
