'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'admin', // default role
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    // Basic validation
    if (!form.email || !form.password || !form.firstName || !form.lastName) {
      setError('All fields are required');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('http://localhost:3000/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.message || 'Registration failed');
        setLoading(false);
        return;
      }

      const data = await res.json();
      setSuccess('User registered successfully!');
      setLoading(false);

      // Optionally redirect to login
      setTimeout(() => {
        router.push('/login');
      }, 1500);
    } catch (err) {
      setError('Server error');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-6 rounded shadow w-96">
        <h2 className="text-xl font-bold mb-4 text-center">Register User</h2>

        {error && <p className="text-red-600 mb-2">{error}</p>}
        {success && <p className="text-green-600 mb-2">{success}</p>}

        <input
          type="text"
          placeholder="First Name"
          name="firstName"
          value={form.firstName}
          onChange={handleChange}
          className="w-full border p-2 mb-3"
        />
        <input
          type="text"
          placeholder="Last Name"
          name="lastName"
          value={form.lastName}
          onChange={handleChange}
          className="w-full border p-2 mb-3"
        />
        <input
          type="email"
          placeholder="Email"
          name="email"
          value={form.email}
          onChange={handleChange}
          className="w-full border p-2 mb-3"
        />
        <input
          type="password"
          placeholder="Password"
          name="password"
          value={form.password}
          onChange={handleChange}
          className="w-full border p-2 mb-3"
        />

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-black text-white p-2 rounded"
        >
          {loading ? 'Registering...' : 'Register'}
        </button>
      </div>
    </div>
  );
}
