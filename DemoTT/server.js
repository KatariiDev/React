import express from 'express'
import sql from 'mssql'
import dotenv, { config } from 'dotenv'
import crypto from 'crypto'
import path from 'path'
import { fileURLToPath } from 'url'
import { stringify } from 'querystring'

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

async function getSepayBankAccounts() {
    const token = process.env.SEPAY_API_TOKEN?.trim();

    if (!token) {
        throw new Error('Thieu SEPAY_API_TOKEN');
    }

    const response = await fetch(
        'https://userapi.sepay.vn/v2/bank-accounts',
        {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        }
        
    );

    const data = await response.json();
    console.log('jnjnj' + JSON.stringify(data))

    if (!response.ok) {
        throw new Error(
            `SePay API error ${response.status}: ${JSON.stringify(data)}`
        );
    }

    if (!data.data || !Array.isArray(data.data)) {
        throw new Error(
            'SePay khong tra ve danh sach tai khoan hop le'
        );
    }

    return data.data;
}

function normalizeText(text) {
    return String(text || '')
        .trim()
        .replace(/\s+/g, ' ')
        .toUpperCase();
}


async function getSepayBankAccount() {
    const pool = await sql.connect(dbConfig);

    const result = await pool
        .request()
        .input('id', sql.Int, 1)
        .query(`
            SELECT
                bank_id,
                account_number,
                account_name
            FROM payment_config
            WHERE id = @id
        `);

    if (result.recordset.length === 0) {
        throw new Error(
            'Chua co cau hinh tai khoan thanh toan'
        );
    }

    const account = result.recordset[0];

    if (
        !account.account_number ||
        !account.bank_id ||
        !account.account_name
    ) {
        throw new Error(
            'Chua xac nhan tai khoan thanh toan'
        );
    }

    return {
        bankId: account.bank_id,
        accountId: account.account_number,
        accountName: account.account_name
    };
}

app.post('/api/admin/payment-account', async (req, res) => {
    try {
        const {
            accountNumber,
            bankName,
            accountName
        } = req.body;

        // KIEM TRA DU LIEU NHAP
        if (
            !accountNumber ||
            !bankName ||
            !accountName
        ) {
            return res.status(400).json({
                success: false,
                message:
                    'Vui long nhap day du so tai khoan, ngan hang va ten chu tai khoan'
            });
        }

        // LAY DANH SACH TAI KHOAN SEPAY
        const bankList =
            await getSepayBankAccounts();


        // CHUAN HOA DU LIEU NHAP
        const inputAccountNumber =
            String(accountNumber).trim();

        const inputBankName =
            normalizeText(bankName);

        const inputAccountName =
            normalizeText(accountName);

        // Tim tai khoan
        const account = bankList.find(item => {

            const sepayAccountNumber =
                String(item.account_number || '').trim();

            const sepayBankShortName =
                normalizeText(item.bank_short_name);

            const sepayBankCode =
                normalizeText(item.bank_code);

            const sepayBankFullName =
                normalizeText(item.bank_full_name);

            const sepayAccountName =
                normalizeText(item.account_holder_name);

            const bankMatched =
                inputBankName === sepayBankShortName ||
                inputBankName === sepayBankCode ||
                inputBankName === sepayBankFullName;

            const accountMatched =
                inputAccountNumber ===
                sepayAccountNumber;

            const nameMatched =
                inputAccountName ===
                sepayAccountName;

            return (
                accountMatched &&
                bankMatched &&
                nameMatched
            );
        });

        if (!account) {
            return res.status(400).json({
                success: false,
                message:
                    'Tai khoan khong ton tai trong danh sach tai khoan SePay hoac thong tin khong khop'
            });
        }

        

        const pool =
            await sql.connect(dbConfig);

        const updateResult = await pool
        .request()
        .input('id', sql.Int, 1)
        .input(
            'bankId',
            sql.NVarChar(50),
            account.bank_short_name
        )
        .input(
            'accountNumber',
            sql.VarChar(50),
            account.account_number
        )
        .input(
            'accountName',
            sql.NVarChar(255),
            account.account_holder_name
        )
        .query(`
            UPDATE payment_config
            SET
                bank_id = @bankId,
                account_number = @accountNumber,
                account_name = @accountName,
                updated_at = GETDATE()
            WHERE id = @id
        `);

        if (updateResult.rowsAffected[0] === 0) {
            throw new Error(
                'Khong tim thay dong payment_config co id = 1'
            );
        }

        console.log(
            '======================================'
        );

        console.log(
            'DA XAC NHAN TAI KHOAN THANH TOAN'
        );

        console.log({
            bankId: account.bank_short_name,
            accountNumber: account.account_number,
            accountName: account.account_holder_name
        });

        console.log(
            '======================================'
        );

        return res.json({
            success: true,
            message:
                'Xac nhan tai khoan thanh cong',
            data: {
                bankId: account.bank_short_name,
                accountNumber: account.account_number,
                accountName: account.account_holder_name
            }
        });

    } catch (error) {
        console.error(
            'Payment account error:',
            error
        );

        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

app.get('/api/payment-methods', async (req, res) => {
    try {
        const bankList =
            await getSepayBankAccounts();
            console.log('log1' + typeof(bankList))


        const methods = bankList.map(account => ({
            id: account.id,
            bankName: account.bank_short_name,
            bankCode: account.bank_code,
            accountNumber: account.account_number,
            accountHolder:
                account.account_holder_name,
            active: account.active
        }));

        res.json({
            success: true,
            data: methods
        });

    } catch (error) {
        console.error(
            'Payment methods error:',
            error
        );

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});


// API TAO DON HANG
app.post('/api/orders', async (req, res) => {
    console.log('eheheh');
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

        const bankAccount = await getSepayBankAccount();

        // TAO LINK QR
        const qrUrl =
            `https://img.vietqr.io/image/` +
            `${bankAccount.bankId}-` +
            `${bankAccount.accountId}-compact.png` +
            `?amount=${amount}` +
            `&addInfo=${encodeURIComponent(paymentContent)}` +
            `&accountName=${encodeURIComponent(bankAccount.accountName)}`;


        // Deeplink
        const createDeeplink = (appId) => {
            const params = new URLSearchParams({
                app: appId,
                ba: `${bankAccount.accountId}@mb`,
                am: String(amount),
                tn: paymentContent,
                bn: bankAccount.accountName
            });

            return `https://dl.vietqr.io/pay?${params.toString()}`;
        };

        const deeplinks = {
            mb: createDeeplink('mb'),
            bidv: createDeeplink('bidv'),
            icb: createDeeplink('icb'),
            acb: createDeeplink('acb'),
            vcb: createDeeplink('vcb')
        };

        res.json({
            success: true,
            orderCode,
            ticketType,
            amount,
            qrUrl,
            deeplinks,
            status: 'PENDING'
        });
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