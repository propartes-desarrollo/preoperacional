import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Center, Loader } from '@mantine/core';
import { getMe } from '../../api/adminApi.js';
import { useAdmin } from '../../context/AdminContext.jsx';

export function ProtectedRoute({ children }) {
  const [status, setStatus] = useState('checking');
  const navigate = useNavigate();
  const { setUser } = useAdmin();

  useEffect(() => {
    const token = localStorage.getItem('admin_jwt');
    if (!token) {
      navigate('/admin/login', { replace: true });
      return;
    }
    getMe()
      .then((user) => {
        setUser(user);
        setStatus('ok');
      })
      .catch(() => {
        localStorage.removeItem('admin_jwt');
        navigate('/admin/login', { replace: true });
      });
  }, []);

  if (status === 'checking') {
    return (
      <Center h="100vh">
        <Loader />
      </Center>
    );
  }
  return children;
}
