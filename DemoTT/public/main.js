const buttons = document.querySelectorAll('.buy');

buttons.forEach(button => {
    button.addEventListener('click', async (e) => {
        try {
            // Lấy loại vé
            const ticketContent = e.target.parentElement;

            const typeTicket = ticketContent
                .querySelector('.desc')
                .textContent
                .trim();

            // Chuyển "Vé Vừa" -> "VE VUA"
            const ticketType = typeTicket
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .toUpperCase();

            console.log('Đang tạo đơn:', ticketType);

            // Gọi backend tạo đơn hàng
            const response = await fetch('/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ticketType: ticketType
                })
            });

            const data = await response.json();

            // Backend báo lỗi
            if (!data.success) {
                alert(data.message);
                return;
            }

            const bankDeepLinks =
                document.getElementById('bankDeepLinks');

            bankDeepLinks.style.display = 'block';

            bankDeepLinks
                .querySelectorAll('.bank-btn')
                .forEach(button => {

                    const bank = button.dataset.bank;

                    button.onclick = () => {
                        const deeplink =
                            data.deeplinks?.[bank];

                        if (!deeplink) {
                            alert(
                                'Ngân hàng này chưa hỗ trợ deeplink'
                            );
                            return;
                        }

                        window.location.href = deeplink;
                    };
                });

            // Hiển thị thông tin đơn hàng
            document.getElementById('thongTinThanhToan').innerHTML = `
                ${data.ticketType} -
                ${Number(data.amount).toLocaleString('vi-VN')} VNĐ
                <br>
                Mã đơn: ${data.orderCode}
                <br>
                Trạng thái:
                <span id="trangThaiThanhToan">Đang chờ thanh toán...</span>
            `;

            // Hiển thị QR
            const imgQr = document.getElementById('anhQR');

            imgQr.src = data.qrUrl;
            imgQr.style.display = 'block';

            console.log('Đã tạo đơn:', data);
            
            // KIỂM TRA TRẠNG THÁI THANH TOÁN
            const orderCode = data.orderCode;

            const checkPayment = setInterval(async () => {
                try {
                    const statusResponse = await fetch(
                        `/api/orders/${encodeURIComponent(orderCode)}/status`
                    );

                    const statusData = await statusResponse.json();

                    if (!statusData.success) {
                        return;
                    }

                    const status = statusData.order.status;

                    const statusElement =
                        document.getElementById('trangThaiThanhToan');

                    if (!statusElement) {
                        clearInterval(checkPayment);
                        return;
                    }

                    // Thanh toán thành công
                    if (status === 'PAID') {
                        imgQr.style.display = 'none';
                        statusElement.innerHTML =
                            'Đã xác nhận thanh toán';

                        statusElement.style.color = 'green';

                        clearInterval(checkPayment);

                        console.log(
                            'Thanh toán thành công:',
                            orderCode
                        );
                    }
                } catch (error) {
                    console.error(
                        'Lỗi khi kiểm tra thanh toán:',
                        error
                    );
                }
            }, 2000);

        } catch (error) {
            console.error('Lỗi khi tạo đơn:', error);

            alert('Không thể tạo đơn hàng');
        }
    });
});

async function loadBankAccounts() {
    const select = document.getElementById('bankAccount');
    const selectedBank = document.getElementById('selectedBank');
    const confirmButton = document.getElementById('confirmBank');
    const confirmMessage = document.getElementById('confirmMessage');

    try {
        const response = await fetch('/api/payment-methods');
        const result = await response.json();

        if (!result.success) {
            throw new Error(
                result.message ||
                'Không lấy được danh sách tài khoản'
            );
        }

        select.innerHTML =
            '<option value="">-- Chọn tài khoản --</option>';

        result.data.forEach(account => {
            const option =
                document.createElement('option');

            option.value = account.id;

            option.textContent =
                `${account.bankName} - ` +
                `${account.accountNumber} - ` +
                `${account.accountHolder}`;

            option.dataset.bankName =
                account.bankName;

            option.dataset.accountNumber =
                account.accountNumber;

            option.dataset.accountHolder =
                account.accountHolder;

            select.appendChild(option);
        })

        select.addEventListener('change', () => {
            const option =
                select.options[select.selectedIndex];

            if (!option.value) {
                selectedBank.textContent = '';
                return;
            }
            selectedBank.textContent =
                `Đã chọn: ` +
                `${option.dataset.bankName} - ` +
                `${option.dataset.accountNumber} - ` +
                `${option.dataset.accountHolder}`;

            confirmMessage.textContent = '';
        });

        confirmButton.addEventListener(
            'click',
            async () => {
                const option =
                    select.options[select.selectedIndex];

                if (!option.value) {
                    confirmMessage.textContent =
                        'Vui lòng chọn tài khoản';

                    return;
                }

                const accountNumber =
                    option.dataset.accountNumber;

                const bankName =
                    option.dataset.bankName;

                const accountName =
                    option.dataset.accountHolder;

                try {
                    confirmButton.disabled = true;
                    confirmMessage.textContent = 'Đang xác nhận...';
                    const response =
                        await fetch(
                            '/api/admin/payment-account',
                            {
                                method: 'POST',

                                headers: {
                                    'Content-Type':
                                        'application/json'
                                },

                                body: JSON.stringify({
                                    accountNumber,
                                    bankName,
                                    accountName
                                })
                            }
                        );

                    const data =
                        await response.json();

                    if (!response.ok ||
                        !data.success) {

                        throw new Error(
                            data.message ||
                            'Xác nhận tài khoản thất bại'
                        );
                    }

                    confirmMessage.textContent =
                        `${data.message}`;

                    console.log(
                        'Tài khoản đã xác nhận:',
                        data.data
                    );

                } catch (error) {

                    console.error(
                        'Lỗi xác nhận:',
                        error
                    );

                    confirmMessage.textContent =
                        `${error.message}`;

                } finally {

                    confirmButton.disabled = false;
                }
            }
        );

    } catch (error) {

        console.error(
            'Lỗi tải tài khoản:',
            error
        );

        select.innerHTML =
            '<option value="">-- Không thể tải tài khoản --</option>';

        selectedBank.textContent = error.message;
    }
}

loadBankAccounts();