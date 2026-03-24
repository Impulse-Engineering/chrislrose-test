import type { FC } from 'hono/jsx';

export const Footer: FC = () => {
  return (
    <footer>
      <div class="footer-inner">
        <p>&copy; 2026 Chris Rose. All rights reserved.</p>
        <ul class="footer-links">
          <li><a href="/">Home</a></li>
          <li><a href="/about">About</a></li>
          <li><a href="/uses">My Gear</a></li>
          <li><a href="/reading-list">Reading List</a></li>
        </ul>
      </div>
    </footer>
  );
};
