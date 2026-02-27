import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleLogin() {
    try {
      const res = await fetch("/api/cms/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }
      localStorage.setItem("cms_token", data.access_token);
      navigate("/dashboard");
    } catch {
      setError("Server error");
    }
  }

  useEffect(() => {
    const validateTokenRedirect = async () => {
      const token = localStorage.getItem("cms_token");
      if (!token) return;
      try {
        const res = await fetch("/api/dev/security/credentials", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.ok) {
          navigate("/dashboard");
        } else {
          localStorage.removeItem("cms_token");
        }
      } catch {
        setError("Server unreachable");
      }
    };
    validateTokenRedirect();
  }, [navigate]);

  return (
    <div className="h-screen flex">
      {/* LEFT */}

      <div className="w-1/2 bg-[#145c8c] flex flex-col justify-center items-center text-white">
        <img src="/cms/leden/logo.png" className="w-64 mb-4" />

        <p className="absolute bottom-5 text-sm">
          CMS By PT. Supranusa Sindata
        </p>
      </div>

      {/* RIGHT */}

      <div className="w-1/2 flex justify-center items-center">
        <div className="w-96">
          <h2 className="text-gray-500">Welcome to</h2>

          <h1 className="text-3xl font-bold mb-5">VHP User Dashboard</h1>

          {/* FORM START */}

          <form
            onSubmit={(e) => {
              e.preventDefault();

              handleLogin();
            }}
          >
            <input
              placeholder="Username"
              className="border w-full p-2 mb-3"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />

            <input
              type="password"
              placeholder="Password"
              className="border w-full p-2 mb-3"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {error && <p className="text-red-500">{error}</p>}

            <button
              type="submit"
              className="bg-[#1b8fc2] text-white w-full p-2 mt-3 hover:bg-[#1679a5]"
            >
              LOG IN
            </button>
          </form>

          {/* FORM END */}
        </div>
      </div>
    </div>
  );
}
