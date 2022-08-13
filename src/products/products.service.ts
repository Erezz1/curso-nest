import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { validate as isUUID } from 'uuid';

import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product, ProductImage } from './entities';
import { PaginationDto } from '../common/dto/pagination.dto';
import { User } from '../auth/entities/user.entity';

@Injectable()
export class ProductsService {

  private readonly logger = new Logger('ProductsService');

  constructor (
    @InjectRepository( Product )
    private readonly productsRepository: Repository<Product>,

    @InjectRepository( ProductImage )
    private readonly productImageRepository: Repository<ProductImage>,

    private readonly dataSource: DataSource
  ) {}

  async create( createProductDto: CreateProductDto, user: User ) {
    const { images = [], ...productDetails } = createProductDto;

    try {
      const product = this.productsRepository.create({
        ...productDetails,
        images: images.map(
          image => this.productImageRepository.create({ url: image })
        ),
        user
      });

      await this.productsRepository.save( product );

      return { ...product, images };

    } catch ( error ) {
      this.handleDBException( error );
    }
  }

  async findAll( paginationDto: PaginationDto ) {
    const { limit = 10, offset = 0 } = paginationDto;

    const products = await this.productsRepository.find({
      take: limit,
      skip: offset,
      relations: { images: true }
    });

    return products.map(
      ({ images, ...rest }) => (
        { ...rest, images: images.map( image => image.url ) }
      )
    );
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

  async findOnePlain( term: string ) {
    const { images = [], ...rest } = await this.findOne( term );
    return {
      ...rest,
      images: images.map( image => image.url )
    }
  }

  async update( id: string, updateProductDto: UpdateProductDto, user: User ) {

    const { images, ...toUpdate } = updateProductDto;

    const productUpdated = await this.productsRepository.preload({ id, ...toUpdate });

    if ( !productUpdated )
      throw new NotFoundException(`Product with id "${ id }" not found`);

    // Create query runner
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if ( images ) {
        await queryRunner
          .manager
          .delete(
            ProductImage,
            { product: { id } }
          );

        productUpdated.images = images.map(
          image => this.productImageRepository.create({ url: image })
        )
      }

      productUpdated.user = user;

      await queryRunner.manager.save( productUpdated );
      await queryRunner.commitTransaction();

      await queryRunner.release();

      await this.productsRepository.save( productUpdated );
      return this.findOnePlain( id );

    } catch ( error ) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();

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

  async deleteAllProducts() {
    const query = this.productsRepository.createQueryBuilder('product');

    try {
      await query
        .delete()
        .where({})
        .execute();

    } catch ( error ) {
      this.handleDBException( error );
    }
  }
}
