import express from 'express'
import sql from 'mssql'
import dotenv, { config } from 'dotenv'
import crypto from 'crypto'
import path from 'path'
import { fileURLToPath } from 'url'

dotenv.config();

const app = express()
const PORT = 3000;

// CAU HINH DUONG DAN
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CAU HINH EXPRESS
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// KET NOI SQL SERVER
const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    port: 1433,
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

// DANH SACH TICKETS
const tickets = {
    'VE THUONG': 1000,
    'VE VUA': 2000,
    'VE VIP': 3000
}

// API TAO DON HANG
app.post('/api/orders', async (req, res) => {
    try {
        // LAY LOAI VE
        const {ticketType} = req.body;

        // KIEM TRA VE
        if (!ticketType || !tickets[ticketType]) {
            return res.status(400).json({
                success: false,
                message: 'Invalid Ticket'
            })
        }

        // LAY GIA VE
        const amount = tickets[ticketType];

        // TAO MA DON HANG
        const orderCode = 'DH' + Date.now() + crypto.randomBytes(2).toString('hex').toUpperCase();

        // NOI DUNG CHUYEN KHOAN
        const paymentContent = orderCode;

        // KET NOI SQL SERVER
        const pool = await sql.connect(dbConfig);

        // THEM DON HANG VAO DB
        await pool.request()
        .input('orderCode', sql.VarChar(50), orderCode)
        .input('ticketType', sql.NVarChar(100), ticketType)
        .input('amount', sql.BigInt, amount)
        .input('paymentContent', sql.NVarChar(225), paymentContent)
        .query(`
            INSERT INTO orders
            (
                order_code,
                ticket_type,
                amount, 
                payment_content
            )

            VALUES
            (
                @orderCode,
                @ticketType,
                @amount,
                @paymentContent
            )
        `);

        // TAO LINK QR
        const qrUrl = `https://img.vietqr.io/image/${process.env.BANK_ID}-${process.env.ACCOUNT_ID}-compact.png?amount=${amount}&addInfo=${encodeURIComponent(paymentContent)}&accountName=${encodeURIComponent(process.env.ACCOUNT_NAME)}`;
        res.json({
            success: true,
            orderCode: orderCode,
            ticketType: ticketType,
            amount: amount,
            qrUrl: qrUrl,
            status: 'PENDING'
        })
    } catch (e) {
        console.log('Error while create order: ', e);
        res.status(500).json({
            success: false,
            message: 'Server error'
        })
    }
});

// API KIEM TRA STATE ORDER
app.get('/api/orders/:orderCode/status', async (req, res) => {
    try {
        const { orderCode } = req.params;

        const pool = await sql.connect(dbConfig);

        const result = await pool
            .request()
            .input('orderCode', sql.VarChar(50), orderCode)
            .query(`
                SELECT
                    order_code,
                    ticket_type,
                    amount,
                    status
                FROM orders
                WHERE order_code = @orderCode
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        const order = result.recordset[0];

        res.json({
            success: true,
            order: order
        });

    } catch (e) {
        console.error('Error while checking order:', e);

        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// WEBHOOK SEPAY
app.post('/webhook/sepay', async (req, res) => {
    try {
        console.log('===== SEPAY WEBHOOK =====');
        console.log('Headers:', req.headers);
        console.log('Body:', req.body);

        const secret = req.headers.authorization;

        if (secret !== `Apikey ${process.env.SEPAY_API_KEY}`) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        console.log('API KEY OK');  

        const transaction = req.body;

        console.log('SePay gửi:', transaction);

        // CHỈ XỬ LÝ TIỀN VÀO
        if (transaction.transferType !== 'in') {
            return res.json({
                success: true
            });
        }

        const sepayId = transaction.id;
        const amount = Number(transaction.transferAmount);
        const content = transaction.content || '';
        const referenceCode = transaction.referenceCode || null;
        const transactionDate = transaction.transactionDate || null;
        const pool = await sql.connect(dbConfig);
        const orderResult = await pool
        .request()
        .input(
            'content',
            sql.NVarChar(255),
            content
        )
        .query(`
            SELECT TOP 1 *
            FROM orders
            WHERE status = 'PENDING'
            AND @content LIKE
                '%' + payment_content + '%'
        `); 

        console.log('Content nhận được:', content);
        console.log('Số tiền nhận được:', amount);
        console.log('Order tìm được:', orderResult.recordset);

        if (
            orderResult.recordset.length === 0
        ) {

            console.log(
                'Không tìm thấy đơn:',
                content
            );

            return res.json({

                success: true

            });
        }

        // Lấy đơn hàng
        const order = orderResult.recordset[0];
    
        if (amount !== Number(order.amount)) {
            console.log(
                'Invalid money: ',
                amount,
                'Need: ',
                order.amount
            );
            return res.json({
                success: true
            });
        }

        try {
            await pool
            .request()
            .input(
                'sepayId', sql.BigInt, sepayId
            )
            .input(
                'orderCode', sql.VarChar(50), order.order_code
            )
            .input(
                'amount', sql.BigInt, amount
            )
            .input(
                'content', sql.NVarChar(sql.MAX), content
            )
            .input(
                'referenceCode', sql.VarChar(255), referenceCode
            )
            .input(
                'transactionDate', sql.DateTime2, transactionDate
            )
            .query(`
                INSERT INTO transactions
                (
                    sepay_id,
                    order_code,
                    amount,
                    content,
                    reference_code,
                    transaction_date
                )
                VALUES
                (
                    @sepayId,
                    @orderCode,
                    @amount,
                    @content,
                    @referenceCode,
                    @transactionDate
                )
            `);


        } catch (error) {
            // Nếu giao dịch đã tồn tại
            if (error.number === 2627) {
                console.log(
                    'Order exist: ', sepayId
                );
                return res.json({
                    success: true
                });
            }
            throw error;
        }

        // CAP NHAT DON HANG
        await pool
        .request()
        .input(
            'orderCode', sql.VarChar(50), order.order_code
        )
        .query(`
            UPDATE orders

            SET
                status = 'PAID',
                paid_at = GETDATE()

            WHERE
                order_code = @orderCode

                AND status = 'PENDING'
        `);


        console.log(
            `Đơn ${order.order_code} đã thanh toán`
        );

        // Báo cho SePay biết webhook thành công
        res.json({
            success: true
        });


    } catch (error) {

        console.error(
            'Webhook error:',
            error
        );

        res.status(500).json({

            success: false

        });

    }

});

// CHAY SERVER
app.listen(PORT, () => {
    console.log(
        `Server đang chạy tại http://localhost:${PORT}`
    );
})