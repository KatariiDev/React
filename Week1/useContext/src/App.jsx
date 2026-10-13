import { useRef, useState } from "react";

export default function App() {
  console.log("kkkkkk")
  const inputRef = useRef(null);
  const [message, setMessage] = useState("");

  function focusInput() {
    inputRef.current.focus();
  }

  function readInput() {
    setMessage(inputRef.current.value);
  }

  return (
    <main>
      <input
        ref={inputRef}
        placeholder="Nhập nội dung"
      />

      <button onClick={focusInput}>
        Focus input
      </button>

      <button onClick={readInput}>
        Đọc nội dung
      </button>

      <p>Nội dung: {message}</p>
    </main>
  );
}