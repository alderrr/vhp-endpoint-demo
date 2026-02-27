import { useEffect, useState, useRef } from "react";
import { Wrench, Trash2, ArrowUpDown, Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function CMS() {
  const navigate = useNavigate();
  const token = localStorage.getItem("cms_token");
  const [users, setUsers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 5;
  const [sortField, setSortField] = useState("username");
  const [sortAsc, setSortAsc] = useState(true);
  const [toast, setToast] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [showPassword, setShowPassword] = useState({});
  const [statusFilter, setStatusFilter] = useState("all");
  const [errors, setErrors] = useState({});
  const modalRef = useRef(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    username: "",
    password: "",
    hotelcode: "",
    directory: "",
    active: true,
  });

  const loadUsers = async () => {
    setLoading(true);
    const res = await fetch("/api/dev/security/credentials", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await res.json();
    setUsers(data);
    setLoading(false);
  };

  function showToast(msg, color = "green") {
    setToast({ msg, color });
    setTimeout(() => setToast(null), 3000);
  }

  function openAdd() {
    setEditMode(false);
    setForm({
      username: "",
      password: "",
      hotelcode: "",
      directory: "",
      active: true,
    });
    setShowModal(true);
  }

  function openEdit(user) {
    setEditMode(true);
    setForm(user);
    setShowModal(true);
  }

  async function saveUser() {
    let newErrors = {};
    if (!form.username) newErrors.username = "Required";
    if (!form.password) newErrors.password = "Required";
    if (!form.hotelcode) newErrors.hotelcode = "Required";
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;
    setSaving(true);
    try {
      if (editMode) {
        await fetch(`/api/dev/security/credentials/${form.hotelcode}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(form),
        });
        showToast("User updated");
      } else {
        await fetch("/api/dev/security/credentials", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(form),
        });
        showToast("User added");
      }
      setShowModal(false);
      loadUsers();
    } finally {
      setSaving(false);
    }
  }

  async function deleteUser() {
    try {
      await fetch(`/api/dev/security/credentials/${confirmDelete.hotelcode}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setConfirmDelete(null);
      showToast("User deleted", "red");
      loadUsers();
    } catch {
      showToast("Delete failed", "red");
    }
  }

  function logout() {
    localStorage.removeItem("cms_token");
    location.href = "/cms/leden/login";
  }

  function sort(col) {
    if (col === sortField) setSortAsc(!sortAsc);
    else {
      setSortField(col);
      setSortAsc(true);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    let data = [...users];
    if (statusFilter !== "all") {
      data = data.filter((u) =>
        statusFilter === "active" ? u.active === true : u.active !== true,
      );
    }
    data = data.filter((u) =>
      u.username.toLowerCase().includes(search.toLowerCase()),
    );
    data.sort((a, b) => {
      if (a[sortField] < b[sortField]) return sortAsc ? -1 : 1;
      if (a[sortField] > b[sortField]) return sortAsc ? 1 : -1;
      return 0;
    });
    setFiltered(data);
  }, [users, search, sortField, sortAsc, statusFilter]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        setShowModal(false);
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

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
        navigate("/login");
      }
    };
    validateTokenRedirect();
  }, [navigate]);

  const start = (page - 1) * perPage;
  const current = filtered.slice(start, start + perPage);
  const totalPages = Math.ceil(filtered.length / perPage);

  return (
    <div className="p-6 bg-slate-100 min-h-screen">
      {/* HEADER */}

      <div className="bg-[#145c8c] shadow-md">
        <div className="px-8 py-5 flex items-center justify-between">
          <h1 className="text-white text-2xl font-semibold">Manage Users</h1>

          <div className="flex gap-3">
            <button
              onClick={openAdd}
              className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2 rounded shadow transition"
            >
              Add User
            </button>

            <button
              onClick={logout}
              className="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded shadow transition"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* SEARCH */}

      <div className="mx-8 mt-6 bg-white shadow rounded-lg p-4">
        <div className="flex items-center gap-4">
          {/* SEARCH */}
          <div className="relative">
            <input
              placeholder="Search username..."
              className="border border-gray-300 rounded pl-10 pr-4 py-2 w-64 focus:ring focus:ring-blue-200 outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <svg
              className="absolute left-3 top-2.5 text-gray-400"
              width="16"
              height="16"
              fill="currentColor"
              viewBox="0 0 16 16"
            >
              <path d="M11.742 10.344l3.387 3.387-1.398 1.398-3.387-3.387a6.5 6.5 0 111.398-1.398z" />
            </svg>
          </div>

          {/* STATUS FILTER */}
          <select
            className="border border-gray-300 rounded px-4 py-2 focus:ring focus:ring-blue-200 outline-none text-gray-600"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* TABLE */}

      <div className="mx-8 mt-6 bg-white shadow-lg rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-10 flex justify-center">
            <div className="animate-spin w-10 h-10 border-b-2 border-blue-500 rounded-full"></div>
          </div>
        ) : (
          <table className="w-full table-fixed text-gray-700">
            <thead className="bg-gray-100 text-gray-600 border-b border-gray-300">
              <tr className="border-b border-gray-200 hover:bg-gray-50 transition">
                <th
                  onClick={() => sort("username")}
                  className="cursor-pointer w-4/15 px-6 py-4 text-left"
                >
                  <div className="flex items-center gap-2">
                    Username
                    <ArrowUpDown size={14} />
                  </div>
                </th>

                <th className="w-4/15 px-6 py-4 text-left">Password</th>

                <th
                  onClick={() => sort("directory")}
                  className="cursor-pointer w-4/15 px-6 py-4 text-left"
                >
                  <div className="flex items-center gap-2">
                    Directory
                    <ArrowUpDown size={14} />
                  </div>
                </th>

                <th className="w-2/15 px-6 py-4 text-left">Status</th>

                <th className="w-1/15 px-6 py-4 text-left">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {current.map((u, i) => (
                <tr key={i} className="border-t hover:bg-slate-50 transition">
                  <td className="p-3 w-4/15 px-6 py-4">
                    <div className="truncate">{u.username}</div>
                  </td>

                  <td className="w-4/15 px-6 py-4">
                    <div className="flex items-center gap-2 truncate">
                      <span>
                        {showPassword[u.hotelcode] ? u.password : "••••••••"}
                      </span>

                      {showPassword[u.hotelcode] ? (
                        <EyeOff
                          size={16}
                          className="cursor-pointer text-gray-500"
                          onClick={() =>
                            setShowPassword({
                              ...showPassword,
                              [u.hotelcode]: false,
                            })
                          }
                        />
                      ) : (
                        <Eye
                          size={16}
                          className="cursor-pointer text-gray-500"
                          onClick={() =>
                            setShowPassword({
                              ...showPassword,
                              [u.hotelcode]: true,
                            })
                          }
                        />
                      )}
                    </div>
                  </td>

                  <td className="w-4/15 px-6 py-4">
                    <div className="truncate">{u.directory}</div>
                  </td>

                  <td className="w-1/8 px-6 py-4">
                    <span
                      className={`font-medium ${u.active === true ? "text-green-600" : "text-gray-400"}`}
                    >
                      {u.active === true ? "Active" : "Inactive"}
                    </span>
                  </td>

                  <td className="w-1/15 px-6 py-4">
                    <div className="flex gap-3">
                      <Wrench
                        size={18}
                        className="text-yellow-500 cursor-pointer hover:text-yellow-600 transition"
                        onClick={() => openEdit(u)}
                      />
                      <Trash2
                        size={18}
                        className="text-red-500 cursor-pointer hover:text-red-600 transition"
                        onClick={() => setConfirmDelete(u)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* PAGINATION */}

      <div className="flex justify-center mt-4 gap-2">
        {[...Array(totalPages)].map((_, i) => (
          <button
            key={i}
            onClick={() => setPage(i + 1)}
            className="border px-3 py-1 rounded border-b border-gray-600 text-gray-600"
          >
            {i + 1}
          </button>
        ))}
      </div>

      {/* MODAL */}

      {showModal && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={(e) => {
            if (e.target === modalRef.current) setShowModal(false);
          }}
          ref={modalRef}
        >
          <div className="bg-white w-full max-w-md rounded-lg shadow-lg animate-fade-in">
            {/* HEADER */}

            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">
                {editMode ? "Edit User" : "Add User"}
              </h2>
            </div>

            {/* BODY */}

            <div className="px-6 py-5 space-y-4">
              {/* Username */}

              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Username
                </label>

                <input
                  type="text"
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring focus:ring-blue-200"
                  value={form.username}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      username: e.target.value,
                    })
                  }
                />
                {errors.username && (
                  <p className="text-red-500 text-sm mt-1">{errors.username}</p>
                )}
              </div>

              {/* Password */}

              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Password
                </label>

                <div className="relative">
                  <input
                    type={showPassword.modal ? "text" : "password"}
                    className="w-full border border-gray-300 rounded px-3 py-2 pr-10 focus:outline-none focus:ring focus:ring-blue-200"
                    value={form.password}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        password: e.target.value,
                      })
                    }
                  />
                  {errors.password && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.password}
                    </p>
                  )}

                  {showPassword.modal ? (
                    <EyeOff
                      size={18}
                      className="absolute right-3 top-2.5 cursor-pointer text-gray-500"
                      onClick={() =>
                        setShowPassword({
                          ...showPassword,
                          modal: false,
                        })
                      }
                    />
                  ) : (
                    <Eye
                      size={18}
                      className="absolute right-3 top-2.5 cursor-pointer text-gray-500"
                      onClick={() =>
                        setShowPassword({
                          ...showPassword,
                          modal: true,
                        })
                      }
                    />
                  )}
                </div>
              </div>

              {/* Hotelcode */}

              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Hotel Code
                </label>

                <input
                  type="text"
                  disabled={editMode}
                  className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-100"
                  value={form.hotelcode}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      hotelcode: e.target.value,
                    })
                  }
                />
                {errors.hotelcode && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.hotelcode}
                  </p>
                )}
              </div>

              {/* Directory */}

              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Directory
                </label>

                <input
                  type="text"
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring focus:ring-blue-200"
                  value={form.directory}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      directory: e.target.value,
                    })
                  }
                />
              </div>

              {/* Active */}

              {editMode && (
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Status
                  </label>

                  <div className="border border-gray-300 rounded px-3 py-2 bg-white hover:bg-gray-50 transition focus-within:ring focus-within:ring-blue-200">
                    <label className="flex items-center gap-3 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={form.active === true}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            active: e.target.checked,
                          })
                        }
                        className="w-4 h-4 accent-blue-500"
                      />

                      <span
                        className={`font-medium ${
                          form.active === true
                            ? "text-green-600"
                            : "text-gray-400"
                        }`}
                      >
                        {form.active === true ? "Active" : "Inactive"}
                      </span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* FOOTER */}

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-gray-300 rounded text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>

              <button
                onClick={saveUser}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-2"
                disabled={saving}
              >
                {saving && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                )}
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center">
          <div className="bg-white p-6 rounded">
            <h2 className="text-xl font-bold mb-4">Delete User</h2>
            <p>
              Are you sure you want to delete{" "}
              <strong>{confirmDelete.username}</strong>?
            </p>

            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setConfirmDelete(null)}>Cancel</button>

              <button
                onClick={deleteUser}
                className="bg-red-500 text-white px-4 py-2 rounded"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST */}

      {toast && (
        <div className="fixed bottom-5 right-5 bg-green-500 text-white px-4 py-2 rounded">
          {toast.msg}
        </div>
      )}
    </div>
  );
}
