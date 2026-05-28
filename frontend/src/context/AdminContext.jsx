import { createContext, useContext, useState } from 'react';

const AdminContext = createContext(null);

export function AdminProvider({ children }) {
  const [user, setUser] = useState(null);
  return <AdminContext.Provider value={{ user, setUser }}>{children}</AdminContext.Provider>;
}

export function useAdmin() {
  return useContext(AdminContext);
}
