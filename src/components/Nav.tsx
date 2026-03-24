import type { FC } from 'hono/jsx';

interface NavProps {
  currentPath: string;
}

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/uses', label: 'My Gear' },
  { href: '/reading-list', label: 'Reading List' },
] as const;

export const Nav: FC<NavProps> = ({ currentPath }) => {
  return (
    <nav>
      <div class="nav-inner">
        <a href="/" class="nav-logo">CR</a>
        <ul class="nav-links">
          {navLinks.map((link) => (
            <li>
              <a
                href={link.href}
                class={currentPath === link.href ? 'active' : ''}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};
