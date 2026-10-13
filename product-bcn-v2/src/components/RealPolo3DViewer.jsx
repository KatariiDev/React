import React, { useRef, useState, useEffect } from 'react';
import blackSheet from '../assets/bcn-black-sheet.jpg';
import whiteSheet from '../assets/bcn-white-sheet.jpg';

// BCN Lookbook Coordinates (percentages of total sheet)
// Top row (y: 0% to 47.5%): 5 poses (w: 20% each)
// Bottom row (y: 47.5% to 95%): 4 poses (w: 20% each)
// Right detail panel (x: 80% to 100%, y: 47.5% to 95%): 4 details
export const BCN_POSES = [
  { id: 'front', label: '01. Nhìn Thẳng', desc: 'Góc thẳng chuẩn form polo, khóa kéo kim loại & logo BCN ngực trái', x: 0, y: 0, w: 20, h: 47.5 },
  { id: 'side', label: '02. Nhìn Ngang', desc: 'Góc nghiêng 45° tôn vai áo và đường cắt may tinh tế', x: 20, y: 0, w: 20, h: 47.5 },
  { id: 'back', label: '03. Nhìn Sau', desc: 'Mặt sau in artwork BAN CÔNG NGHỆ - School Life Stories độc quyền', x: 40, y: 0, w: 20, h: 47.5 },
  { id: 'cross', label: '04. Khoanh Tay', desc: 'Dáng khoanh tay tự tin, bo dệt cổ tay áo ôm gọn gàng', x: 60, y: 0, w: 20, h: 47.5 },
  { id: 'relaxed', label: '05. Thư Giãn', desc: 'Phong cách thường ngày linh hoạt, trẻ trung và năng động', x: 80, y: 0, w: 20, h: 47.5 },
  { id: 'walking', label: '06. Di Chuyển', desc: 'Dáng đi năng động cùng balo đi học / làm việc thường ngày', x: 0, y: 47.5, w: 20, h: 47.5 },
  { id: 'coffee', label: '07. Cầm Cà Phê', desc: 'Góc phong cách sinh viên, thanh lịch năng động', x: 20, y: 47.5, w: 20, h: 47.5 },
  { id: 'working', label: '08. Làm Việc', desc: 'Góc làm việc cùng laptop - tinh thần Ban Công Nghệ', x: 40, y: 47.5, w: 20, h: 47.5 },
  { id: 'reading', label: '09. Đọc Sách', desc: 'Dáng ngồi thư giãn cùng sách & tài liệu học tập', x: 60, y: 47.5, w: 20, h: 47.5 },
  { id: 'collar', label: '10. Cổ Áo Zip', desc: 'Chi tiết cổ polo khóa kéo kim loại cao cấp & tag dệt', x: 80, y: 48, w: 20, h: 12 },
  { id: 'logo_front', label: '11. Logo Ngực', desc: 'In lụa cao thành sắc nét, không bong tróc', x: 80, y: 61, w: 20, h: 12 },
  { id: 'sleeve', label: '12. Bo Tay Áo', desc: 'Bo dệt kim rip co giãn 4 chiều mềm mại', x: 80, y: 74, w: 10, h: 21 },
  { id: 'logo_back', label: '13. Artwork Sau', desc: 'Graphic BCN vỡ khối độc bản của Ban Công Nghệ', x: 89.5, y: 74, w: 10.5, h: 21 },
];

