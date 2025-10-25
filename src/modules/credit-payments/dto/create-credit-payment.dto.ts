import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, Min } from 'class-validator';

export class CreateCreditPaymentDto {
  @ApiProperty({ description: 'Payment amount', example: 100.5 })
  @IsNumber()
  @IsPositive()
  @Min(0.01)
  amount: number;

  @ApiProperty({ description: 'Payment date', required: false })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiProperty({ description: 'Optional note', required: false })
  @IsOptional()
  @IsString()
  note?: string;
}