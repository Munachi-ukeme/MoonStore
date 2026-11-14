# MoonStore

Build from home. Sell beyond home.

A MERN stack platform giving African fashion vendors their own branded online store, with marketplace discovery and escrow-protected payments, so buyers and sellers can transact securely without needing a physical shop.

## What It Does

- Each seller gets their own branded store, with their own name and link
- Products can also be discovered through the MoonStore marketplace, beyond the seller's own following
- Buyers browse, chat, and order directly inside the store, no WhatsApp back-and-forth, no screenshots
- Payments are held in escrow (via EscrowPay, with Rubies Microfinance Bank) until delivery is confirmed, protecting both buyer and seller
- One-time NIN verification required before a buyer's first payment, a requirement of the regulated banking partner holding escrow funds, not a MoonStore policy choice
- Individual product links for sharing on Instagram and WhatsApp
- Sellers manage products, orders, and buyer chats through a dashboard
- Store is live 24/7, always open

## Tech Stack

- **Frontend** — React + Vite + CSS3
- **Backend** — Node.js + Express
- **Database** — MongoDB Atlas
- **Image Upload** — Cloudinary
- **Auth** — JWT + bcrypt + Cloudflare
- **Payments & Escrow** — EscrowPay (Rubies Microfinance Bank)
- **Real-time Chat** — Socket.IO
- **Hosting** — Vercel (frontend) + Render (backend)