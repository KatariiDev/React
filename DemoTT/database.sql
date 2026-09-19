CREATE DATABASE ticket_shop;
GO

USE ticket_shop;
GO


CREATE TABLE orders (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,

    order_code VARCHAR(50) NOT NULL UNIQUE,

    ticket_type NVARCHAR(100) NOT NULL,

    amount BIGINT NOT NULL,

    payment_content NVARCHAR(255) NOT NULL,

    status VARCHAR(20) NOT NULL
        DEFAULT 'PENDING',

    created_at DATETIME2 NOT NULL
        DEFAULT GETDATE(),

    paid_at DATETIME2 NULL
);
GO


CREATE TABLE transactions (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,

    sepay_id BIGINT NOT NULL UNIQUE,

    order_code VARCHAR(50),

    amount BIGINT NOT NULL,

    content NVARCHAR(MAX),

    reference_code VARCHAR(255),

    transaction_date DATETIME2,

    created_at DATETIME2 NOT NULL
        DEFAULT GETDATE()
);
GO

SELECT
    order_code,
    ticket_type,
    amount,
    payment_content,
    status
FROM orders
ORDER BY id DESC;

SELECT payment_content FROM ORDERS WHERE payment_content = 'DH17888676302362C2B';

USE ticket_shop;

CREATE TABLE payment_config (
    id INT PRIMARY KEY,
    bank_id NVARCHAR(50) NOT NULL,
    account_number VARCHAR(50) NOT NULL,
    account_name NVARCHAR(255) NOT NULL,
    updated_at DATETIME2 DEFAULT GETDATE()
);

INSERT INTO payment_config
(
    id,
    bank_id,
    account_number,
    account_name
)
VALUES
(
    1,
    '',
    '',
    ''
);

SELECT TOP 10
    order_code,
    ticket_type,
    amount,
    payment_content,
    status,
    paid_at
FROM orders
ORDER BY id DESC;

--SELECT
--    bank_id,
--    account_number,
--    account_name
--FROM payment_config