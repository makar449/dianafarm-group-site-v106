# DIANAFARM v292 GitHub Admin Fix

Исправлено: на GitHub Pages админка больше не пытается логиниться через `/api/admin/login`, потому что GitHub Pages не запускает backend.

Пароль для статического режима GitHub Pages: `dianafarm2026`.

Важное ограничение: GitHub Pages сохраняет изменения админки только локально в браузере. Для общих обновлений на всех устройствах нужен Node backend / Render / Railway / VPS / Supabase.
