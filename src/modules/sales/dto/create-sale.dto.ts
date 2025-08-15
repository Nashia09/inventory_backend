import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsMongoId, IsNotEmpty, IsNumber, IsPositive, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class ProductSoldItemDto {
  @ApiProperty()
  @IsMongoId()
  productId: string;

  @ApiProperty()
  @IsNotEmpty()
  productName: string;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  unitPrice: number;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  quantity: number;
}

export class CreateSaleDto {
  @ApiProperty({ type: [ProductSoldItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductSoldItemDto)
  productsSold: ProductSoldItemDto[];
}