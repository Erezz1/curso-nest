import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { Product, ProductImage } from './entities';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ Product, ProductImage ]),
    AuthModule
  ],
  controllers: [ ProductsController ],
  providers: [ ProductsService ],
  exports: [ ProductsService ],
})
export class ProductsModule {}
