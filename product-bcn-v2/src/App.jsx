import React, { useState, useEffect } from 'react';
import './App.css';
import Jacket3DViewer from './components/Jacket3DViewer';

const FEATURES = [
  {
    t: "Weather-resistant shell",
    d: "Water-repellent outer shell protects against wind and rain.",
    i: <path d="M7 16a4 4 0 0 1 0-8 5 5 0 0 1 9.5-1A4.5 4.5 0 0 1 17 16zM9 19l-1 2M13 19l-1 2M17 19l-1 2" />
  },
  {
    t: "Thermal insulation",
    d: "Advanced padding traps heat and keeps you warm without unnecessary weight.",
    i: <path d="M10 14V5a2 2 0 0 1 4 0v9a4 4 0 1 1-4 0zM18 6v6M16 8l4 2M20 8l-4 2" />
  },
  {
    t: "Reinforced construction",
    d: "Durable stitching and structural panels for added strength.",
    i: <path d="M5 20L19 5M15 3c3 0 5 2 3 5M7 17l-2 3 3-2" />
  },
  {
    t: "Functional storage",
    d: "Multiple zippered pockets inside and outside to carry essentials.",
    i: <path d="M5 4h14v10a7 7 0 0 1-14 0zM8 8h8" />
  },
  {
    t: "Oversized fit",
    d: "Relaxed silhouette for movement, layering and everyday comfort.",
    i: <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
  },
];

const JACKETS = [
  {
    id: 1,
    n: "Shadow puffer jacket",
    p: 480,
    tags: ["Oversized fit", "Limited quantity"],
    colors: [
      { name: "Silver Ice", hex: "#e2e6eb" },
      { name: "Neon Volt", hex: "#b6e13a" },
      { name: "Obsidian", hex: "#11141a" }
    ]
  },
  {
    id: 2,
    n: "Tactical hooded jacket",
    p: 395,
    tags: ["Layering piece", "Utility"],
    colors: [
      { name: "Cyber Pink", hex: "#f06bb5" },
      { name: "Stealth", hex: "#15161b" },
      { name: "Arctic", hex: "#ffffff" }
    ]
  },
  {
    id: 3,
    n: "Thermal bomber jacket",
    p: 340,
    tags: ["Insulated", "Everyday"],
    colors: [
      { name: "Solar Orange", hex: "#ff5a1f" },
      { name: "Carbon", hex: "#1a1a1f" },
      { name: "Ghost White", hex: "#f0f2f5" }
    ]
  },
  {
    id: 4,
    n: "Tech shell jacket",
    p: 520,
    tags: ["Water-resistant", "Breathable"],
    colors: [
      { name: "Cobalt Blue", hex: "#1f4fe0" },
      { name: "Blackout", hex: "#0d0e12" },
      { name: "Titanium", hex: "#d8dce2" }
    ]
  },
];

