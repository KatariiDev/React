import { useEffect, useState } from "react";

export default function App() {
  const [userId, setUserId] = useState(1);
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    setUser(null);
    setError("");

    fetch(
      `https://jsonplaceholder.typicode.com/users/${userId}`,
      { signal: controller.signal },
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error("Không thể tải người dùng");
        }

        return response.json();
      })
      .then((result) => {
        setUser(result);
      })
      .catch((fetchError) => {
        if (fetchError.name !== "AbortError") {
          setError(fetchError.message);
        }
      });

    return () => {
      controller.abort();
    };
  }, [userId]);

  return (
    <main>
      <button onClick={() => setUserId(1)}>
        User 1
      </button>

      <button onClick={() => setUserId(2)}>
        User 2
      </button>

      {error && <p>{error}</p>}

      {user
        ? <h1>{user.name}</h1>
        : <p>Đang tải...</p>}
    </main>
  );
}