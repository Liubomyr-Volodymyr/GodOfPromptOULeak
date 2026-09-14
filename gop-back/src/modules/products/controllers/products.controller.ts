import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { ProductsService } from '../services/products.service';
import { Products } from '../../user-products/entities/products.entity';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { ListProductsDto } from '../dto/list-products.dto';
import { ProductDetailsDto } from '../dto/product-details.dto';
import { ProductsListDto } from '../dto/products-list.dto';
import { AdminJwtGuard } from '../../../admin/modules/auth/guards/admin-jwt.guard';
import { RolesGuard } from '../../../admin/modules/auth/guards/roles.guard';
import { AdminRole, Roles } from '../../../admin/common/decorators/roles.decorator';

@SkipThrottle()
@ApiTags('Products')
@Controller('products')
export class ProductsController {
	constructor(private readonly productsService: ProductsService) {}

	@Get()
	@ApiOperation({ summary: 'List products with filters, search, sort and pagination' })
	@ApiResponse({ status: 200, description: 'Paginated products with meta', type: ProductsListDto })
	list(@Query() query: ListProductsDto): Promise<ProductsListDto> {
		return this.productsService.list(query);
	}

	@Get('slug/:slug')
	@ApiOperation({ summary: 'Get a single product by slug with its prices and HTML body' })
	@ApiParam({ name: 'slug' })
	@ApiResponse({ status: 200, description: 'Product with prices', type: ProductDetailsDto })
	@ApiResponse({ status: 404, description: 'Product not found' })
	findBySlug(@Param('slug') slug: string): Promise<ProductDetailsDto> {
		return this.productsService.findBySlug(slug);
	}

	@Get(':id')
	@ApiOperation({ summary: 'Get a single product with its prices' })
	@ApiParam({ name: 'id', format: 'uuid' })
	@ApiResponse({ status: 200, description: 'Product with prices', type: ProductDetailsDto })
	@ApiResponse({ status: 404, description: 'Product not found' })
	findOne(@Param('id', ParseUUIDPipe) id: string): Promise<ProductDetailsDto> {
		return this.productsService.findOne(id);
	}

	@Post()
	@ApiBearerAuth('access_token')
	@ApiOperation({ summary: 'Create a product (admin); registers existing Stripe price ids' })
	@ApiResponse({ status: 201, description: 'Created product with prices', type: ProductDetailsDto })
	@ApiResponse({ status: 409, description: 'Slug already exists' })
	@Roles(AdminRole.Admin, AdminRole.SuperAdmin)
	@UseGuards(AdminJwtGuard, RolesGuard)
	create(@Body() createProductDto: CreateProductDto): Promise<ProductDetailsDto> {
		return this.productsService.create(createProductDto);
	}

	@Patch(':id')
	@ApiBearerAuth('access_token')
	@ApiOperation({ summary: 'Update a product (admin); prices are managed separately' })
	@ApiParam({ name: 'id', format: 'uuid' })
	@ApiResponse({ status: 200, description: 'Updated product with prices', type: ProductDetailsDto })
	@ApiResponse({ status: 404, description: 'Product not found' })
	@ApiResponse({ status: 409, description: 'Slug already exists' })
	@Roles(AdminRole.Admin, AdminRole.SuperAdmin)
	@UseGuards(AdminJwtGuard, RolesGuard)
	update(@Param('id', ParseUUIDPipe) id: string, @Body() updateProductDto: UpdateProductDto): Promise<ProductDetailsDto> {
		return this.productsService.update(id, updateProductDto);
	}

	@Delete(':id')
	@ApiBearerAuth('access_token')
	@ApiOperation({ summary: 'Archive a product (admin soft-delete: status=archived)' })
	@ApiParam({ name: 'id', format: 'uuid' })
	@ApiResponse({ status: 200, description: 'Archived product', type: Products })
	@ApiResponse({ status: 404, description: 'Product not found' })
	@Roles(AdminRole.Admin, AdminRole.SuperAdmin)
	@UseGuards(AdminJwtGuard, RolesGuard)
	remove(@Param('id', ParseUUIDPipe) id: string): Promise<Products> {
		return this.productsService.softDelete(id);
	}
}