export default function RealPolo3DViewer({
  color = 'black', // 'black' | 'white'
  initialPose = 'front',
  height = '540px',
  interactive = true,
  auto360 = false,
  showControls = true
}) {
  const [currentPoseIndex, setCurrentPoseIndex] = useState(0);
  const [isRotating, setIsRotating] = useState(auto360);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [viewAllSheet, setViewAllSheet] = useState(false); // Toggle to inspect full lookbook
  const dragStartRef = useRef({ x: 0, index: 0 });
  const cardRef = useRef(null);

  const main360Sequence = [0, 1, 2, 3, 4]; // 5 angles for 360 rotation
  const imgSrc = color === 'white' ? whiteSheet : blackSheet;

  useEffect(() => {
    const idx = BCN_POSES.findIndex(p => p.id === initialPose);
    if (idx !== -1) setCurrentPoseIndex(idx);
  }, [initialPose]);

  // Auto 360 Spin loop
  useEffect(() => {
    if (!isRotating || viewAllSheet) return;
    const interval = setInterval(() => {
      setCurrentPoseIndex((prev) => {
        const inSeq = main360Sequence.indexOf(prev);
        if (inSeq === -1 || inSeq === main360Sequence.length - 1) {
          return main360Sequence[0];
        }
        return main360Sequence[inSeq + 1];
      });
    }, 1800);
    return () => clearInterval(interval);
  }, [isRotating, viewAllSheet]);

  // 3D Tilt perspective with mouse
  const handleMouseMove = (e) => {
    if (!cardRef.current || isDragging || !interactive) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({
      x: -(y * 20),
      y: x * 24
    });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
    setIsHovered(false);
    setIsDragging(false);
  };

  // Drag horizontally to rotate between poses
  const handleMouseDown = (e) => {
    if (!interactive || viewAllSheet) return;
    setIsDragging(true);
    setIsRotating(false);
    dragStartRef.current = {
      x: e.clientX || (e.touches && e.touches[0].clientX) || 0,
      index: currentPoseIndex
    };
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    const curX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
    const diff = curX - dragStartRef.current.x;
    const step = 45;
    const change = Math.round(diff / step);
    if (change !== 0) {
      const count = main360Sequence.length;
      let newSeqIndex = (main360Sequence.indexOf(dragStartRef.current.index) - change) % count;
      if (newSeqIndex < 0) newSeqIndex += count;
      setCurrentPoseIndex(main360Sequence[newSeqIndex]);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const currentPose = BCN_POSES[currentPoseIndex] || BCN_POSES[0];

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: height,
        perspective: '1200px',
        overflow: 'hidden',
        background: '#07080b',
        border: '1px solid #232732',
        userSelect: 'none'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onTouchStart={handleMouseDown}
      onTouchMove={handlePointerMove}
      onTouchEnd={handleMouseUp}
    >
      {/* 3D Holographic Card */}
      <div
        ref={cardRef}
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          transformStyle: 'preserve-3d',
          transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(${zoomLevel})`,
          transition: isDragging ? 'none' : 'transform 0.15s ease-out',
          cursor: isDragging ? 'grabbing' : 'grab',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {viewAllSheet ? (
          /* View Entire Lookbook Sheet Mode */
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: color === 'white' ? '#181b22' : '#07080b',
              padding: '8px'
            }}
          >
            <img
              src={imgSrc}
              alt="BCN Full Lookbook Sheet"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain'
              }}
            />
          </div>
        ) : (
          /* High Performance CSS Background Crop (Precise Zoom to Current Pose) */
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              backgroundImage: `url(${imgSrc})`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: `${(currentPose.x / (100 - currentPose.w)) * 100}% ${(currentPose.y / (100 - currentPose.h)) * 100}%`,
              backgroundSize: `${(100 / currentPose.w) * 100}% ${(100 / currentPose.h) * 100}%`,
              transition: isDragging ? 'none' : 'background-position 0.25s ease-out',
              backgroundColor: color === 'white' ? '#e2e6eb' : '#0e1117'
            }}
          >
            {/* 3D Lighting Reflective Layer */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: `radial-gradient(circle at ${50 + tilt.y * 1.5}% ${50 - tilt.x * 1.5}%, rgba(255,255,255,0.16) 0%, transparent 65%)`,
                pointerEvents: 'none',
                mixBlendMode: 'overlay'
              }}
            />
            {/* Vignette Shadow */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                boxShadow: 'inset 0 0 60px rgba(0,0,0,0.5)',
                pointerEvents: 'none'
              }}
            />
          </div>
        )}

        {/* Floating 3D Badge on Model */}
        {!viewAllSheet && (
          <div
            style={{
              position: 'absolute',
              bottom: showControls ? '75px' : '20px',
              left: '18px',
              transform: 'translateZ(35px)',
              background: 'rgba(5, 7, 10, 0.9)',
              border: '1px solid #00ffcc',
              padding: '8px 14px',
              backdropFilter: 'blur(8px)',
              pointerEvents: 'none',
              boxShadow: '0 8px 24px rgba(0,255,204,0.18)',
              zIndex: 5
            }}
          >
            <div style={{ color: '#00ffcc', fontSize: '11px', fontWeight: 'bold', letterSpacing: '0.1em' }}>
              {currentPose.label}
            </div>
            <div style={{ color: '#9aa2b5', fontSize: '10px', marginTop: '2px', maxWidth: '280px', lineHeight: '1.4' }}>
              {currentPose.desc}
            </div>
          </div>
        )}
      </div>

      {/* Top Status Bar */}
      <div
        style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          right: '12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pointerEvents: 'none',
          zIndex: 10
        }}
      >
        <div
          style={{
            background: 'rgba(5, 7, 10, 0.88)',
            border: '1px solid #282d38',
            padding: '5px 10px',
            fontSize: '10px',
            letterSpacing: '0.12em',
            color: '#00ffcc',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00ffcc', boxShadow: '0 0 8px #00ffcc' }} />
          REAL 3D LOOKBOOK · BAN CÔNG NGHỆ 2026
        </div>

        {/* Quick Tools */}
        <div style={{ display: 'flex', gap: '6px', pointerEvents: 'auto' }}>
          <button
            type="button"
            onClick={() => setViewAllSheet(!viewAllSheet)}
            style={{
              background: viewAllSheet ? '#00ffcc' : 'rgba(5, 7, 10, 0.88)',
              color: viewAllSheet ? '#000' : '#e9ecf2',
              border: '1px solid #282d38',
              padding: '5px 10px',
              fontSize: '10px',
              cursor: 'pointer',
              fontWeight: 700
            }}
          >
            {viewAllSheet ? 'ĐÓNG TỔNG QUAN' : 'XEM TOÀN BỘ ẢNH'}
          </button>
          {!viewAllSheet && (
            <>
              <button
                type="button"
                onClick={() => setIsRotating(!isRotating)}
                style={{
                  background: isRotating ? '#00ffcc' : 'rgba(5, 7, 10, 0.88)',
                  color: isRotating ? '#000' : '#e9ecf2',
                  border: '1px solid #282d38',
                  padding: '5px 10px',
                  fontSize: '10px',
                  cursor: 'pointer',
                  fontWeight: 700
                }}
              >
                {isRotating ? '❚❚ DỪNG 360°' : '▶ TỰ ĐỘNG 360°'}
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel(zoomLevel === 1 ? 1.4 : 1)}
                style={{
                  background: zoomLevel > 1 ? '#00ffcc' : 'rgba(5, 7, 10, 0.88)',
                  color: zoomLevel > 1 ? '#000' : '#e9ecf2',
                  border: '1px solid #282d38',
                  padding: '5px 10px',
                  fontSize: '10px',
                  cursor: 'pointer'
                }}
              >
                {zoomLevel > 1 ? 'THU NHỎ' : 'PHÓNG TO 🔍'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Angle Selector Tabs */}
      {showControls && !viewAllSheet && (
        <div
          style={{
            position: 'absolute',
            bottom: '12px',
            left: '12px',
            right: '12px',
            display: 'flex',
            gap: '6px',
            overflowX: 'auto',
            paddingBottom: '4px',
            zIndex: 10
          }}
        >
          {BCN_POSES.map((pose, idx) => (
            <button
              key={pose.id}
              type="button"
              onClick={() => {
                setIsRotating(false);
                setCurrentPoseIndex(idx);
              }}
              style={{
                flexShrink: 0,
                background: currentPoseIndex === idx ? '#00ffcc' : 'rgba(5, 7, 10, 0.88)',
                color: currentPoseIndex === idx ? '#000' : '#e9ecf2',
                border: currentPoseIndex === idx ? '1px solid #00ffcc' : '1px solid #282d38',
                padding: '6px 10px',
                fontSize: '10px',
                cursor: 'pointer',
                fontWeight: currentPoseIndex === idx ? 800 : 500,
                transition: 'all 0.15s'
              }}
            >
              {pose.label}
            </button>
          ))}
        </div>
      )}

      {/* Drag instruction overlay */}
      {!viewAllSheet && (
        <div
          style={{
            position: 'absolute',
            bottom: showControls ? '54px' : '12px',
            right: '16px',
            fontSize: '9px',
            color: '#707788',
            letterSpacing: '0.1em',
            pointerEvents: 'none',
            textShadow: '0 2px 4px #000'
          }}
        >
          KÉO QUA LẠI ĐỂ XOAY 360° · RÊ CHUỘT TẠO HIỆU ỨNG 3D
        </div>
      )}
    </div>
  );
}
