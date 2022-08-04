import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { Product, ProductImage } from './entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([ Product, ProductImage ]),
  ],
  controllers: [ ProductsController ],
  providers: [ ProductsService ],
  exports: [ ProductsService ],
})
export class ProductsModule {}
