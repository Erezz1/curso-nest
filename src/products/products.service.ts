import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { validate as isUUID } from 'uuid';

import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@Injectable()
export class ProductsService {

  private readonly logger = new Logger('ProductsService');

  constructor (
    @InjectRepository( Product )
    private readonly productsRepository: Repository<Product>
  ) {}

  async create( createProductDto: CreateProductDto ) {
    try {
      const product = this.productsRepository.create( createProductDto );
      await this.productsRepository.save( product );
      return product;

    } catch ( error ) {
      this.handleDBException( error );
    }
  }

  findAll( paginationDto: PaginationDto ) {
    const { limit = 10, offset = 0 } = paginationDto;
    return this.productsRepository.find({
      take: limit,
      skip: offset,
    });
  }

  async findOne( term: string ) {
    let product: Product;

    if ( isUUID( term ) ) {
      product = await this.productsRepository.findOneBy({ id: term });
    } else {
      product = await this.productsRepository.findOneBy({ slug: term });
    }

    if ( !product ) 
      throw new NotFoundException(`Product with term "${ term }" not found`);

    return product;
  }

  async update( id: string, updateProductDto: UpdateProductDto ) {
    const productUpdated = await this.productsRepository.preload({
      id,
      ...updateProductDto,
    });

    if ( !productUpdated )
      throw new NotFoundException(`Product with id "${ id }" not found`);

    try {
      await this.productsRepository.save( productUpdated );
      return productUpdated;

    } catch ( error ) {
      this.handleDBException( error );
    }
  }

  async remove( id: string ) {
    const productFound = await this.findOne( id );
    await this.productsRepository.remove( productFound );
  }

  private handleDBException( error: any ) {
    if ( error.code === '23505' )
      throw new BadRequestException( error.detail );

    this.logger.error( error.detail );
    console.log( error );
    throw new InternalServerErrorException('Unexpected error, check server logs');
  }
}
