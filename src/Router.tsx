// src/router.tsx
import React, { useState, useEffect, createContext, useContext } from 'react';

type RouterContextType = {
  path: string;
  navigate: (to: string) => void;
};

const RouterContext = createContext<RouterContextType>({
  path: '/',
  navigate: () => {},
});

export const RouterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [path, setPath] = useState(() => window.location.pathname);

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const navigate = (to: string) => {
    window.history.pushState({}, '', to);
    setPath(to);
    window.scrollTo(0, 0);
  };

  return <RouterContext.Provider value={{ path, navigate }}>{children}</RouterContext.Provider>;
};

export const useRouter = () => useContext(RouterContext);

export const Route: React.FC<{
  path: string;
  exact?: boolean;
  children: React.ReactNode;
}> = ({ path, exact = true, children }) => {
  const { path: currentPath } = useRouter();

  // Normalize path to ignore trailing slashes (unless it's the root '/')
  const normalizedPath =
    currentPath.endsWith('/') && currentPath !== '/' ? currentPath.slice(0, -1) : currentPath;

  const match = exact ? normalizedPath === path : normalizedPath.startsWith(path);
  return match ? <>{children}</> : null;
};

export const Link: React.FC<React.AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }> = ({
  to,
  children,
  onClick,
  ...props
}) => {
  const { navigate } = useRouter();
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (to.startsWith('http') || to.startsWith('//')) return;
    e.preventDefault();
    onClick?.(e);
    navigate(to);
  };
  return (
    <a href={to} onClick={handleClick} {...props}>
      {children}
    </a>
  );
};
