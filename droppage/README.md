# DropPage MVP

Статичний non-custodial сервіс для одноразових крипто-донатів.

## Що вже працює

- генератор кампанії без реєстрації
- share-link без бази даних: дані кампанії кодуються у URL hash
- обкладинка, назва, опис, автор, ціль, дедлайн
- EVM: Ethereum, Base, Arbitrum, Optimism, Polygon
- Solana
- ETH / USDC / SOL
- базова валідація адрес
- QR-код
- payment deep-link для native ETH/SOL
- explorer link
- copy wallet / copy share link / native share
- mobile-first responsive UI
- жодних seed phrase/private key
- кошти йдуть напряму на гаманець автора

## Важливі обмеження MVP

1. USDC зараз не формує автоматичний ERC-20 transfer URI, бо контрактні адреси різняться між мережами. Сторінка чітко показує мережу і адресу отримувача.
2. On-chain progress/історія донатів ще не підключені.
3. Обкладинка використовує зовнішній HTTPS URL, тому автор повинен використовувати стабільний image host.
4. Stateless URL підходить для MVP, але довгі описи роблять link довшим. Для production потрібен optional slug/backend.

## Безкоштовний deployment

Найпростіше: GitHub Pages, Vercel або Netlify. Усі файли знаходяться у папці `droppage/` і не потребують build step.

Для GitHub Pages можна опублікувати цю папку як static site. Для Vercel/Netlify root/output directory має бути `droppage`.

## Наступні кроки

1. Wallet ownership verification через підпис повідомлення.
2. Read-only on-chain payment tracking через public/free RPC або explorer API.
3. Progress bar і список останніх донатів.
4. Safe token registry для USDC по мережах та EIP-681 / Solana Pay.
5. Short slug через безкоштовний backend лише як optional layer.
6. Abuse/report flow та anti-scam labels.
7. Dynamic Open Graph cards для social sharing.
