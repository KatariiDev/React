import { useMemo, useState } from "react";

const products = Array.from(
  { length: 100000 },
  (_, index) => `Sản phẩm ${index + 1}`,
);

export default function App() {
  const [query, setQuery] = useState("");
  const [darkMode, setDarkMode] = useState(false);

  // const filteredProducts = useMemo(() => {
  //   console.log("Đang lọc sản phẩm...");

  //   return products.filter((product) =>
  //     product
  //       .toLowerCase()
  //       .includes(query.toLowerCase()),
  //   );
  // }, [query]);

  const filteredProducts = () => {
    console.log("Đang lọc sản phẩm...");

    return products.filter((product) =>
      product
        .toLowerCase()
        .includes(query.toLowerCase()),
    );
  };

  const styles = {
    minHeight: "100vh",
    padding: "24px",
    backgroundColor: darkMode
      ? "#222"
      : "#ffffff",
    color: darkMode
      ? "#ffffff"
      : "#222",
  };

  return (
    <main style={styles}>
      <input
        value={query}
        onChange={(event) =>
          setQuery(event.target.value)
        }
        placeholder="Tìm sản phẩm"
      />

      <button
        onClick={() =>
          setDarkMode((current) => !current)
        }
      >
        Đổi giao diện
      </button>

      <p>
        Tìm thấy {filteredProducts.length} sản phẩm
      </p>

      {/* {filteredProducts
        .slice(0, 20)
        .map((product) => (
          <div key={product}>
            {product}
          </div>
        ))} */}

      {filteredProducts()
        .slice(0, 20)
        .map((product) => (
          <div key={product}>
            {product}
          </div>
        ))}
    </main>
  );
}