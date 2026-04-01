const { z } = require('zod');

// Auth

const signupSchema = z.object({
  body: z.object({
    name:     z.string().min(2, 'Name must be at least 2 characters').max(100),
    email:    z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters').max(100),
    role:     z.enum(['admin', 'manager']).optional().default('manager'),
  }),
});

const loginSchema = z.object({
  body: z.object({
    email:    z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
});

// Category

const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Category name must be at least 2 characters').max(100),
  }),
});

// Product

const createProductSchema = z.object({
  body: z.object({
    name:          z.string().min(2, 'Product name must be at least 2 characters').max(255),
    description:   z.string().max(1000).optional().nullable(),
    category_id:   z.string().uuid('Invalid category ID'),
    price:         z.number({ invalid_type_error: 'Price must be a number' }).min(0, 'Price cannot be negative'),
    stock:         z.number({ invalid_type_error: 'Stock must be a number' }).int().min(0, 'Stock cannot be negative'),
    min_threshold: z.number({ invalid_type_error: 'Min threshold must be a number' }).int().min(0),
  }),
});

const updateProductSchema = createProductSchema;

const restockProductSchema = z.object({
  body: z.object({
    add_quantity: z.number({ invalid_type_error: 'Quantity must be a number' }).int().min(1, 'Must add at least 1 unit'),
  }),
});

// Order

const createOrderSchema = z.object({
  body: z.object({
    customer_name: z.string().min(2, 'Customer name must be at least 2 characters').max(255),
    items: z
      .array(
        z.object({
          product_id: z.string().uuid('Invalid product ID'),
          quantity:   z.number({ invalid_type_error: 'Quantity must be a number' }).int().min(1, 'Quantity must be at least 1'),
        })
      )
      .min(1, 'Order must have at least one item.'),
    notes: z.string().max(500).optional().nullable(),
  }),
});

const updateOrderStatusSchema = z.object({
  body: z.object({
    status: z.enum(['confirmed', 'shipped', 'delivered', 'cancelled'], {
      errorMap: () => ({ message: 'Invalid status. Must be: confirmed, shipped, delivered, or cancelled.' }),
    }),
  }),
});

// Restock

const resolveRestockSchema = z.object({
  body: z.object({
    add_quantity: z.number({ invalid_type_error: 'Quantity must be a number' }).int().min(1, 'Must add at least 1 unit'),
  }),
});

module.exports = {
  signupSchema,
  loginSchema,
  createCategorySchema,
  createProductSchema,
  updateProductSchema,
  restockProductSchema,
  createOrderSchema,
  updateOrderStatusSchema,
  resolveRestockSchema,
};
