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

            // ==============================
            // KIỂM TRA TRẠNG THÁI THANH TOÁN
            // ==============================

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