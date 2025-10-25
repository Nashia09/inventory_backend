import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, Min } from 'class-validator';
import { StockMovementType } from '../schemas/stock-movement.schema';

export class CreateStockMovementDto {
  @ApiProperty({ enum: StockMovementType })
  @IsEnum(StockMovementType)
  type: StockMovementType;

  @ApiProperty({ description: 'Quantity moved (for in/out)', required: false })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  quantity?: number;

  @ApiProperty({ description: 'Absolute new quantity (for adjustment)', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  newQuantity?: number;

  @ApiProperty({ description: 'Reason for movement', required: false })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiProperty({ description: 'Reference type', required: false, example: 'sale' })
  @IsOptional()
  @IsString()
  referenceType?: string;

  @ApiProperty({ description: 'Reference ID', required: false })
  @IsOptional()
  @IsString()
  referenceId?: string;

  @ApiProperty({ description: 'Optional note', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}