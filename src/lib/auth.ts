export type CustomerUser = {
  id: string;
  fullName: string;
  email: string;
  password: string;
  createdAt: string;
};

const USERS_KEY = "clickvape_customer_users";
const SESSION_KEY = "clickvape_customer_session";

const read = <T,>(key: string, fallback: T): T => {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const write = <T,>(key: string, value: T) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
};

export const getCustomerUsers = () => read<CustomerUser[]>(USERS_KEY, []);
export const getCustomerSession = () => read<CustomerUser | null>(SESSION_KEY, null);

export const registerCustomer = ({ fullName, email, password }: { fullName: string; email: string; password: string }) => {
  const users = getCustomerUsers();
  const normalizedEmail = email.trim().toLowerCase();
  if (users.some((user) => user.email === normalizedEmail)) {
    return { ok: false as const, message: "Já existe uma conta com esse e-mail." };
  }

  const user: CustomerUser = {
    id: `CU${Date.now().toString(36)}`,
    fullName: fullName.trim(),
    email: normalizedEmail,
    password,
    createdAt: new Date().toISOString(),
  };

  write(USERS_KEY, [user, ...users]);
  write(SESSION_KEY, user);
  return { ok: true as const, user };
};

export const loginCustomer = ({ email, password }: { email: string; password: string }) => {
  const normalizedEmail = email.trim().toLowerCase();
  const user = getCustomerUsers().find((item) => item.email === normalizedEmail && item.password === password);
  if (!user) {
    return { ok: false as const, message: "E-mail ou senha inválidos." };
  }
  write(SESSION_KEY, user);
  return { ok: true as const, user };
};

export const logoutCustomer = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_KEY);
};