export default function App() {
  const [cart, setCart] = useState(0);
  const [toast, setToast] = useState("");
  const [heroMode, setHeroMode] = useState("3d");
  const [heroColor, setHeroColor] = useState("#e2e6eb");
  const [showcaseColor, setShowcaseColor] = useState("#b6e13a");
  const [selectedJacket, setSelectedJacket] = useState(null);
  const [featureIndex, setFeatureIndex] = useState(0);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2000);
    return () => clearTimeout(t);
  }, [toast]);

  const addToCart = (name) => {
    setCart((c) => c + 1);
    setToast(`Added: ${name}`);
  };

  return (
    <div className="app-container">
      {/* NAVIGATION */}
      <nav>
        <a className="logo" href="#top">ARTEFAKT</a>
        <div className="links">
          <a href="#showcase">3D Studio</a>
          <a href="#collections">Collections</a>
          <a href="#details">Technology</a>
          <a href="#footer">About</a>
        </div>
        <div className="cart">Cart [ {cart} ]</div>
      </nav>

      {/* HERO SECTION WITH REALTIME 3D VIEW */}
      <header className="hero" id="top">
        <div className="view-switch">
          <button
            type="button"
            className={heroMode === "3d" ? "active" : ""}
            onClick={() => setHeroMode("3d")}
          >
            ★ 3D Interactive
          </button>
          <button
            type="button"
            className={heroMode === "photo" ? "active" : ""}
            onClick={() => setHeroMode("photo")}
          >
            Photo Mode
          </button>
        </div>

        {heroMode === "3d" && (
          <div className="hero-palette">
            <span className="hero-palette-label">COLORWAY</span>
            <div className="hero-palette-swatches">
              {["#e2e6eb", "#b6e13a", "#ff5a1f", "#1f4fe0", "#181a20"].map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`swatch-btn ${heroColor === c ? "active" : ""}`}
                  style={{ background: c }}
                  onClick={() => setHeroColor(c)}
                  title={`Color: ${c}`}
                />
              ))}
            </div>
          </div>
        )}

        {heroMode === "3d" ? (
          <div className="view-3d-wrap">
            <Jacket3DViewer
              color={heroColor}
              height="100%"
              autoRotateDefault={true}
              cameraDistance={4.2}
            />
          </div>
        ) : (
          <img
            className="jacket"
            src="https://images.unsplash.com/photo-1544022613-e87ca75a784a?auto=format&fit=crop&w=900&q=80"
            alt="Puffer jacket"
          />
        )}

        <div className="brk l">
          Engineered<br />for motion.<br />Built to endure.
        </div>
        <div className="brk r">
          Designed<br />for the unknown.<br />Ready for anything.
        </div>

        <div className="tag">Weather-resistant · Oversized fit · Modular Puffer</div>

        <div className="hero-actions">
          <a href="#showcase">
            <button className="btn-interactive-3d">
              Rotate 3D Jacket &nbsp;⟳
            </button>
          </a>
          <a href="#collections">
            <button className="shop">Shop now &nbsp;→</button>
          </a>
        </div>

        <div className="box l">
          <span>◎</span>
          <span>Est. 2026<br />Built on experience. Driven by 3D innovation.</span>
        </div>
        <div className="box r">
          <span>⌖</span>
          <span>Worldwide shipping<br />Fast &amp; secure delivery</span>
        </div>
      </header>

      {/* DEDICATED 3D STUDIO SHOWCASE */}
      <section className="showcase-3d" id="showcase">
        <div className="head">
          <div>
            <h2>3D Technical Studio.</h2>
            <p>Xoay 360°, phóng to chi tiết áo, xem góc nhìn kỹ thuật và đổi màu sắc theo ý muốn.</p>
          </div>
        </div>

        <div className="showcase-grid">
          <div className="showcase-canvas-box">
            <Jacket3DViewer
              color={showcaseColor}
              height="100%"
              autoRotateDefault={true}
              cameraDistance={4.0}
            />
          </div>

          <div className="showcase-info">
            <div className="showcase-specs">
              <div className="spec-item">
                <small>01 / MATERIAL SYSTEM</small>
                <b>Multi-Ply Ripstop Synthetic</b>
                <p>Khả năng chống thấm nước cấp độ quân sự kết hợp lớp phủ kim loại chống gió.</p>
              </div>
              <div className="spec-item">
                <small>02 / 3D PUFFER GEOMETRY</small>
                <b>Segmented Chamber Padding</b>
                <p>Các khoang phao đệm được tạo hình 3D đa hướng tối ưu nhiệt độ và giảm trọng lượng.</p>
              </div>
              <div className="spec-item">
                <small>03 / MODULAR CONTROLS</small>
                <b>Heavy-Duty Front YKK Zipper &amp; Utility Flap</b>
                <p>Khóa kéo kim loại trợ lực kèm dải phản quang neon ban đêm.</p>
              </div>

              <div className="showcase-color-picker">
                <small>CHOOSE 3D COLORWAY:</small>
                <div className="color-options">
                  {[
                    { label: "Volt Neon", hex: "#b6e13a" },
                    { label: "Silver Ice", hex: "#e2e6eb" },
                    { label: "Solar Flare", hex: "#ff5a1f" },
                    { label: "Cyber Blue", hex: "#1f4fe0" }
                  ].map((item) => (
                    <button
                      key={item.hex}
                      type="button"
                      className={`color-pill ${showcaseColor === item.hex ? "active" : ""}`}
                      onClick={() => setShowcaseColor(item.hex)}
                    >
                      <span className="dot" style={{ background: item.hex }} />
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ marginTop: '20px' }}>
              <button
                className="shop"
                style={{ width: '100%' }}
                onClick={() => addToCart("Custom 3D Puffer Jacket")}
              >
                Order this 3D Spec ($480) &nbsp;→
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* DETAILS / TECHNOLOGY SECTION */}
      <section className="details" id="details">
        <div>
          <h2>Details<br />matter.</h2>
          <p className="intro">
            A technical outer layer made for movement, changing weather and everything that happens beyond the expected.
          </p>
          <div className="vis">
            <Jacket3DViewer
              color="#e2e6eb"
              height="100%"
              autoRotateDefault={true}
              cameraDistance={4.5}
            />
            <a href="#collections">
              <button className="go">Explore the jacket &nbsp;→</button>
            </a>
          </div>
        </div>
        <ul className="feat">
          {FEATURES.map((f, k) => (
            <li
              key={f.t}
              className={featureIndex === k ? "on" : ""}
              onMouseEnter={() => setFeatureIndex(k)}
              onClick={() => setFeatureIndex(k)}
              tabIndex={0}
              onFocus={() => setFeatureIndex(k)}
            >
              <div>
                <small>0{k + 1}</small>
                <b>{f.t}</b>
                <p>{f.d}</p>
              </div>
              <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                {f.i}
              </svg>
            </li>
          ))}
        </ul>
      </section>

      {/* COLLECTIONS GRID */}
      <section className="coll" id="collections">
        <div className="head">
          <h2>Collections.</h2>
          <p>Technical jackets for changing weather, movement and everyday use.</p>
        </div>
        <div className="grid">
          {JACKETS.map((j, k) => (
            <Card
              key={j.id}
              j={j}
              k={k}
              onBuy={addToCart}
              onOpen3D={(jacket, color) => setSelectedJacket({ ...jacket, activeColor: color })}
            />
          ))}
        </div>
        <div className="all">
          <button onClick={() => addToCart("All Pack Bundle")}>
            View all jackets &nbsp;→
          </button>
        </div>
      </section>

      {/* MODAL 3D FULLSCREEN DIALOG */}
      {selectedJacket && (
        <div className="modal-overlay" onClick={() => setSelectedJacket(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close"
              type="button"
              onClick={() => setSelectedJacket(null)}
            >
              ✕ CLOSE
            </button>
            <div className="modal-canvas-wrap">
              <Jacket3DViewer
                color={selectedJacket.activeColor || selectedJacket.colors[0].hex}
                height="100%"
                cameraDistance={4.0}
                autoRotateDefault={true}
              />
            </div>
            <div className="modal-details">
              <div>
                <small style={{ color: "var(--mute)" }}>TECHNICAL 3D INSPECTION</small>
                <h3>{selectedJacket.n}</h3>
                <div className="modal-price">${selectedJacket.p}</div>
                <p style={{ color: "var(--mute)", fontSize: "12px", lineHeight: "1.6" }}>
                  Tương tác xoay 360 độ góc nhìn thực tế với hệ thống phao đệm bảo vệ đa tầng, vật liệu phản quang và cấu trúc vải siêu nhẹ.
                </p>
                <div style={{ marginTop: "16px" }}>
                  <small style={{ color: "var(--mute)", display: "block", marginBottom: "8px" }}>
                    COLORS:
                  </small>
                  <div style={{ display: "flex", gap: "8px" }}>
                    {selectedJacket.colors.map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        className="swatch-btn"
                        style={{
                          background: c.hex,
                          border: selectedJacket.activeColor === c.hex ? "2px solid var(--acc)" : "1px solid #444"
                        }}
                        onClick={() => setSelectedJacket({ ...selectedJacket, activeColor: c.hex })}
                        title={c.name}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <button
                className="shop"
                style={{ width: "100%", marginTop: "24px" }}
                onClick={() => {
                  addToCart(selectedJacket.n);
                  setSelectedJacket(null);
                }}
              >
                Add to cart (${selectedJacket.p}) &nbsp;→
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer id="footer">
        <span>ARTEFAKT © 2026 · TECHNICAL 3D LAB</span>
        <span>Worldwide shipping · Fast &amp; secure delivery</span>
      </footer>

      {/* TOAST ALERT */}
      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </div>
  );
}

function Card({ j, k, onBuy, onOpen3D }) {
  const [sw, setSw] = useState(0);
  const [hov, setHov] = useState(false);
  const [view3D, setView3D] = useState(false);

  const currentColor = j.colors[sw].hex;

  return (
    <article
      className="card"
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <div className="top">
        <span>0{k + 1}</span>
        <span>{j.colors[sw].name}</span>
      </div>
      <div className="nm">
        {j.n}
        <span>${j.p}</span>
      </div>
      <div className="pic">
        {view3D ? (
          <div className="card-3d-wrap">
            <Jacket3DViewer
              color={currentColor}
              height="100%"
              cameraDistance={4.4}
              autoRotateDefault={true}
              showStand={false}
            />
          </div>
        ) : (
          <img
            src="https://images.unsplash.com/photo-1544022613-e87ca75a784a?auto=format&fit=crop&w=600&q=80"
            alt={j.n}
            style={{
              filter: `hue-rotate(${k * 70}deg) saturate(${k === 0 ? 0.3 : 1.3})`
            }}
          />
        )}

        <div className="sw">
          {j.colors.map((c, i) => (
            <i
              key={c.hex}
              className={sw === i ? "on" : ""}
              style={{ background: c.hex }}
              onClick={(e) => {
                e.stopPropagation();
                setSw(i);
              }}
              title={c.name}
            />
          ))}
        </div>

        <button
          type="button"
          className="card-view-btn"
          onClick={(e) => {
            e.stopPropagation();
            setView3D(!view3D);
          }}
        >
          {view3D ? "Photo" : "3D View"}
        </button>
      </div>

      <div className="foot">
        {hov ? (
          <div style={{ display: "flex", gap: "6px", width: "100%" }}>
            <button
              className="buy"
              style={{ flex: 1 }}
              onClick={() => onBuy(j.n)}
            >
              Buy <span>→</span>
            </button>
            <button
              style={{ padding: "8px", fontSize: "10px", borderColor: "var(--acc)", color: "var(--acc)" }}
              onClick={() => onOpen3D(j, currentColor)}
              title="Mở xem 3D toàn cảnh"
            >
              3D ⛶
            </button>
          </div>
        ) : (
          j.tags.map((t) => <span key={t}>{t}</span>)
        )}
      </div>
    </article>
  );
}
