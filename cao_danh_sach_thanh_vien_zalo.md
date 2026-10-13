(async () => {
    console.log("🔄 Đang tiến hành cuộn trang để tải toàn bộ dữ liệu...");

    // Hàm cuộn trang tự động xuống đáy đến khi không còn tải thêm nữa
    const autoScroll = async () => {
        await new Promise((resolve) => {
            let totalHeight = 0;
            let distance = 500; // Khoảng cách cuộn mỗi nhịp (px)
            let timer = setInterval(() => {
                let scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;

                // Nếu cuộn đến đáy hoặc không tài nguyên nào mới được load thêm sau vài nhịp thì dừng
                if (totalHeight >= scrollHeight - window.innerHeight) {
                    clearInterval(timer);
                    setTimeout(resolve, 1000); // Đợi 1 giây để phần tử cuối kịp render
                }
            }, 300); // Tốc độ cuộn (300ms/lần)
        });
    };

    // Chạy hàm cuộn
    await autoScroll();
    console.log("✅ Đã cuộn xong, đang tiến hành trích xuất dữ liệu...");

    // 1. Tìm tất cả các phần tử có đồng thời cả 2 class
    const elements = document.querySelectorAll('.truncate.font-semibold');
    
    // 2. Lấy nội dung text và loại bỏ khoảng trắng thừa
    const contents = Array.from(elements)
        .map(el => el.innerText.trim())
        .filter(text => text.length > 0);

    // Lọc bỏ các dòng trùng lặp nếu có (tuỳ chọn)
    const uniqueContents = [...new Set(contents)];

    if (uniqueContents.length === 0) {
        console.warn("❌ Không tìm thấy phần tử nào có đồng thời class '.truncate.font-semibold'!");
        return;
    }

    // 3. Chuẩn bị dữ liệu CSV
    const csvHeader = "\uFEFFContent\n";
    const csvRows = uniqueContents.map(text => `"${text.replace(/"/g, '""')}"`).join("\n");
    const csvContent = csvHeader + csvRows;

    // 4. Tạo file và kích hoạt tải về tự động
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.setAttribute('href', url);
    link.setAttribute('download', `data_full_truncate_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log(`🎉 Đã xuất thành công ${uniqueContents.length} dòng ra file CSV!`);
})();