business
  id                bigint PK
  name              varchar(200) NOT NULL
  status            varchar(20) DEFAULT 'ACTIVE'
                    CHECK IN ('ACTIVE', 'INACTIVE')
  created_at        timestamptz DEFAULT now()
  updated_at        timestamptz DEFAULT now()


branch
  id                bigint PK
  business_id       bigint FK -> business(id)
  name              varchar(200) NOT NULL
  address           text NULL
  phone             varchar(50) NULL
  status            varchar(20) DEFAULT 'ACTIVE'
                    CHECK IN ('ACTIVE', 'INACTIVE')
  created_at        timestamptz DEFAULT now()
  updated_at        timestamptz DEFAULT now()

  UNIQUE (business_id, id)


app_user
  id                bigint PK
  clerk_id          varchar(255) UNIQUE NULL
  business_id       bigint FK -> business(id)
  name              varchar(200) NOT NULL
  email             varchar(255) NULL
  role              varchar(50) DEFAULT 'EMPLOYEE'
  status            varchar(20) DEFAULT 'ACTIVE'
                    CHECK IN ('ACTIVE', 'INACTIVE')
  created_at        timestamptz DEFAULT now()
  updated_at        timestamptz DEFAULT now()

  UNIQUE (business_id, id)


user_branch
  user_id           bigint FK -> app_user(id)
                    ON DELETE CASCADE
  branch_id         bigint FK -> branch(id)
                    ON DELETE CASCADE

  PK (user_id, branch_id)

  -- Define a qué sucursales puede acceder un usuario.


customer
  id                bigint PK
  business_id       bigint FK -> business(id)
  name              varchar(200) NULL
  phone             varchar(50) NULL
  email             varchar(255) NULL
  status            varchar(20) DEFAULT 'ACTIVE'
                    CHECK IN ('ACTIVE', 'INACTIVE')
  created_at        timestamptz DEFAULT now()
  updated_at        timestamptz DEFAULT now()

  UNIQUE (business_id, id)

  product_category
  id                bigint PK
  business_id       bigint FK -> business(id)
  name              varchar(200) NOT NULL
  description       text NULL
  status            varchar(20) DEFAULT 'ACTIVE'
                    CHECK IN ('ACTIVE', 'INACTIVE')
  created_at        timestamptz DEFAULT now()
  updated_at        timestamptz DEFAULT now()

  UNIQUE (business_id, id)


product
  id                bigint PK
  business_id       bigint FK -> business(id)
  category_id       bigint NULL
  name              varchar(255) NOT NULL
  description       text NULL
  sku               varchar(100) NULL
  unit              varchar(30) DEFAULT 'unit'
  status            varchar(20) DEFAULT 'ACTIVE'
                    CHECK IN ('ACTIVE', 'INACTIVE')
  cost_price        numeric(14,4) NULL CHECK >= 0
  sale_price        numeric(14,4) NULL CHECK >= 0
  created_at        timestamptz DEFAULT now()
  updated_at        timestamptz DEFAULT now()

  FK (business_id, category_id)
    -> product_category(business_id, id)

  UNIQUE (business_id, id)
  UNIQUE (business_id, sku)

  -- Los productos pertenecen al negocio.
  -- Todas las sucursales comparten su catálogo.


product_stock
  id                bigint PK
  business_id       bigint FK -> business(id)
  branch_id         bigint NOT NULL
  product_id        bigint NOT NULL
  quantity          numeric(14,3) DEFAULT 0 CHECK >= 0
  minimum_quantity  numeric(14,3) DEFAULT 0 CHECK >= 0
  updated_at        timestamptz DEFAULT now()

  FK (business_id, branch_id)
    -> branch(business_id, id)

  FK (business_id, product_id)
    -> product(business_id, id)

  UNIQUE (business_id, branch_id, product_id)

  -- Stock independiente por producto y sucursal.


stock_movement
  id                  bigint PK
  business_id         bigint FK -> business(id)
  branch_id           bigint NOT NULL
  product_id          bigint NOT NULL
  type                varchar(15) NOT NULL
                      CHECK IN (
                        'IN',
                        'OUT',
                        'ADJUSTMENT'
                      )
  quantity            numeric(14,3) NOT NULL CHECK > 0
  previous_quantity   numeric(14,3) NOT NULL CHECK >= 0
  new_quantity        numeric(14,3) NOT NULL CHECK >= 0
  reason              varchar(30) NOT NULL
                      CHECK IN (
                        'PURCHASE',
                        'SALE',
                        'INTERNAL_USE',
                        'LOSS',
                        'DAMAGE',
                        'RETURN',
                        'MANUAL_ADJUSTMENT',
                        'OTHER'
                      )
  notes               text NULL
  unit_price          numeric(14,4) NULL CHECK >= 0
  created_by_user_id  bigint NULL
  created_at          timestamptz DEFAULT now()

  FK (business_id, branch_id)
    -> branch(business_id, id)

  FK (business_id, product_id)
    -> product(business_id, id)

  FK (business_id, created_by_user_id)
    -> app_user(business_id, id)

  -- Historial de entradas, salidas y ajustes de stock.

sale
  id                bigint PK
  business_id       bigint FK -> business(id)
  branch_id         bigint NOT NULL
  customer_id       bigint NULL
  status            varchar(20) DEFAULT 'OPEN'
                    CHECK IN (
                      'OPEN',
                      'COMPLETED',
                      'CANCELLED'
                    )
  subtotal          numeric(14,2) DEFAULT 0 CHECK >= 0
  discount_amount   numeric(14,2) DEFAULT 0 CHECK >= 0
  total_amount      numeric(14,2) DEFAULT 0 CHECK >= 0
  notes             text NULL
  created_by        bigint NULL
  created_at        timestamptz DEFAULT now()
  updated_at        timestamptz DEFAULT now()

  FK (business_id, branch_id)
    -> branch(business_id, id)

  FK (business_id, customer_id)
    -> customer(business_id, id)

  FK (business_id, created_by)
    -> app_user(business_id, id)

  UNIQUE (business_id, id)

  -- Cabecera de la venta.
  -- Una venta pertenece a una sucursal.
  -- El cliente es opcional.


sale_item
  id                bigint PK
  sale_id           bigint FK -> sale(id)
  product_id        bigint FK -> product(id)
  quantity          numeric(14,3) NOT NULL CHECK > 0
  unit_price        numeric(14,4) NOT NULL CHECK >= 0
  subtotal          numeric(14,2) NOT NULL CHECK >= 0
  created_at        timestamptz DEFAULT now()

  -- Detalle de productos vendidos.
  -- Una venta puede tener múltiples productos.


payment
  id                bigint PK
  sale_id           bigint FK -> sale(id)
  amount            numeric(14,2) NOT NULL CHECK >= 0
  status            varchar(30) DEFAULT 'PENDING'
                    CHECK IN (
                      'PENDING',
                      'COMPLETED',
                      'FAILED',
                      'CANCELLED',
                      'REFUNDED'
                    )
  created_at        timestamptz DEFAULT now()
  updated_at        timestamptz DEFAULT now()

  -- Una venta puede tener múltiples pagos.